'use client'

import { useEffect, useState } from 'react'
import { Kalam } from 'next/font/google'
import { Lock, Plus, Search, Trash2 } from 'lucide-react'
import { apagarNota, salvarNota } from '@/lib/acoes'
import { Area, Botao, Campo, Segmentado, quando } from './ui'

const kalam = Kalam({ subsets: ['latin'], weight: ['400', '700'] })

// Cores/rotação do post-it derivadas do id: estável entre renders, sem
// precisar guardar mais uma coluna no banco.
const CORES_POSTIT = ['#fff3a3', '#ffb3c7', '#b6e3a7', '#a7d8ff', '#e4c6ff']
const ROT_POSTIT = [-2, 1.5, -1, 1, -1.5]

export type NotaComTag = {
  id: number
  titulo: string
  corpo: string
  publica: boolean
  estilo: string
  aula_slug: string | null
  usuario_id: number
  atualizado_em: string
  autor: string
  tag: string | null
}

function meta(n: NotaComTag, aba: 'minhas' | 'turma', meuId: number) {
  if (aba === 'minhas') return `${n.publica ? 'pública' : 'privada'} · editada há ${quando(n.atualizado_em)}`
  return `${n.usuario_id === meuId ? 'você' : n.autor.split(' ')[0]} · há ${quando(n.atualizado_em)}`
}

function CartaoGlass({ n, aba, meuId }: { n: NotaComTag; aba: 'minhas' | 'turma'; meuId: number }) {
  const meu = n.usuario_id === meuId
  return (
    <div className="painel flex min-h-[168px] flex-col gap-2.5 p-4">
      <div className="flex items-center justify-between gap-2">
        {n.tag ? (
          <span className="inline-flex items-center rounded-lg border bg-[var(--painel-2)] px-2 py-0.5 text-[11px] font-semibold suave">
            {n.tag}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {n.publica ? (
            <span className="inline-flex items-center rounded-lg bg-emerald-500/12 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-emerald-600 dark:text-emerald-400">
              PÚBLICA
            </span>
          ) : (
            <Lock size={13} className="suave" />
          )}
          {meu && (
            <button
              onClick={() => apagarNota(n.id)}
              className="suave hover:text-red-500"
              aria-label="Apagar anotação"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {n.titulo && <b className="text-[15px]">{n.titulo}</b>}
      <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-[13px] leading-relaxed suave">{n.corpo}</p>
      <p className="text-[11px] suave">{meta(n, aba, meuId)}</p>
    </div>
  )
}

function CartaoPostit({ n, aba, meuId }: { n: NotaComTag; aba: 'minhas' | 'turma'; meuId: number }) {
  const meu = n.usuario_id === meuId
  const cor = CORES_POSTIT[n.id % CORES_POSTIT.length]
  const rot = ROT_POSTIT[n.id % ROT_POSTIT.length]
  return (
    <div
      className={`postit ${kalam.className}`}
      style={{ background: cor, transform: `rotate(${rot}deg)` }}
    >
      <div className="postit-tape" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold opacity-70">{n.tag ?? 'Geral'}</span>
        <div className="flex items-center gap-2">
          {n.publica && (
            <span className="rounded-md bg-black/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wide">
              PÚBLICA
            </span>
          )}
          {meu && (
            <button onClick={() => apagarNota(n.id)} className="opacity-50 hover:opacity-100" aria-label="Apagar anotação">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {n.titulo && <span className="text-[19px] font-bold leading-tight">{n.titulo}</span>}
      <p className="line-clamp-4 flex-1 whitespace-pre-wrap text-[15px] leading-snug opacity-90">{n.corpo}</p>
      <span className="text-[12px] opacity-60">{meta(n, aba, meuId)}</span>
    </div>
  )
}

function FormNovaNota({ onFechar }: { onFechar: () => void }) {
  const [estilo, setEstilo] = useState<'cartao' | 'postit'>('cartao')
  return (
    <form action={salvarNota} className="painel flex flex-col gap-3 p-4">
      <input type="hidden" name="estilo" value={estilo} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-0.5 rounded-2xl border bg-[var(--painel-2)] p-1">
          {(['cartao', 'postit'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setEstilo(v)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                estilo === v
                  ? 'bg-gradient-to-br from-fiap-400 to-fiap-500 text-white shadow-md shadow-fiap-500/30'
                  : 'suave hover:text-[var(--texto)]'
              }`}
            >
              {v === 'cartao' ? 'Cartão' : 'Post-it'}
            </button>
          ))}
        </div>
        <button type="button" onClick={onFechar} className="text-sm suave hover:text-[var(--texto)]">
          cancelar
        </button>
      </div>
      <Campo name="titulo" placeholder="Título (opcional)" />
      <Area name="corpo" rows={4} placeholder="Escreva aqui…" required autoFocus />
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm suave">
          <input type="checkbox" name="publica" className="accent-fiap-500" />
          Compartilhar com a turma
        </label>
        <Botao type="submit" tamanho="sm">
          Salvar anotação
        </Botao>
      </div>
    </form>
  )
}

export function QuadroAnotacoes({
  notas,
  aba,
  meuId,
  contagens,
}: {
  notas: NotaComTag[]
  aba: 'minhas' | 'turma'
  meuId: number
  contagens: { minhas: number; turma: number }
}) {
  const [busca, setBusca] = useState('')
  const [criando, setCriando] = useState(false)

  // Fecha o formulário quando o servidor manda uma lista nova (nota salva
  // com sucesso). Em erro de validação a action não revalida, então o
  // array não muda de referência e o form continua aberto com a mensagem.
  useEffect(() => setCriando(false), [notas])

  const filtradas = busca.trim()
    ? notas.filter((n) => `${n.titulo} ${n.corpo}`.toLowerCase().includes(busca.trim().toLowerCase()))
    : notas

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmentado
          itens={[
            { href: '/anotacoes?aba=minhas', rotulo: `Minhas · ${contagens.minhas}`, ativo: aba === 'minhas' },
            { href: '/anotacoes?aba=turma', rotulo: `Da turma · ${contagens.turma}`, ativo: aba === 'turma' },
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 suave" />
            <Campo
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar anotações…"
              className="w-full pl-9 sm:w-56"
            />
          </div>
          <Botao tamanho="sm" onClick={() => setCriando(true)}>
            <Plus size={15} /> Nova anotação
          </Botao>
        </div>
      </div>

      {criando && <FormNovaNota onFechar={() => setCriando(false)} />}

      {filtradas.length === 0 && !criando ? (
        <p className="painel px-6 py-14 text-center text-sm suave">
          {busca ? `Nada encontrado para "${busca}".` : 'Nada por aqui ainda.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((n) =>
            n.estilo === 'postit' ? (
              <CartaoPostit key={n.id} n={n} aba={aba} meuId={meuId} />
            ) : (
              <CartaoGlass key={n.id} n={n} aba={aba} meuId={meuId} />
            ),
          )}
          {!criando && (
            <button
              onClick={() => setCriando(true)}
              className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[var(--borda)] text-sm suave hover:text-[var(--texto)]"
            >
              <Plus size={22} />
              <b className="text-sm font-semibold">Nova anotação</b>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
