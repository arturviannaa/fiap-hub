import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { CANAIS, SELECT_MENSAGEM, canalPermitido, gruposDoUsuario, type MensagemChat } from '@/lib/chat'
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
  // Grupo alheio nao existe do ponto de vista de quem nao participa.
  if (!(await canalPermitido(canal, u.id))) redirect('/chat')

  const [historico, grupos] = await Promise.all([
    sql<MensagemChat>(`${SELECT_MENSAGEM} WHERE m.canal = $1 ORDER BY m.id DESC LIMIT 80`, [canal]),
    gruposDoUsuario(u.id),
  ])

  return (
    <Chat
      canal={canal}
      canais={[...CANAIS]}
      grupos={grupos}
      historico={historico.reverse()}
      usuario={{ id: u.id, nome: u.nome, papel: u.papel }}
    />
  )
}
