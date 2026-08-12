'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Hash, SendHorizonal, Wifi, WifiOff } from 'lucide-react'
import { enviarMensagem } from '@/lib/acoes'
import type { MensagemChat } from '@/lib/chat'
import { Avatar } from './ui'

type Canal = { slug: string; nome: string; descricao: string }

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const dia = (iso: string) => {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(Date.now() - 864e5)
  if (d.toDateString() === hoje.toDateString()) return 'Hoje'
  if (d.toDateString() === ontem.toDateString()) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

export function Chat({
  canal,
  canais,
  historico,
  usuario,
}: {
  canal: string
  canais: Canal[]
  historico: MensagemChat[]
  usuario: { id: number; nome: string }
}) {
  const [mensagens, setMensagens] = useState(historico)
  const [online, setOnline] = useState(false)
  const [texto, setTexto] = useState('')
  const fim = useRef<HTMLDivElement>(null)

  useEffect(() => setMensagens(historico), [historico, canal])

  useEffect(() => {
    const es = new EventSource(`/api/chat/${canal}`)
    es.onopen = () => setOnline(true)
    es.onerror = () => setOnline(false)
    es.onmessage = (e) => {
      const msg: MensagemChat = JSON.parse(e.data)
      // O proprio remetente tambem recebe pelo stream: dedup por id.
      setMensagens((atual) => (atual.some((m) => m.id === msg.id) ? atual : [...atual, msg]))
    }
    return () => es.close()
  }, [canal])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    const corpo = texto.trim()
    if (!corpo) return
    setTexto('')
    await enviarMensagem(canal, corpo)
  }

  const atual = canais.find((c) => c.slug === canal)

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-6xl gap-4">
      <aside className="painel hidden w-56 shrink-0 p-3 sm:block">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide suave">Canais</p>
        <nav className="flex flex-col gap-0.5">
          {canais.map((c) => (
            <Link
              key={c.slug}
              href={`/chat?canal=${c.slug}`}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                c.slug === canal
                  ? 'bg-fiap-500/12 font-medium text-fiap-600 dark:text-fiap-400'
                  : 'suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]'
              }`}
            >
              <Hash size={15} />
              {c.nome}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="painel flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <Hash size={16} className="text-fiap-500" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{atual?.nome}</p>
            <p className="truncate text-xs suave">{atual?.descricao}</p>
          </div>
          <div className="flex-1" />
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] ${online ? 'text-emerald-500' : 'suave'}`}
            title={online ? 'Conectado em tempo real' : 'Reconectando…'}
          >
            {online ? <Wifi size={13} /> : <WifiOff size={13} />}
            {online ? 'ao vivo' : 'conectando'}
          </span>
        </header>

        <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {mensagens.length === 0 && (
            <p className="py-10 text-center text-sm suave">
              Ninguém escreveu em #{atual?.nome} ainda. Manda a primeira.
            </p>
          )}
          {mensagens.map((m, i) => {
            const anterior = mensagens[i - 1]
            const novoDia = !anterior || dia(anterior.criado_em) !== dia(m.criado_em)
            // Mensagens seguidas da mesma pessoa em 5 min viram um bloco so.
            const agrupa =
              !novoDia &&
              anterior?.usuario_id === m.usuario_id &&
              new Date(m.criado_em).getTime() - new Date(anterior.criado_em).getTime() < 3e5
            return (
              <div key={m.id}>
                {novoDia && (
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[var(--borda)]" />
                    <span className="text-[11px] uppercase tracking-wide suave" suppressHydrationWarning>
                      {dia(m.criado_em)}
                    </span>
                    <div className="h-px flex-1 bg-[var(--borda)]" />
                  </div>
                )}
                <div className={`flex gap-3 ${agrupa ? '' : 'mt-3'}`}>
                  <div className="w-8 shrink-0">
                    {!agrupa && <Avatar nome={m.nome} tamanho={32} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {!agrupa && (
                      <p className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">
                          {m.usuario_id === usuario.id ? 'Você' : m.nome}
                        </span>
                        <span className="text-[11px] suave" suppressHydrationWarning>
                          {hora(m.criado_em)}
                        </span>
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.corpo}</p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={fim} />
        </div>

        <form onSubmit={enviar} className="flex items-end gap-2 border-t p-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar(e)
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={`Mensagem em #${atual?.nome}`}
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border bg-[var(--painel-2)] px-3 py-2.5 text-sm focus:border-fiap-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fiap-500 text-white transition-colors hover:bg-fiap-600 disabled:opacity-40"
            aria-label="Enviar"
          >
            <SendHorizonal size={17} />
          </button>
        </form>
      </section>
    </div>
  )
}
