import { sql, um } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { canalPermitido, EMOJIS_REACAO } from '@/lib/chat'

// Toggle de reação: se o usuário já reagiu com aquele emoji, remove; senão, adiciona.
// O trigger reacoes_notifica avisa o SSE, então todo mundo no canal vê na hora.
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const { id, emoji } = await req.json().catch(() => ({}))
  const msgId = Number(id)
  if (!Number.isInteger(msgId) || !(EMOJIS_REACAO as readonly string[]).includes(emoji))
    return Response.json({ erro: 'inválido' }, { status: 400 })

  const msg = await um<{ canal: string }>('SELECT canal FROM mensagens WHERE id = $1', [msgId])
  if (!msg || !(await canalPermitido(msg.canal, u.id)))
    return Response.json({ erro: 'sem acesso' }, { status: 403 })

  const existe = await um('SELECT 1 FROM reacoes WHERE mensagem_id=$1 AND usuario_id=$2 AND emoji=$3', [msgId, u.id, emoji])
  if (existe) await sql('DELETE FROM reacoes WHERE mensagem_id=$1 AND usuario_id=$2 AND emoji=$3', [msgId, u.id, emoji])
  else await sql('INSERT INTO reacoes (mensagem_id, usuario_id, emoji) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING', [msgId, u.id, emoji])

  return Response.json({ ok: true })
}
