'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { revalidatePath } from 'next/cache'
import { sql, um } from './db'
import { usuarioAtual } from './auth'
import { canalValido } from './chat'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
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
  const corpo = String(dados.get('corpo') || '').trim()
  const titulo = String(dados.get('titulo') || '').trim().slice(0, 160)
  const aula = String(dados.get('aula') || '') || null
  const publica = dados.get('publica') === 'on' || dados.get('publica') === 'true'
  if (!corpo) return
  if (id) {
    // O WHERE com usuario_id e a autorizacao: nao da para editar nota alheia.
    await sql(
      'UPDATE notas SET titulo=$1, corpo=$2, publica=$3, atualizado_em=now() WHERE id=$4 AND usuario_id=$5',
      [titulo, corpo.slice(0, 20000), publica, id, u.id],
    )
  } else {
    await sql('INSERT INTO notas (usuario_id, aula_slug, titulo, corpo, publica) VALUES ($1,$2,$3,$4,$5)', [
      u.id,
      aula,
      titulo,
      corpo.slice(0, 20000),
      publica,
    ])
  }
  revalidatePath('/anotacoes')
  if (aula) revalidatePath(`/aulas/${aula}`)
}

export async function apagarNota(id: number) {
  const u = await usuarioAtual()
  const cond = u.papel === 'admin' ? '' : ' AND usuario_id = $2'
  await sql(`DELETE FROM notas WHERE id = $1${cond}`, u.papel === 'admin' ? [id] : [id, u.id])
  revalidatePath('/anotacoes')
}

// ---- arquivos ------------------------------------------------------------

export async function enviarArquivo(dados: FormData) {
  const u = await usuarioAtual()
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
  const dono = u.papel === 'admin' ? '' : ' AND usuario_id = $2'
  const alvo = await um<{ armazenado: string }>(
    `DELETE FROM arquivos WHERE id = $1${dono} RETURNING armazenado`,
    u.papel === 'admin' ? [id] : [id, u.id],
  )
  if (alvo) await unlink(join(UPLOAD_DIR, alvo.armazenado)).catch(() => {})
  revalidatePath('/arquivos')
}

// ---- chat ----------------------------------------------------------------

export async function enviarMensagem(canal: string, corpo: string) {
  const u = await usuarioAtual()
  const texto = corpo.trim().slice(0, 2000)
  // Canal vem do cliente: sem esta checagem daria para inventar canal novo.
  if (!texto || !canalValido(canal)) return
  await sql('INSERT INTO mensagens (canal, usuario_id, corpo) VALUES ($1,$2,$3)', [canal, u.id, texto])
}

// ---- perfil --------------------------------------------------------------

export async function salvarPerfil(dados: FormData) {
  const u = await usuarioAtual()
  await sql('UPDATE usuarios SET nome = $1, bio = $2 WHERE id = $3', [
    String(dados.get('nome') || u.nome).trim().slice(0, 80) || u.nome,
    String(dados.get('bio') || '').trim().slice(0, 280),
    u.id,
  ])
  revalidatePath('/perfil')
  revalidatePath('/', 'layout')
}
