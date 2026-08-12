import { um } from '@/lib/db'
import { todasAulas , totalAulasGlobais } from '@/lib/conteudo'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const eu = await usuarioDoToken(req)
  if (!eu) return naoAutorizado()
  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id < 1) return Response.json({ erro: 'inválido' }, { status: 400 })

  const p = await um<any>(
    `SELECT u.id, u.nome, u.email, u.bio, u.papeis, u.foto, u.criado_em, u.visto_em,
            (SELECT count(*) FROM progresso pr WHERE pr.usuario_id = u.id)::int AS aulas,
            (SELECT count(*) FROM notas n WHERE n.usuario_id = u.id AND n.publica)::int AS notas,
            (SELECT count(*) FROM arquivos a WHERE a.usuario_id = u.id AND a.publico)::int AS arquivos
     FROM usuarios u WHERE u.id = $1`,
    [id],
  )
  if (!p) return Response.json({ erro: 'não encontrado' }, { status: 404 })
  return Response.json({ ...p, total: totalAulasGlobais(), ehVoce: p.id === eu.id, souAdmin: eu.papeis.includes('admin') })
}
