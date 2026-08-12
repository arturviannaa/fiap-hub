import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Heartbeat de presença do app (mesmo mecanismo do site).
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  await sql("UPDATE usuarios SET visto_em = now() WHERE id = $1 AND visto_em < now() - interval '30 seconds'", [u.id])
  return new Response(null, { status: 204 })
}
