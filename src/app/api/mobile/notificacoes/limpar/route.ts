import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Limpa a caixa: marca o "limpo até agora"; o feed passa a mostrar só o que vier depois.
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  await sql('UPDATE usuarios SET notif_limpo_em = now(), notif_visto_em = now() WHERE id = $1', [u.id])
  return new Response(null, { status: 204 })
}
