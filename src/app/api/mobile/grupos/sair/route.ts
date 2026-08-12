import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Sai do grupo; se ficar vazio, apaga o grupo e as mensagens.
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const { grupoId } = await req.json().catch(() => ({}))
  const gid = Number(grupoId)
  if (!Number.isInteger(gid)) return Response.json({ erro: 'inválido' }, { status: 400 })
  await sql('DELETE FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2', [gid, u.id])
  const [{ total }] = await sql<{ total: string }>('SELECT count(*)::text AS total FROM grupo_membros WHERE grupo_id = $1', [gid])
  if (total === '0') {
    await sql('DELETE FROM mensagens WHERE canal = $1', [`g:${gid}`])
    await sql('DELETE FROM grupos WHERE id = $1', [gid])
  }
  return Response.json({ ok: true })
}
