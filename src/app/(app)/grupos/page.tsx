import Link from 'next/link'
import { Lock, LogOut, MessageSquare, UserMinus, UserPlus, Users } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { gruposDoUsuario } from '@/lib/chat'
import { convidarParaGrupo, removerDoGrupo, sairDoGrupo } from '@/lib/acoes'
import { Cabecalho } from '@/components/cabecalho'
import { FormGrupo } from '@/components/form-grupo'
import { Avatar, Botao, BotaoLink, Selo, Vazio } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Grupos' }

export default async function Grupos() {
  const u = await usuarioAtual()
  const [grupos, turma] = await Promise.all([
    gruposDoUsuario(u.id),
    sql<{ id: number; nome: string; email: string; foto: string | null }>(
      'SELECT id, nome, email, foto FROM usuarios WHERE id <> $1 ORDER BY nome',
      [u.id],
    ),
  ])

  const membrosPorGrupo = grupos.length
    ? await sql<{ grupo_id: number; id: number; nome: string; foto: string | null }>(
        `SELECT gm.grupo_id, u.id, u.nome, u.foto FROM grupo_membros gm
         JOIN usuarios u ON u.id = gm.usuario_id
         WHERE gm.grupo_id = ANY($1::int[]) ORDER BY u.nome`,
        [grupos.map((g) => g.id)],
      )
    : []

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo="Grupos"
        descricao="Espaços privados para trabalho em equipe: só quem foi convidado vê as mensagens e os arquivos."
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <FormGrupo turma={turma} />

        <div className="space-y-3">
          {grupos.length === 0 ? (
            <Vazio
              icone={<Lock size={22} />}
              titulo="Nenhum grupo ainda"
              texto="Crie um grupo ao lado para conversar em particular com quem você escolher."
            />
          ) : (
            grupos.map((g) => {
              const membros = membrosPorGrupo.filter((m) => m.grupo_id === g.id)
              const fora = turma.filter((p) => !membros.some((m) => m.id === p.id))
              return (
                <article key={g.id} className="painel p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Lock size={15} className="text-fiap-500" />
                    <h3 className="font-semibold">{g.nome}</h3>
                    {g.criador_id === u.id && <Selo tom="fiap">criador</Selo>}
                    <div className="flex-1" />
                    <BotaoLink href={`/chat?canal=g:${g.id}`} tamanho="sm">
                      <MessageSquare size={14} /> Abrir chat
                    </BotaoLink>
                  </div>
                  {g.descricao && <p className="mt-1 text-sm suave">{g.descricao}</p>}

                  <ul className="mt-3 flex flex-wrap gap-2">
                    {membros.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2 text-sm"
                      >
                        <Avatar nome={m.nome} tamanho={22} usuarioId={m.id} foto={m.foto} />
                        <span>{m.id === u.id ? 'você' : m.nome.split(' ').slice(0, 2).join(' ')}</span>
                        {g.criador_id === u.id && m.id !== u.id && (
                          <form action={removerDoGrupo.bind(null, g.id, m.id)}>
                            <button className="suave hover:text-red-500" aria-label={`Remover ${m.nome}`}>
                              <UserMinus size={13} />
                            </button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {fora.length > 0 && (
                      <form action={convidarParaGrupo.bind(null, g.id)} className="flex items-center gap-2">
                        <select
                          name="usuarioId"
                          defaultValue=""
                          className="h-8 rounded-lg border bg-[var(--painel)] px-2 text-sm"
                          required
                        >
                          <option value="" disabled>
                            convidar alguém…
                          </option>
                          {fora.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome}
                            </option>
                          ))}
                        </select>
                        <Botao type="submit" variante="neutro" tamanho="sm">
                          <UserPlus size={14} /> Convidar
                        </Botao>
                      </form>
                    )}
                    <div className="flex-1" />
                    <form action={sairDoGrupo.bind(null, g.id)}>
                      <Botao type="submit" variante="perigo" tamanho="sm">
                        <LogOut size={14} /> Sair do grupo
                      </Botao>
                    </form>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
