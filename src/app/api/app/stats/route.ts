import { sql, um } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Números públicos pra landing (sem dados sensíveis): quantos alunos e downloads.
export async function GET() {
  const [{ usuarios }] = await sql<{ usuarios: string }>('SELECT count(*)::text AS usuarios FROM usuarios')
  const d = await um<{ valor: string }>("SELECT valor::text FROM contadores WHERE chave = 'downloads'")
  return Response.json(
    { usuarios: Number(usuarios), downloads: Number(d?.valor || 0) },
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' } },
  )
}
