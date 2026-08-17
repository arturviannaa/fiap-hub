import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { limparTexto } from '@/lib/limites'

// Edita anotação (só o dono, ou admin).
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const b = await req.json().catch(() => ({}))
  const id = Number(b.id)
  if (!Number.isInteger(id)) return Response.json({ erro: 'inválido' }, { status: 400 })
  const corpo = limparTexto(String(b.corpo || ''), 20000)
  if (!corpo) return Response.json({ erro: 'Escreva algo.' }, { status: 400 })
  const titulo = String(b.titulo || '').trim().slice(0, 160)
  const publica = !!b.publica
  const admin = u.papeis.includes('admin')
  const r = await sql<{ id: number }>(
    `UPDATE notas SET titulo=$1, corpo=$2, publica=$3, atualizado_em=now()
     WHERE id=$4${admin ? '' : ' AND usuario_id=$5'} RETURNING id`,
    admin ? [titulo, corpo, publica, id] : [titulo, corpo, publica, id, u.id],
  )
  if (r.length === 0) return Response.json({ erro: 'não encontrada ou sem permissão' }, { status: 404 })
  return Response.json({ ok: true })
}
