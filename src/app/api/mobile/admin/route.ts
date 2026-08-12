import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { limparTexto } from '@/lib/limites'

const PAPEIS = ['aluno', 'professor', 'admin']

export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  if (!u.papeis.includes('admin')) return Response.json({ erro: 'só admin' }, { status: 403 })

  const { acao, usuarioId, papel, nome } = await req.json().catch(() => ({}))
  const alvo = Number(usuarioId)
  if (!Number.isInteger(alvo)) return Response.json({ erro: 'inválido' }, { status: 400 })

  if (acao === 'papel') {
    if (!PAPEIS.includes(papel)) return Response.json({ erro: 'papel inválido' }, { status: 400 })
    if (alvo === u.id && papel === 'admin') return Response.json({ erro: 'não pode remover o próprio admin' }, { status: 400 })
    await sql(
      `UPDATE usuarios SET papeis = (
         SELECT ARRAY(SELECT DISTINCT e FROM unnest(
           CASE WHEN $1 = ANY(papeis) THEN array_remove(papeis, $1) ELSE papeis || $1 END) AS e))
       WHERE id = $2`,
      [papel, alvo],
    )
  } else if (acao === 'nome') {
    const limpo = limparTexto(String(nome || ''), 60)
    if (limpo.length < 2) return Response.json({ erro: 'nome curto' }, { status: 400 })
    await sql('UPDATE usuarios SET nome = $1 WHERE id = $2', [limpo, alvo])
  } else {
    return Response.json({ erro: 'ação inválida' }, { status: 400 })
  }
  const [p] = await sql<{ papeis: string[]; nome: string }>('SELECT papeis, nome FROM usuarios WHERE id = $1', [alvo])
  return Response.json({ ok: true, papeis: p?.papeis, nome: p?.nome })
}
