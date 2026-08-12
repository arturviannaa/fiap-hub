import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { SELECT_MENSAGEM, barramento, canalPermitido, type MensagemChat } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// SSE: o navegador abre uma vez e recebe cada mensagem nova na hora. O gatilho
// NOTIFY no Postgres e quem avisa este processo.
export async function GET(req: Request, ctx: { params: Promise<{ canal: string }> }) {
  const sessao = await auth()
  const usuarioId = (sessao?.user as any)?.id
  if (!usuarioId) return new Response('não autenticado', { status: 401 })

  const { canal } = await ctx.params
  if (!(await canalPermitido(canal, usuarioId))) return new Response('sem acesso', { status: 403 })

  const bus = barramento()
  const codificador = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let vivo = true
      const enviar = (dado: unknown) => {
        if (vivo) controller.enqueue(codificador.encode(`data: ${JSON.stringify(dado)}\n\n`))
      }

      const aoNotificar = async ({ op, id, canal: c }: { op: string; id: number; canal: string }) => {
        if (c !== canal || !vivo) return
        if (op === 'del') return enviar({ op: 'del', id })
        const [msg] = await sql<MensagemChat>(`${SELECT_MENSAGEM} WHERE m.id = $1`, [id])
        if (msg) enviar({ op: 'nova', msg })
      }

      // Primeiro byte imediato: sem ele o proxy so libera os headers na
      // primeira mensagem, e o onopen do EventSource nunca dispara.
      controller.enqueue(codificador.encode(': conectado\n\n'))

      bus.on('mensagem', aoNotificar)

      // Comentario SSE periodico: mantem o proxy de pe e detecta aba fechada.
      const ping = setInterval(() => {
        if (vivo) controller.enqueue(codificador.encode(': ping\n\n'))
      }, 25000)

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
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
