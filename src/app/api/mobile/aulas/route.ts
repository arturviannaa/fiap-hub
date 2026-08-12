import { conteudo } from '@/lib/conteudo'
import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Lista de módulos + aulas (só metadados, leve). Os blocos pesados ficam no
// endpoint da aula. Inclui o conjunto de aulas que o usuário já concluiu.
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const disc = new URL(req.url).searchParams.get('disciplina') || 'python'
  const c = conteudo(disc)
  const feitas = await sql<{ aula_slug: string }>('SELECT aula_slug FROM progresso WHERE usuario_id = $1', [u.id])

  return Response.json({
    disciplina: c.disciplina,
    concluidas: feitas.map((f) => f.aula_slug),
    modulos: c.modulos.map((m) => ({
      slug: m.slug,
      titulo: m.titulo,
      resumo: m.resumo,
      icone: m.icone,
      aulas: m.aulas.map((a) => ({
        slug: a.slug,
        titulo: a.titulo,
        tags: a.tags,
        minutos: a.minutos,
        exemplos: a.exemplos,
        atualizadoEm: a.atualizadoEm,
      })),
    })),
  })
}
