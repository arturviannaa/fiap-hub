'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sql, um } from './db'
import { usuarioAtual } from './auth'
import { canalPermitido } from './chat'
import { COOLDOWN_CHAT_MS, esperaRestante, limparTexto, marcarAcao, permitido } from './limites'
import { PAPEIS, type Papel } from './papeis'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')

// Admin e professor não pegam cooldown de chat (avisos, responder dúvida em rajada).
const moderador = (u: { papeis: string[] }) => u.papeis.includes('admin') || u.papeis.includes('professor')
const MAX_BYTES = 25 * 1024 * 1024

// ---- progresso -----------------------------------------------------------

export async function alternarProgresso(aulaSlug: string, concluir: boolean) {
  const u = await usuarioAtual()
  if (concluir) {
    await sql(
      'INSERT INTO progresso (usuario_id, aula_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [u.id, aulaSlug],
    )
  } else {
    await sql('DELETE FROM progresso WHERE usuario_id = $1 AND aula_slug = $2', [u.id, aulaSlug])
  }
  revalidatePath('/', 'layout')
}

// ---- anotacoes -----------------------------------------------------------

export async function salvarNota(dados: FormData) {
  const u = await usuarioAtual()
  const id = Number(dados.get('id') || 0)
  if (!permitido(`nota:${u.id}`, 20, 60_000)) return
  const corpo = limparTexto(String(dados.get('corpo') || ''), 20000)
  const titulo = String(dados.get('titulo') || '').trim().slice(0, 160)
  const aula = String(dados.get('aula') || '') || null
  const publica = dados.get('publica') === 'on' || dados.get('publica') === 'true'
  if (!corpo) return
  if (id) {
    // O WHERE com usuario_id e a autorizacao: nao da para editar nota alheia.
    await sql(
      'UPDATE notas SET titulo=$1, corpo=$2, publica=$3, atualizado_em=now() WHERE id=$4 AND usuario_id=$5',
      [titulo, corpo, publica, id, u.id],
    )
  } else {
    await sql('INSERT INTO notas (usuario_id, aula_slug, titulo, corpo, publica) VALUES ($1,$2,$3,$4,$5)', [
      u.id,
      aula,
      titulo,
      corpo,
      publica,
    ])
  }
  revalidatePath('/anotacoes')
  if (aula) revalidatePath(`/aulas/${aula}`)
}

export async function apagarNota(id: number) {
  const u = await usuarioAtual()
  const admin = u.papeis.includes('admin')
  await sql(`DELETE FROM notas WHERE id = $1${admin ? '' : ' AND usuario_id = $2'}`, admin ? [id] : [id, u.id])
  revalidatePath('/anotacoes')
}

// ---- arquivos ------------------------------------------------------------

export async function enviarArquivo(dados: FormData) {
  const u = await usuarioAtual()
  if (!permitido(`upload:${u.id}`, 12, 600_000)) return { erro: 'Muitos envios seguidos. Espere alguns minutos.' }
  const arquivo = dados.get('arquivo')
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: 'Escolha um arquivo.' }
  if (arquivo.size > MAX_BYTES) return { erro: 'Arquivo maior que 25 MB.' }

  const armazenado = randomUUID() + extname(arquivo.name).slice(0, 12).replace(/[^\w.]/g, '')
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, armazenado), Buffer.from(await arquivo.arrayBuffer()))

  await sql(
    `INSERT INTO arquivos (usuario_id, aula_slug, nome, armazenado, mime, tamanho, descricao, publico)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      u.id,
      String(dados.get('aula') || '') || null,
      arquivo.name.slice(0, 200),
      armazenado,
      arquivo.type || 'application/octet-stream',
      arquivo.size,
      String(dados.get('descricao') || '').slice(0, 500),
      dados.get('publico') !== 'privado',
    ],
  )
  revalidatePath('/arquivos')
  return { ok: true }
}

export async function apagarArquivo(id: number) {
  const u = await usuarioAtual()
  const admin = u.papeis.includes('admin')
  const alvo = await um<{ armazenado: string }>(
    `DELETE FROM arquivos WHERE id = $1${admin ? '' : ' AND usuario_id = $2'} RETURNING armazenado`,
    admin ? [id] : [id, u.id],
  )
  if (alvo) await unlink(join(UPLOAD_DIR, alvo.armazenado)).catch(() => {})
  revalidatePath('/arquivos')
}

// ---- chat ----------------------------------------------------------------

const MIMES_ANEXO = /^(image\/(png|jpeg|gif|webp|avif)|application\/pdf|text\/(plain|csv|x-python)|application\/(json|zip|vnd\.openxmlformats-officedocument.*|msword|vnd\.ms-excel))$/
const MAX_ANEXO = 10 * 1024 * 1024

/** Envia mensagem com anexo opcional (arrastado, colado ou escolhido). */
export async function enviarMensagemComAnexo(dados: FormData) {
  const u = await usuarioAtual()
  const canal = String(dados.get('canal') || '')
  if (!(await canalPermitido(canal, u.id))) return { erro: 'Você não participa deste canal.' }

  if (!moderador(u)) {
    const espera = esperaRestante(`chat:${u.id}`, COOLDOWN_CHAT_MS)
    if (espera > 0) return { erro: `Aguarde ${espera}s para mandar outra mensagem.` }
  }

  const texto = limparTexto(String(dados.get('corpo') || ''))
  const anexo = dados.get('anexo')
  const temAnexo = anexo instanceof File && anexo.size > 0
  if (!texto && !temAnexo) return { erro: 'Mensagem vazia.' }

  let arquivoId: number | null = null
  if (temAnexo) {
    if (!permitido(`anexo:${u.id}`, 10, 600_000)) return { erro: 'Muitos anexos seguidos. Espere um pouco.' }
    if (anexo.size > MAX_ANEXO) return { erro: 'Anexo maior que 10 MB.' }
    if (!MIMES_ANEXO.test(anexo.type)) return { erro: 'Tipo de arquivo não permitido no chat.' }

    const armazenado = randomUUID() + extname(anexo.name).slice(0, 12).replace(/[^\w.]/g, '')
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(join(UPLOAD_DIR, armazenado), Buffer.from(await anexo.arrayBuffer()))
    const novo = await um<{ id: number }>(
      `INSERT INTO arquivos (usuario_id, nome, armazenado, mime, tamanho, publico, descricao)
       VALUES ($1,$2,$3,$4,$5,false,'anexo do chat') RETURNING id`,
      [u.id, anexo.name.slice(0, 200), armazenado, anexo.type, anexo.size],
    )
    arquivoId = novo!.id
  }

  marcarAcao(`chat:${u.id}`)
  await sql('INSERT INTO mensagens (canal, usuario_id, corpo, arquivo_id) VALUES ($1,$2,$3,$4)', [
    canal,
    u.id,
    texto,
    arquivoId,
  ])
  return { ok: true }
}

export async function enviarMensagem(canal: string, corpo: string) {
  const u = await usuarioAtual()
  // Canal vem do cliente: sem esta checagem daria para escrever em grupo alheio.
  if (!(await canalPermitido(canal, u.id))) return { erro: 'Você não participa deste canal.' }

  if (!moderador(u)) {
    const espera = esperaRestante(`chat:${u.id}`, COOLDOWN_CHAT_MS)
    if (espera > 0) return { erro: `Aguarde ${espera}s para mandar outra mensagem.` }
  }

  const texto = limparTexto(corpo)
  if (!texto) return { erro: 'Mensagem vazia.' }

  marcarAcao(`chat:${u.id}`)
  await sql('INSERT INTO mensagens (canal, usuario_id, corpo) VALUES ($1,$2,$3)', [canal, u.id, texto])
  return { ok: true }
}

// Autor apaga a propria; admin apaga a de qualquer um (moderacao da turma).
export async function apagarMensagem(id: number) {
  const u = await usuarioAtual()
  if (u.papeis.includes('admin')) await sql('DELETE FROM mensagens WHERE id = $1', [id])
  else await sql('DELETE FROM mensagens WHERE id = $1 AND usuario_id = $2', [id, u.id])
}

// ---- grupos --------------------------------------------------------------

export async function criarGrupo(dados: FormData) {
  const u = await usuarioAtual()
  if (!permitido(`grupo:${u.id}`, 5, 3_600_000)) return { erro: 'Você já criou grupos demais por hoje.' }

  const nome = limparTexto(String(dados.get('nome') || ''), 60)
  if (nome.length < 2) return { erro: 'Dê um nome ao grupo.' }
  const descricao = limparTexto(String(dados.get('descricao') || ''), 160)

  const membros = dados
    .getAll('membros')
    .map((m) => Number(m))
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 60)

  const grupo = await um<{ id: number }>(
    'INSERT INTO grupos (nome, descricao, criador_id) VALUES ($1,$2,$3) RETURNING id',
    [nome, descricao, u.id],
  )
  // O criador sempre entra; os convidados so entram se existirem de verdade.
  await sql(
    `INSERT INTO grupo_membros (grupo_id, usuario_id)
     SELECT $1, id FROM usuarios WHERE id = ANY($2::int[])
     ON CONFLICT DO NOTHING`,
    [grupo!.id, [u.id, ...membros]],
  )
  revalidatePath('/grupos')
  revalidatePath('/chat')
  redirect(`/chat?canal=g:${grupo!.id}`)
}

/** So quem ja esta no grupo pode trazer mais alguem. */
export async function convidarParaGrupo(grupoId: number, dados: FormData) {
  const u = await usuarioAtual()
  const usuarioId = Number(dados.get('usuarioId'))
  if (!Number.isInteger(usuarioId) || usuarioId < 1) return
  if (!(await canalPermitido(`g:${grupoId}`, u.id))) return
  await sql(
    `INSERT INTO grupo_membros (grupo_id, usuario_id)
     SELECT $1, id FROM usuarios WHERE id = $2 ON CONFLICT DO NOTHING`,
    [grupoId, usuarioId],
  )
  revalidatePath('/grupos')
}

export async function sairDoGrupo(grupoId: number) {
  const u = await usuarioAtual()
  await sql('DELETE FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2', [grupoId, u.id])
  // Grupo sem ninguem nao serve para nada: some junto com as mensagens.
  const [{ total }] = await sql<{ total: string }>(
    'SELECT count(*)::text AS total FROM grupo_membros WHERE grupo_id = $1',
    [grupoId],
  )
  if (total === '0') {
    await sql('DELETE FROM mensagens WHERE canal = $1', [`g:${grupoId}`])
    await sql('DELETE FROM grupos WHERE id = $1', [grupoId])
  }
  revalidatePath('/grupos')
  redirect('/grupos')
}

/** Remover membro: só o criador do grupo. */
export async function removerDoGrupo(grupoId: number, usuarioId: number) {
  const u = await usuarioAtual()
  const dono = await um('SELECT 1 FROM grupos WHERE id = $1 AND criador_id = $2', [grupoId, u.id])
  if (!dono || usuarioId === u.id) return
  await sql('DELETE FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2', [grupoId, usuarioId])
  revalidatePath('/grupos')
}

// ---- moderacao da turma --------------------------------------------------

/**
 * Liga/desliga uma tag de alguém. Só admin mexe. 'aluno' é base de todos e não
 * sai. O admin não remove o próprio admin — senão a turma poderia ficar sem
 * nenhum e sem como voltar atrás.
 */
export async function alternarPapel(usuarioId: number, papel: string) {
  const u = await usuarioAtual()
  if (!u.papeis.includes('admin')) return
  if (!PAPEIS.includes(papel as Papel)) return
  // Única trava: o admin não remove o próprio admin (evita se trancar pra fora).
  // 'aluno' É removível — professor não é aluno.
  if (usuarioId === u.id && papel === 'admin') return
  await sql(
    `UPDATE usuarios SET papeis = (
       SELECT ARRAY(SELECT DISTINCT e FROM unnest(
         CASE WHEN $1 = ANY(papeis) THEN array_remove(papeis, $1)
              ELSE papeis || $1 END) AS e))
     WHERE id = $2`,
    [papel, usuarioId],
  )
  revalidatePath('/turma')
  revalidatePath('/chat')
}

/** Nome ofensivo/gigante: admin normaliza sem precisar de psql. */
export async function renomearUsuario(usuarioId: number, dados: FormData) {
  const u = await usuarioAtual()
  if (!u.papeis.includes('admin')) return
  const nome = limparTexto(String(dados.get('nome') || ''), 60)
  if (nome.length < 2) return
  await sql('UPDATE usuarios SET nome = $1 WHERE id = $2', [nome, usuarioId])
  revalidatePath('/turma')
}

// ---- perfil --------------------------------------------------------------

const MIMES_FOTO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_FOTO = 5 * 1024 * 1024

export async function salvarFoto(dados: FormData) {
  const u = await usuarioAtual()
  if (!permitido(`foto:${u.id}`, 10, 600_000)) return { erro: 'Muitas trocas seguidas. Espere um pouco.' }

  const foto = dados.get('foto')
  if (!(foto instanceof File) || foto.size === 0) return { erro: 'Escolha uma imagem.' }
  if (foto.size > MAX_FOTO) return { erro: 'Imagem maior que 5 MB.' }
  const ext = MIMES_FOTO[foto.type]
  if (!ext) return { erro: 'Formato inválido — use JPG, PNG, WebP ou GIF.' }

  const armazenado = `avatar-${randomUUID()}.${ext}`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, armazenado), Buffer.from(await foto.arrayBuffer()))

  const antiga = await um<{ foto: string | null }>('SELECT foto FROM usuarios WHERE id = $1', [u.id])
  await sql('UPDATE usuarios SET foto = $1 WHERE id = $2', [armazenado, u.id])
  // Remove a foto anterior do disco para não acumular lixo.
  if (antiga?.foto) await unlink(join(UPLOAD_DIR, antiga.foto)).catch(() => {})

  revalidatePath('/perfil')
  revalidatePath('/', 'layout')
  revalidatePath('/turma')
  return { ok: true }
}

export async function removerFoto() {
  const u = await usuarioAtual()
  const antiga = await um<{ foto: string | null }>('SELECT foto FROM usuarios WHERE id = $1', [u.id])
  await sql('UPDATE usuarios SET foto = NULL WHERE id = $1', [u.id])
  if (antiga?.foto) await unlink(join(UPLOAD_DIR, antiga.foto)).catch(() => {})
  revalidatePath('/perfil')
  revalidatePath('/', 'layout')
}

export async function salvarPerfil(dados: FormData) {
  const u = await usuarioAtual()
  await sql('UPDATE usuarios SET nome = $1, bio = $2 WHERE id = $3', [
    limparTexto(String(dados.get('nome') || ''), 60) || u.nome,
    limparTexto(String(dados.get('bio') || ''), 280),
    u.id,
  ])
  revalidatePath('/perfil')
  revalidatePath('/', 'layout')
}
