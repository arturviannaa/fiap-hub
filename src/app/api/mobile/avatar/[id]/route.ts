import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { Readable } from 'node:stream'
import { um } from '@/lib/db'
import { usuarioDoToken } from '@/lib/mobile-auth'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')

// Avatar para o app (valida por Bearer, não por cookie). Foto de perfil é
// pública entre a turma; sem foto = 404 e o app cai nas iniciais.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await usuarioDoToken(req))) return new Response('não autenticado', { status: 401 })
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id < 1) return new Response('inválido', { status: 400 })

  const u = await um<{ foto: string | null }>('SELECT foto FROM usuarios WHERE id = $1', [id])
  if (!u?.foto) return new Response('sem foto', { status: 404 })

  const caminho = join(UPLOAD_DIR, basename(u.foto))
  const info = await stat(caminho).catch(() => null)
  if (!info?.isFile()) return new Response('não encontrado', { status: 404 })

  const ext = u.foto.slice(u.foto.lastIndexOf('.') + 1).toLowerCase()
  const tipo = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
  return new Response(Readable.toWeb(createReadStream(caminho)) as ReadableStream, {
    headers: { 'Content-Type': tipo, 'Cache-Control': 'private, max-age=86400' },
  })
}
