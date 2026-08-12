import { acharAula, conteudo, vizinhas } from '@/lib/conteudo'
import { sql, um } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Uma aula: os blocos renderizados (HTML já pronto), se foi concluída, e as
// aulas vizinhas para navegação. O app monta um HTML só com esses blocos e
// mostra num componente de conteúdo.
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const { slug } = await ctx.params
  const aula = acharAula(slug)
  if (!aula) return Response.json({ erro: 'aula não encontrada' }, { status: 404 })

  const feito = await um('SELECT 1 FROM progresso WHERE usuario_id = $1 AND aula_slug = $2', [u.id, slug])
  const { anterior, proxima } = vizinhas(slug)

  return Response.json({
    slug: aula.slug,
    titulo: aula.titulo,
    moduloTitulo: aula.moduloTitulo,
    tags: aula.tags,
    minutos: aula.minutos,
    exemplos: aula.exemplos,
    atualizadoEm: aula.atualizadoEm,
    arquivoOrigem: aula.arquivoOrigem,
    fonte: conteudo().disciplina.fonte,
    concluida: !!feito,
    blocos: aula.blocos,
    anterior: anterior ? { slug: anterior.slug, titulo: anterior.titulo } : null,
    proxima: proxima ? { slug: proxima.slug, titulo: proxima.titulo } : null,
  })
}

// Marca/desmarca a aula como concluída (sincroniza com o site — mesmo progresso).
export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const { slug } = await ctx.params
  const { concluir } = await req.json().catch(() => ({}))
  if (concluir) {
    await sql('INSERT INTO progresso (usuario_id, aula_slug) VALUES ($1, $2) ON CONFLICT DO NOTHING', [u.id, slug])
  } else {
    await sql('DELETE FROM progresso WHERE usuario_id = $1 AND aula_slug = $2', [u.id, slug])
  }
  return Response.json({ ok: true, concluida: !!concluir })
}
