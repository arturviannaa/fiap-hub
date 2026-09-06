'use client'

import { useEffect, useState } from 'react'
import { Lock, MessageSquare, Plus, UserMinus, UserPlus, Users, X } from 'lucide-react'
import { convidarParaGrupo, removerDoGrupo, sairDoGrupo } from '@/lib/acoes'
import { Avatar, Botao, BotaoLink, Selo } from './ui'
import { FormGrupo } from './form-grupo'

const CORES_GRUPO = ['#e5115f', '#8b5cf6', '#2d6fe5', '#1f9d55', '#c47800']

type Pessoa = { id: number; nome: string; foto: string | null }

export type GrupoComMembros = {
  id: number
  nome: string
  descricao: string
  criador_id: number
  membros: Pessoa[]
  fora: Pessoa[]
}

function AvatarStack({ membros }: { membros: Pessoa[] }) {
  const visiveis = membros.slice(0, 4)
  const resto = membros.length - visiveis.length
  return (
    <div className="flex">
      {visiveis.map((m, i) => (
        <span
          key={m.id}
          className="rounded-full ring-2 ring-[var(--painel)]"
          style={{ marginLeft: i === 0 ? 0 : -9 }}
        >
          <Avatar nome={m.nome} tamanho={28} usuarioId={m.id} foto={m.foto} />
        </span>
      ))}
      {resto > 0 && (
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-[var(--painel-2)] text-[10px] font-bold suave ring-2 ring-[var(--painel)]"
          style={{ marginLeft: -9 }}
        >
          +{resto}
        </span>
      )}
    </div>
  )
}

function CartaoGrupo({ g, meuId }: { g: GrupoComMembros; meuId: number }) {
  const cor = CORES_GRUPO[g.id % CORES_GRUPO.length]
  const souCriador = g.criador_id === meuId
  return (
    <div className="painel flex flex-col gap-3.5 p-4">
      <div className="flex items-start justify-between gap-2">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
          style={{ background: `${cor}1f`, borderColor: `${cor}33`, color: cor }}
        >
          <Lock size={19} />
        </span>
        {souCriador && <Selo tom="fiap">criador</Selo>}
      </div>
      <div>
        <b className="text-[16px]">{g.nome}</b>
        {g.descricao && <p className="mt-0.5 line-clamp-2 text-[12.5px] suave">{g.descricao}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <AvatarStack membros={g.membros} />
        <span className="text-[12.5px] suave">
          {g.membros.length} {g.membros.length === 1 ? 'membro' : 'membros'}
        </span>
      </div>

      {g.criador_id === meuId && g.membros.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {g.membros
            .filter((m) => m.id !== meuId)
            .map((m) => (
              <span
                key={m.id}
                className="group inline-flex items-center gap-1 rounded-lg bg-[var(--painel-2)] py-0.5 pl-1.5 pr-0.5 text-[11px]"
              >
                {m.nome.split(' ')[0]}
                <button
                  onClick={() => removerDoGrupo(g.id, m.id)}
                  className="rounded p-0.5 opacity-0 suave transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label={`Remover ${m.nome}`}
                >
                  <UserMinus size={11} />
                </button>
              </span>
            ))}
        </div>
      )}

      {g.fora.length > 0 && (
        <form action={convidarParaGrupo.bind(null, g.id)} className="flex items-center gap-2">
          <select
            name="usuarioId"
            defaultValue=""
            className="h-8 flex-1 rounded-lg border bg-[var(--painel-2)] px-2 text-xs"
            required
          >
            <option value="" disabled>
              convidar alguém…
            </option>
            {g.fora.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <Botao type="submit" variante="neutro" tamanho="sm">
            <UserPlus size={13} />
          </Botao>
        </form>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        <BotaoLink href={`/chat?canal=g:${g.id}`} tamanho="sm" className="flex-1 justify-center">
          <MessageSquare size={14} /> Abrir chat
        </BotaoLink>
        <Botao variante="perigo" tamanho="sm" onClick={() => sairDoGrupo(g.id)}>
          Sair
        </Botao>
      </div>
    </div>
  )
}

export function GradeGrupos({
  grupos,
  turma,
  meuId,
}: {
  grupos: GrupoComMembros[]
  turma: Pessoa[]
  meuId: number
}) {
  const [criando, setCriando] = useState(false)
  useEffect(() => setCriando(false), [grupos])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Botao tamanho="sm" onClick={() => setCriando(true)}>
          <Plus size={15} /> Criar grupo
        </Botao>
      </div>

      {criando && (
        <div className="relative">
          <button
            onClick={() => setCriando(false)}
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]"
            aria-label="Cancelar"
          >
            <X size={16} />
          </button>
          <FormGrupo turma={turma} />
        </div>
      )}

      {grupos.length === 0 && !criando ? (
        <p className="painel flex flex-col items-center gap-2 px-6 py-14 text-center text-sm suave">
          <Users size={22} className="suave" />
          Nenhum grupo ainda. Crie um pra conversar em particular com quem você escolher.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((g) => (
            <CartaoGrupo key={g.id} g={g} meuId={meuId} />
          ))}
          {!criando && (
            <button
              onClick={() => setCriando(true)}
              className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[var(--borda)] p-6 text-center text-sm suave hover:text-[var(--texto)]"
            >
              <Plus size={22} />
              <b className="text-sm font-semibold">Criar novo grupo</b>
              <span className="text-xs">convide colegas e comece uma conversa privada</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
