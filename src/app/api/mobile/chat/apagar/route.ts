import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const { id } = await req.json().catch(() => ({}))
  const msgId = Number(id)
  if (!Number.isInteger(msgId)) return Response.json({ erro: 'inválido' }, { status: 400 })
  if (u.papeis.includes('admin')) await sql('DELETE FROM mensagens WHERE id = $1', [msgId])
  else await sql('DELETE FROM mensagens WHERE id = $1 AND usuario_id = $2', [msgId, u.id])
  return Response.json({ ok: true })
}
