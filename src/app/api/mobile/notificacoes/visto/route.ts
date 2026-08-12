import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  await sql('UPDATE usuarios SET notif_visto_em = now() WHERE id = $1', [u.id])
  return new Response(null, { status: 204 })
}
