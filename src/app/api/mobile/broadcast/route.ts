import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { enviarPush } from '@/lib/push'

// Push pra turma inteira (só admin). Usado pra anúncios e aviso de nova versão.
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  if (!u.papeis.includes('admin')) return Response.json({ erro: 'só admin' }, { status: 403 })
  const { titulo, corpo } = await req.json().catch(() => ({}))
  if (!titulo) return Response.json({ erro: 'sem título' }, { status: 400 })
  const todos = await sql<{ id: number }>('SELECT id FROM usuarios')
  await enviarPush(todos.map((t) => t.id), { titulo: String(titulo), corpo: String(corpo || '') })
  return Response.json({ ok: true, alvo: todos.length })
}
