import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { sql, um } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { permitido } from '@/lib/limites'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')
const MIMES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const MAX = 5 * 1024 * 1024

// Upload da foto de perfil pelo app (multipart). Mesma regra do site.
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  if (!permitido(`foto:${u.id}`, 10, 600_000)) return Response.json({ erro: 'Muitas trocas. Espere um pouco.' }, { status: 429 })
  const form = await req.formData().catch(() => null)
  const foto = form?.get('foto')
  if (!(foto instanceof File) || foto.size === 0) return Response.json({ erro: 'Escolha uma imagem.' }, { status: 400 })
  if (foto.size > MAX) return Response.json({ erro: 'Imagem maior que 5 MB.' }, { status: 400 })
  const ext = MIMES[foto.type]
  if (!ext) return Response.json({ erro: 'Use JPG, PNG, WebP ou GIF.' }, { status: 400 })

  const armazenado = `avatar-${randomUUID()}.${ext}`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, armazenado), Buffer.from(await foto.arrayBuffer()))
  const antiga = await um<{ foto: string | null }>('SELECT foto FROM usuarios WHERE id = $1', [u.id])
  await sql('UPDATE usuarios SET foto = $1 WHERE id = $2', [armazenado, u.id])
  if (antiga?.foto) await unlink(join(UPLOAD_DIR, antiga.foto)).catch(() => {})
  return Response.json({ ok: true, foto: armazenado })
}

// Remover foto.
export async function DELETE(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const antiga = await um<{ foto: string | null }>('SELECT foto FROM usuarios WHERE id = $1', [u.id])
  await sql('UPDATE usuarios SET foto = NULL WHERE id = $1', [u.id])
  if (antiga?.foto) await unlink(join(UPLOAD_DIR, antiga.foto)).catch(() => {})
  return Response.json({ ok: true })
}
