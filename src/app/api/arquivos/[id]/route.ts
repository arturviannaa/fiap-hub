import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { auth } from '@/lib/auth'
import { sql, um } from '@/lib/db'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')

// Arquivo privado nunca sai por URL adivinhada: o SQL so devolve a linha se for
// publica ou do proprio dono.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sessao = await auth()
  const usuarioId = (sessao?.user as any)?.id
  if (!usuarioId) return new Response('não autenticado', { status: 401 })

  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id)) return new Response('inválido', { status: 400 })

  const arq = await um<{ nome: string; armazenado: string; mime: string }>(
    `SELECT nome, armazenado, mime FROM arquivos
     WHERE id = $1 AND (publico OR usuario_id = $2)`,
    [id, usuarioId],
  )
  if (!arq) return new Response('não encontrado', { status: 404 })

  const caminho = join(UPLOAD_DIR, arq.armazenado)
  const info = await stat(caminho).catch(() => null)
  if (!info) return new Response('não encontrado', { status: 404 })

  await sql('UPDATE arquivos SET downloads = downloads + 1 WHERE id = $1', [id])

  return new Response(Readable.toWeb(createReadStream(caminho)) as ReadableStream, {
    headers: {
      'Content-Type': arq.mime,
      'Content-Length': String(info.size),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(arq.nome)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
