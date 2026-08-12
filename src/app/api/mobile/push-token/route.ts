import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// O app registra aqui o token FCM do aparelho. Um token pertence a um usuário
// (se ele logar noutra conta, o token migra pra ela).
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const { token } = await req.json().catch(() => ({}))
  const t = String(token || '').trim()
  if (t.length < 10) return Response.json({ erro: 'token inválido' }, { status: 400 })
  await sql(
    `INSERT INTO push_tokens (token, usuario_id) VALUES ($1, $2)
     ON CONFLICT (token) DO UPDATE SET usuario_id = EXCLUDED.usuario_id, criado_em = now()`,
    [t, u.id],
  )
  return new Response(null, { status: 204 })
}
