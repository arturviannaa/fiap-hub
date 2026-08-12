import { pushTodos } from '@/lib/push'

// Chamado internamente (ex.: pelo serviço de sync ao detectar aula nova).
// Protegido por um segredo compartilhado, não por login.
export async function POST(req: Request) {
  const { secret, titulo, corpo, data } = await req.json().catch(() => ({}))
  if (!process.env.INTERNO_SECRET || secret !== process.env.INTERNO_SECRET)
    return new Response('proibido', { status: 403 })
  if (!titulo) return new Response('sem titulo', { status: 400 })
  await pushTodos(String(titulo), String(corpo || ''), data && typeof data === 'object' ? data : undefined)
  return Response.json({ ok: true })
}
