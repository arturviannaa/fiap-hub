import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const { id } = await req.json().catch(() => ({}))
  const nid = Number(id)
  if (!Number.isInteger(nid)) return Response.json({ erro: 'inválido' }, { status: 400 })
  const admin = u.papeis.includes('admin')
  await sql(`DELETE FROM notas WHERE id=$1${admin ? '' : ' AND usuario_id=$2'}`, admin ? [nid] : [nid, u.id])
  return Response.json({ ok: true })
}
