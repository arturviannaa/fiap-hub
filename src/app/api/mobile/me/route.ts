import { sql } from '@/lib/db'
import { todasAulas , totalAulasGlobais } from '@/lib/conteudo'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Perfil do usuário logado + estatísticas (igual à tela de perfil do site).
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const [s] = await sql<{ aulas: string; notas: string; arquivos: string; mensagens: string }>(
    `SELECT (SELECT count(*) FROM progresso WHERE usuario_id=$1)::text AS aulas,
            (SELECT count(*) FROM notas WHERE usuario_id=$1)::text AS notas,
            (SELECT count(*) FROM arquivos WHERE usuario_id=$1)::text AS arquivos,
            (SELECT count(*) FROM mensagens WHERE usuario_id=$1)::text AS mensagens`,
    [u.id],
  )
  // Ofensiva: dias consecutivos ativos, contando a partir de hoje (ou de ontem,
  // se ainda não bateu o heartbeat de hoje). Sem gap = a sequência continua.
  const [{ streak }] = await sql<{ streak: number }>(
    `WITH d AS (SELECT dia, row_number() OVER (ORDER BY dia DESC) AS rn FROM atividade WHERE usuario_id = $1),
          base AS (SELECT CASE WHEN EXISTS (SELECT 1 FROM atividade WHERE usuario_id = $1 AND dia = current_date)
                               THEN current_date ELSE current_date - 1 END AS b)
     SELECT count(*)::int AS streak FROM d, base WHERE d.dia = base.b - (d.rn - 1)::int`,
    [u.id],
  )
  return Response.json({ usuario: u, total: totalAulasGlobais(), stats: s, streak })
}
