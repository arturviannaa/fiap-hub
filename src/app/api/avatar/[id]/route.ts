import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { Readable } from 'node:stream'
import { auth } from '@/lib/auth'
import { um } from '@/lib/db'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')

// Foto de perfil de qualquer membro: todo mundo já vê o rosto do colega no chat
// e na turma, então basta estar logado. Sem foto = 404 (o front cai nas iniciais).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sessao = await auth()
  if (!(sessao?.user as any)?.id) return new Response('não autenticado', { status: 401 })

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
    headers: {
      'Content-Type': tipo,
      'Content-Length': String(info.size),
      // o nome do arquivo muda a cada troca de foto, então cache longo é seguro
      'Cache-Control': 'private, max-age=604800',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
