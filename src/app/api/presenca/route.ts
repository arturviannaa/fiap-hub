import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Heartbeat de presença. O cliente bate aqui a cada ~45s enquanto a aba está
// aberta, então "ativo agora" reflete a realidade, não a hora do login.
// Só escreve se já passou tempo suficiente — no máximo um UPDATE por minuto.
export async function POST() {
  const sessao = await auth()
  const id = (sessao?.user as any)?.id
  if (!id) return new Response(null, { status: 401 })
  await sql("UPDATE usuarios SET visto_em = now() WHERE id = $1 AND visto_em < now() - interval '30 seconds'", [id])
  return new Response(null, { status: 204 })
}
