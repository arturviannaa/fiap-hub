import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { canaisDaDisciplina, SELECT_MENSAGEM, canalPermitido, gruposDoUsuario, type MensagemChat } from '@/lib/chat'
import { discAtiva } from '@/lib/disciplina'
import { Chat } from '@/components/chat'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Chat' }

export default async function PaginaChat({
  searchParams,
}: {
  searchParams: Promise<{ canal?: string }>
}) {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const canal = (await searchParams).canal || `${disc}:geral`
  // Grupo alheio nao existe do ponto de vista de quem nao participa.
  if (!(await canalPermitido(canal, u.id))) redirect('/chat')

  const [historico, grupos] = await Promise.all([
    sql<MensagemChat>(`${SELECT_MENSAGEM} WHERE m.canal = $1 ORDER BY m.id DESC LIMIT 80`, [canal]),
    gruposDoUsuario(u.id),
  ])

  return (
    <Chat
      canal={canal}
      canais={canaisDaDisciplina(disc)}
      grupos={grupos}
      historico={historico.reverse()}
      usuario={{ id: u.id, nome: u.nome, papeis: u.papeis }}
    />
  )
}
