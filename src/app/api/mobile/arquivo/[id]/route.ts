import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { Readable } from 'node:stream'
import { sql, um } from '@/lib/db'
import { usuarioDoToken } from '@/lib/mobile-auth'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
const INLINE = /^(image\/(png|jpeg|gif|webp|avif)|application\/pdf|text\/plain)$/

const CONSULTA = `
  SELECT a.nome, a.armazenado, a.mime FROM arquivos a
  WHERE a.id = $1 AND (
    a.publico OR a.usuario_id = $2
    OR EXISTS (SELECT 1 FROM mensagens m WHERE m.arquivo_id = a.id AND (
      m.canal !~ '^g:[0-9]+$'
      OR EXISTS (SELECT 1 FROM grupo_membros gm WHERE gm.usuario_id = $2
        AND gm.grupo_id = (CASE WHEN m.canal ~ '^g:[0-9]+$' THEN substring(m.canal from 3)::int END)))))`

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await usuarioDoToken(req)
  if (!u) return new Response('não autenticado', { status: 401 })
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id < 1) return new Response('inválido', { status: 400 })

  const arq = await um<{ nome: string; armazenado: string; mime: string }>(CONSULTA, [id, u.id])
  if (!arq) return new Response('não encontrado', { status: 404 })
  const caminho = join(UPLOAD_DIR, basename(arq.armazenado))
  const info = await stat(caminho).catch(() => null)
  if (!info?.isFile()) return new Response('não encontrado', { status: 404 })

  await sql('UPDATE arquivos SET downloads = downloads + 1 WHERE id = $1', [id])
  const inline = INLINE.test(arq.mime)
  return new Response(Readable.toWeb(createReadStream(caminho)) as ReadableStream, {
    headers: {
      'Content-Type': inline ? arq.mime : 'application/octet-stream',
      'Content-Length': String(info.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(arq.nome)}`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
