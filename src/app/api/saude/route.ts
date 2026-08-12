import { um } from '@/lib/db'
import { conteudo } from '@/lib/conteudo'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await um('SELECT 1')
    const c = conteudo()
    return Response.json({ ok: true, aulas: c.disciplina.totalAulas, conteudoDe: c.geradoEm })
  } catch (e) {
    return Response.json({ ok: false, erro: String(e) }, { status: 503 })
  }
}
