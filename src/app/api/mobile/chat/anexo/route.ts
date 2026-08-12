import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { sql, um } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { canalPermitido } from '@/lib/chat'
import { COOLDOWN_CHAT_MS, esperaRestante, limparTexto, marcarAcao, permitido } from '@/lib/limites'
import { pushMensagemGrupo } from '@/lib/push'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
const MAX = 10 * 1024 * 1024
const MIMES = /^(image\/(png|jpeg|gif|webp|avif)|application\/pdf|text\/(plain|csv|x-python)|application\/(json|zip|vnd\.openxmlformats-officedocument.*|msword|vnd\.ms-excel))$/
const moderador = (u: { papeis: string[] }) => u.papeis.includes('admin') || u.papeis.includes('professor')

export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const form = await req.formData().catch(() => null)
  const canal = String(form?.get('canal') || '')
  if (!(await canalPermitido(canal, u.id))) return Response.json({ erro: 'Sem acesso.' }, { status: 403 })
  if (!moderador(u)) {
    const espera = esperaRestante(`chat:${u.id}`, COOLDOWN_CHAT_MS)
    if (espera > 0) return Response.json({ erro: `Aguarde ${espera}s.` }, { status: 429 })
  }
  const texto = limparTexto(String(form?.get('corpo') || ''))
  const anexo = form?.get('anexo')
  if (!(anexo instanceof File) || anexo.size === 0) return Response.json({ erro: 'Sem anexo.' }, { status: 400 })
  if (!permitido(`anexo:${u.id}`, 10, 600_000)) return Response.json({ erro: 'Muitos anexos.' }, { status: 429 })
  if (anexo.size > MAX) return Response.json({ erro: 'Anexo maior que 10 MB.' }, { status: 400 })
  if (!MIMES.test(anexo.type)) return Response.json({ erro: 'Tipo não permitido.' }, { status: 400 })

  const armazenado = randomUUID() + extname(anexo.name).slice(0, 12).replace(/[^\w.]/g, '')
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, armazenado), Buffer.from(await anexo.arrayBuffer()))
  const novo = await um<{ id: number }>(
    `INSERT INTO arquivos (usuario_id, nome, armazenado, mime, tamanho, publico, descricao)
     VALUES ($1,$2,$3,$4,$5,false,'anexo do chat') RETURNING id`,
    [u.id, anexo.name.slice(0, 200), armazenado, anexo.type, anexo.size],
  )
  marcarAcao(`chat:${u.id}`)
  await sql('INSERT INTO mensagens (canal, usuario_id, corpo, arquivo_id) VALUES ($1,$2,$3,$4)', [canal, u.id, texto, novo!.id])
  pushMensagemGrupo(canal, u.id, u.nome, texto || 'enviou um anexo').catch(() => {})
  return Response.json({ ok: true })
}
