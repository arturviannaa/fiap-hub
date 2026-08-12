import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import { barramento, canalValido, type MensagemChat } from '@/lib/chat'

export const dynamic = 'force-dynamic'

// SSE: o navegador abre uma vez e recebe cada mensagem nova na hora. O gatilho
// NOTIFY no Postgres e quem avisa este processo.
export async function GET(req: Request, ctx: { params: Promise<{ canal: string }> }) {
  const sessao = await auth()
  if (!(sessao?.user as any)?.id) return new Response('não autenticado', { status: 401 })

  const { canal } = await ctx.params
  if (!canalValido(canal)) return new Response('canal inválido', { status: 404 })

  const bus = barramento()
  const codificador = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let vivo = true
      const enviar = (dado: unknown) => {
        if (vivo) controller.enqueue(codificador.encode(`data: ${JSON.stringify(dado)}\n\n`))
      }

      const aoNotificar = async ({ id, canal: c }: { id: number; canal: string }) => {
        if (c !== canal || !vivo) return
        const [msg] = await sql<MensagemChat>(
          `SELECT m.id, m.canal, m.corpo, m.criado_em, m.usuario_id, u.nome
           FROM mensagens m JOIN usuarios u ON u.id = m.usuario_id WHERE m.id = $1`,
          [id],
        )
        if (msg) enviar(msg)
      }

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
