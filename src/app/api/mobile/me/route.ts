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
  return Response.json({ usuario: u, total: totalAulasGlobais(), stats: s })
}
