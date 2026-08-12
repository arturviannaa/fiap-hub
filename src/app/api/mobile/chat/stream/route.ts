import { sql } from '@/lib/db'
import { usuarioDoToken } from '@/lib/mobile-auth'
import { anexarReacoes, SELECT_MENSAGEM, barramento, canalPermitido, type MensagemChat } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// SSE do chat para o app. O OkHttp do Android manda o Bearer no header (o
// EventSource do browser não conseguiria, mas o cliente nativo sim).
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return new Response('não autenticado', { status: 401 })

  const canal = new URL(req.url).searchParams.get('canal') || 'geral'
  if (!(await canalPermitido(canal, u.id))) return new Response('sem acesso', { status: 403 })

  const bus = barramento()
  const enc = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let vivo = true
      const enviar = (d: unknown) => vivo && controller.enqueue(enc.encode(`data: ${JSON.stringify(d)}\n\n`))

      const aoNotificar = async ({ op, id, canal: c }: { op: string; id: number; canal: string }) => {
        if (c !== canal || !vivo) return
        if (op === 'del') return enviar({ op: 'del', id })
        const [msg] = await sql<MensagemChat>(`${SELECT_MENSAGEM} WHERE m.id = $1`, [id])
        if (msg) {
          const [comReacoes] = await anexarReacoes([msg], u.id)
          enviar({ op: 'nova', msg: comReacoes })
        }
      }

      controller.enqueue(enc.encode(': conectado\n\n'))
      bus.on('mensagem', aoNotificar)
      const ping = setInterval(() => vivo && controller.enqueue(enc.encode(': ping\n\n')), 25000)

      const encerrar = () => {
        if (!vivo) return
        vivo = false
        clearInterval(ping)
        bus.off('mensagem', aoNotificar)
        try {
          controller.close()
        } catch {}
      }
      req.signal.addEventListener('abort', encerrar)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
