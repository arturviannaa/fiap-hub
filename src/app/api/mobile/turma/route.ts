import { sql } from '@/lib/db'
import { todasAulas } from '@/lib/conteudo'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// A turma: mesma listagem do site (progresso, tags, presença).
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const membros = await sql<{
    id: number
    nome: string
    papeis: string[]
    foto: string | null
    bio: string
    visto_em: string
    aulas: number
  }>(
    `SELECT u.id, u.nome, u.papeis, u.foto, u.bio, u.visto_em,
            (SELECT count(*) FROM progresso p WHERE p.usuario_id = u.id)::int AS aulas
     FROM usuarios u
     ORDER BY (SELECT count(*) FROM progresso p WHERE p.usuario_id = u.id) DESC, u.nome`,
  )

  return Response.json({ total: todasAulas().length, euId: u.id, membros })
}
