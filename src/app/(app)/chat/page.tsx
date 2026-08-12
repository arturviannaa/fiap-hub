import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { CANAIS, canalValido, type MensagemChat } from '@/lib/chat'
import { Chat } from '@/components/chat'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Chat' }

export default async function PaginaChat({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>
}) {
  const u = await usuarioAtual()
  const canal = (await searchParams).canal || 'geral'
  if (!canalValido(canal)) redirect('/chat')

  const historico = await sql<MensagemChat>(
    `SELECT m.id, m.canal, m.corpo, m.criado_em, m.usuario_id, u.nome
     FROM mensagens m JOIN usuarios u ON u.id = m.usuario_id
     WHERE m.canal = $1 ORDER BY m.id DESC LIMIT 80`,
    [canal],
  )

  return (
    <Chat
      canal={canal}
      canais={[...CANAIS]}
      historico={historico.reverse()}
      usuario={{ id: u.id, nome: u.nome }}
    />
  )
}
