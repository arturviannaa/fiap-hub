'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  FileText,
  Hash,
  Loader2,
  Lock,
  Paperclip,
  Plus,
  SendHorizonal,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { apagarMensagem, enviarMensagemComAnexo } from '@/lib/acoes'
import type { Grupo, MensagemChat } from '@/lib/chat'
import { Avatar, TagPapel, tamanhoLegivel } from './ui'

type Canal = { slug: string; nome: string; descricao: string }

const COOLDOWN = 10 // segundos, igual ao servidor

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

function Anexo({ m }: { m: MensagemChat }) {
  if (!m.arquivo_id) return null
  const url = `/api/arquivos/${m.arquivo_id}`
  if (m.arquivo_mime?.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1.5 block w-fit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={m.arquivo_nome || 'imagem'}
          className="max-h-72 max-w-full rounded-xl border object-contain"
          loading="lazy"
        />
      </a>
    )
  }
  return (
    <a
      href={url}
      className="mt-1.5 flex w-fit max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-[var(--painel)]"
    >
      <FileText size={16} className="shrink-0 text-fiap-500" />
      <span className="truncate">{m.arquivo_nome}</span>
      <span className="shrink-0 text-xs suave">{tamanhoLegivel(m.arquivo_tamanho ?? 0)}</span>
    </a>
  )
}

export function Chat({
  canal,
  canais,
  grupos,
  historico,
  usuario,
}: {
  canal: string
  canais: Canal[]
  grupos: Grupo[]
  historico: MensagemChat[]
  usuario: { id: number; nome: string; papel: string }
}) {
  const [mensagens, setMensagens] = useState(historico)
  const [online, setOnline] = useState(false)
  const [texto, setTexto] = useState('')
  const [anexo, setAnexo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [espera, setEspera] = useState(0)
  const [arrastando, setArrastando] = useState(false)
  const fim = useRef<HTMLDivElement>(null)
  const inputArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => setMensagens(historico), [historico, canal])

  useEffect(() => {
    const es = new EventSource(`/api/chat/${encodeURIComponent(canal)}`)
    es.onopen = () => setOnline(true)
    es.onerror = () => setOnline(false)
    es.onmessage = (e) => {
      const evento = JSON.parse(e.data)
      if (evento.op === 'del') {
        setMensagens((atual) => atual.filter((m) => m.id !== evento.id))
        return
      }
      const msg: MensagemChat = evento.msg
      // O proprio remetente tambem recebe pelo stream: dedup por id.
      setMensagens((atual) => (atual.some((m) => m.id === msg.id) ? atual : [...atual, msg]))
    }
    return () => es.close()
  }, [canal])

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensagens])

  // Contagem regressiva do cooldown, so visual — quem manda e o servidor.
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  useEffect(() => {
    if (!anexo || !anexo.type.startsWith('image/')) {
      setPrevia(null)
      return
    }
    const url = URL.createObjectURL(anexo)
    setPrevia(url)
    return () => URL.revokeObjectURL(url)
  }, [anexo])

  function escolher(arquivo: File | null | undefined) {
    if (!arquivo) return
    if (arquivo.size > 10 * 1024 * 1024) {
      setErro('Anexo maior que 10 MB.')
      return
    }
    setErro(null)
    setAnexo(arquivo)
  }

  async function enviar(e?: React.FormEvent) {
    e?.preventDefault()
    if (enviando || espera > 0) return
    const corpo = texto.trim()
    if (!corpo && !anexo) return

    const dados = new FormData()
    dados.set('canal', canal)
    dados.set('corpo', corpo)
    if (anexo) dados.set('anexo', anexo)

    setEnviando(true)
    const r = await enviarMensagemComAnexo(dados)
    setEnviando(false)

    if (r?.erro) {
      setErro(r.erro)
      const s = /(\d+)s/.exec(r.erro)
      if (s) setEspera(Number(s[1]))
      return
    }
    setTexto('')
    setAnexo(null)
    setErro(null)
    setEspera(COOLDOWN)
  }

  const grupoAtual = grupos.find((g) => `g:${g.id}` === canal)
  const atual = canais.find((c) => c.slug === canal)
  const titulo = grupoAtual?.nome ?? atual?.nome ?? canal
  const subtitulo = grupoAtual ? `${grupoAtual.membros} membros · grupo privado` : (atual?.descricao ?? '')

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-6xl gap-4">
      <aside className="painel hidden w-56 shrink-0 flex-col overflow-y-auto p-3 sm:flex">
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

        <p className="px-2 pb-2 pt-5 text-xs font-semibold uppercase tracking-wide suave">Meus grupos</p>
        <nav className="flex flex-col gap-0.5">
          {grupos.map((g) => (
            <Link
              key={g.id}
              href={`/chat?canal=g:${g.id}`}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                `g:${g.id}` === canal
                  ? 'bg-fiap-500/12 font-medium text-fiap-600 dark:text-fiap-400'
                  : 'suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]'
              }`}
            >
              <Lock size={14} className="shrink-0" />
              <span className="truncate">{g.nome}</span>
            </Link>
          ))}
          {grupos.length === 0 && <p className="px-2.5 text-xs suave">Nenhum grupo ainda.</p>}
          <Link
            href="/grupos"
            className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]"
          >
            <Plus size={15} /> Novo grupo
          </Link>
        </nav>
      </aside>

      <section
        className={`painel relative flex min-w-0 flex-1 flex-col overflow-hidden ${
          arrastando ? 'ring-2 ring-fiap-500' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setArrastando(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          escolher(e.dataTransfer.files?.[0])
        }}
      >
        {arrastando && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[var(--painel)]/85">
            <p className="flex items-center gap-2 font-medium text-fiap-500">
              <Paperclip size={18} /> Solte o arquivo para anexar
            </p>
          </div>
        )}

        <header className="flex items-center gap-2 border-b px-4 py-3">
          {grupoAtual ? (
            <Lock size={15} className="text-fiap-500" />
          ) : (
            <Hash size={16} className="text-fiap-500" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{titulo}</p>
            <p className="truncate text-xs suave">{subtitulo}</p>
          </div>
          <div className="flex-1" />
          {grupoAtual && (
            <Link href="/grupos" className="text-xs suave hover:text-fiap-500">
              membros
            </Link>
          )}
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
            <p className="py-10 text-center text-sm suave">Ninguém escreveu aqui ainda. Manda a primeira.</p>
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
                <div
                  className={`group -mx-1 flex gap-3 rounded-lg px-1 hover:bg-[var(--painel-2)] ${
                    agrupa ? '' : 'mt-3'
                  }`}
                >
                  <div className="w-8 shrink-0">{!agrupa && <Avatar nome={m.nome} tamanho={32} />}</div>
                  <div className="min-w-0 flex-1">
                    {!agrupa && (
                      <p className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">
                          {m.usuario_id === usuario.id ? 'Você' : m.nome}
                        </span>
                        <TagPapel papel={m.papel} mudo />
                        <span className="text-[11px] suave" suppressHydrationWarning>
                          {hora(m.criado_em)}
                        </span>
                      </p>
                    )}
                    {m.corpo && (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.corpo}</p>
                    )}
                    <Anexo m={m} />
                  </div>
                  {(m.usuario_id === usuario.id || usuario.papel === 'admin') && (
                    <button
                      onClick={() => apagarMensagem(m.id)}
                      className="shrink-0 self-start p-1 opacity-0 transition-opacity suave hover:text-red-500 focus:opacity-100 group-hover:opacity-100"
                      aria-label="Apagar mensagem"
                      title={m.usuario_id === usuario.id ? 'Apagar sua mensagem' : 'Apagar (admin)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={fim} />
        </div>

        <form onSubmit={enviar} className="border-t p-3">
          {erro && (
            <p className="mb-2 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} /> {erro}
            </p>
          )}

          {anexo && (
            <div className="mb-2 flex items-center gap-3 rounded-xl border p-2">
              {previa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previa} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-lg bg-[var(--painel-2)]">
                  <FileText size={20} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{anexo.name}</p>
                <p className="text-xs suave">{tamanhoLegivel(anexo.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setAnexo(null)}
                className="p-1 suave hover:text-red-500"
                aria-label="Remover anexo"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={inputArquivo}
              type="file"
              className="hidden"
              accept="image/*,application/pdf,.py,.txt,.csv,.json,.zip,.docx,.xlsx"
              onChange={(e) => escolher(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputArquivo.current?.click()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]"
              aria-label="Anexar arquivo"
              title="Anexar (ou arraste, ou cole um print)"
            >
              <Paperclip size={17} />
            </button>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onPaste={(e) => {
                // Print colado com Ctrl+V vira anexo.
                const arquivo = Array.from(e.clipboardData.files)[0]
                if (arquivo) {
                  e.preventDefault()
                  escolher(arquivo)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  enviar()
                }
              }}
              rows={1}
              maxLength={1200}
              placeholder={espera > 0 ? `Aguarde ${espera}s…` : `Mensagem em ${titulo}`}
              className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border bg-[var(--painel-2)] px-3 py-2.5 text-sm focus:border-fiap-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={(!texto.trim() && !anexo) || enviando || espera > 0}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fiap-500 text-white transition-colors hover:bg-fiap-600 disabled:opacity-40"
              aria-label="Enviar"
            >
              {enviando ? (
                <Loader2 size={17} className="animate-spin" />
              ) : espera > 0 ? (
                <span className="text-xs font-semibold">{espera}</span>
              ) : (
                <SendHorizonal size={17} />
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
