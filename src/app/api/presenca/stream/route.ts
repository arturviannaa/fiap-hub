import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const JANELA = "90 seconds" // online = heartbeat nos últimos 90s
const INTERVALO = 15000

// Stream de presença: empurra o conjunto de quem está online a cada 15s (e na
// hora que a aba conecta). Fica offline é a AUSÊNCIA de heartbeat — não há
// evento pra escutar via NOTIFY, então recalculamos e empurramos. O cliente
// atualiza os pontinhos sem recarregar a página.
// ponytail: uma query por conexão a cada 15s; para uma turma isso é ~nada. Se
// um dia forem centenas, trocar por um único timer que faz broadcast.
export async function GET(req: Request) {
  if (!(await auth())?.user) return new Response('não autenticado', { status: 401 })

  const enc = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let vivo = true
      const empurra = async () => {
        if (!vivo) return
        const linhas = await sql<{ id: number }>(
          `SELECT id FROM usuarios WHERE visto_em > now() - interval '${JANELA}'`,
        ).catch(() => null)
        if (linhas && vivo)
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ online: linhas.map((l) => l.id) })}\n\n`))
      }

      controller.enqueue(enc.encode(': conectado\n\n'))
      empurra()
      const timer = setInterval(empurra, INTERVALO)

      const encerrar = () => {
        if (!vivo) return
        vivo = false
        clearInterval(timer)
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
