import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { permitido } from '@/lib/limites'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
const MAX = 25 * 1024 * 1024

type Material = {
  id: number; nome: string; descricao: string; tamanho: number; publico: boolean
  aula_slug: string | null; usuario_id: number; downloads: number; criado_em: string; autor: string
}

export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const params = new URL(req.url).searchParams
  const disc = params.get('disciplina') || 'python'
  const aba = params.get('aba') === 'meus' ? 'meus' : 'turma'
  const materiais = await sql<Material>(
    aba === 'meus'
      ? `SELECT a.id,a.nome,a.descricao,a.tamanho,a.publico,a.aula_slug,a.usuario_id,a.downloads,a.criado_em, u.nome AS autor
         FROM arquivos a JOIN usuarios u ON u.id=a.usuario_id WHERE a.usuario_id=$1 AND a.disciplina=$2 AND a.descricao<>'anexo do chat' ORDER BY a.id DESC`
      : `SELECT a.id,a.nome,a.descricao,a.tamanho,a.publico,a.aula_slug,a.usuario_id,a.downloads,a.criado_em, u.nome AS autor
         FROM arquivos a JOIN usuarios u ON u.id=a.usuario_id WHERE a.publico AND a.disciplina=$1 AND a.descricao<>'anexo do chat' ORDER BY a.id DESC`,
    aba === 'meus' ? [u.id, disc] : [disc],
  )
  return Response.json({ materiais, euId: u.id })
}

// Upload de material pelo app (multipart).
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  if (!permitido(`upload:${u.id}`, 12, 600_000)) return Response.json({ erro: 'Muitos envios. Espere um pouco.' }, { status: 429 })
  const form = await req.formData().catch(() => null)
  const arquivo = form?.get('arquivo')
  if (!(arquivo instanceof File) || arquivo.size === 0) return Response.json({ erro: 'Escolha um arquivo.' }, { status: 400 })
  if (arquivo.size > MAX) return Response.json({ erro: 'Arquivo maior que 25 MB.' }, { status: 400 })

  const armazenado = randomUUID() + extname(arquivo.name).slice(0, 12).replace(/[^\w.]/g, '')
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, armazenado), Buffer.from(await arquivo.arrayBuffer()))
  await sql(
    `INSERT INTO arquivos (usuario_id, aula_slug, nome, armazenado, mime, tamanho, descricao, publico, disciplina)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [u.id, null, arquivo.name.slice(0, 200), armazenado, arquivo.type || 'application/octet-stream',
     arquivo.size, String(form?.get('descricao') || '').slice(0, 500), form?.get('publico') !== 'privado', String(form?.get('disciplina') || 'python')],
  )
  return Response.json({ ok: true })
}
