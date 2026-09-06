'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  FileCode2,
  Files,
  Hash,
  LayoutDashboard,
  Lock,
  MessageSquare,
  NotebookPen,
  Users,
} from 'lucide-react'
import { IconeModulo } from './icone-modulo'
import { escolherDisciplina } from '@/lib/acoes'

export type ModuloArvore = {
  slug: string
  titulo: string
  icone: string
  aulas: { slug: string; titulo: string }[]
}

export type DisciplinaItem = { slug: string; nome: string; curto: string; cor: string; professor: string }

export type CanalItem = { slug: string; nome: string }

export type GrupoItem = { id: number; nome: string }

type No = {
  id: string
  rotulo: string
  href?: string
  Icone?: React.ComponentType<{ size?: number; className?: string }>
  iconeModulo?: string
  filhos?: No[]
}

const CHAVE_ABERTOS = 'explorer:abertos'

const PAD = 8
const INDENT = 14
const recuo = (nivel: number) => PAD + nivel * INDENT

function Linha({
  no,
  nivel,
  aberto,
  ativo,
  alternar,
}: {
  no: No
  nivel: number
  aberto: boolean
  ativo: boolean
  alternar: () => void
}) {
  const pasta = !!no.filhos?.length
  const Icone = no.Icone
  const classe = `group flex h-8 w-full items-center gap-2 pr-2 text-left text-[14px] transition-colors ${
    ativo
      ? 'bg-fiap-500/10 font-medium text-fiap-600 dark:text-fiap-400'
      : 'suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]'
  }`
  const estilo = { paddingLeft: recuo(nivel) }

  const dentro = (
    <>
      <span
        role={pasta ? 'button' : undefined}
        tabIndex={-1}
        aria-hidden={!pasta}
        onClick={
          pasta
            ? (e) => {
                e.preventDefault()
                e.stopPropagation()
                alternar()
              }
            : undefined
        }
        className="grid h-4 w-4 shrink-0 place-items-center opacity-70"
      >
        {pasta && (aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
      </span>
      {no.iconeModulo ? (
        <span className="shrink-0 text-fiap-500">
          <IconeModulo nome={no.iconeModulo} size={15} />
        </span>
      ) : Icone ? (
        <Icone size={15} className="shrink-0" />
      ) : null}
      <span className="truncate">{no.rotulo}</span>
    </>
  )

  if (!no.href)
    return (
      <button type="button" onClick={alternar} className={classe} style={estilo}>
        {dentro}
      </button>
    )

  return (
    <Link href={no.href} onClick={pasta ? alternar : undefined} className={classe} style={estilo}>
      {dentro}
    </Link>
  )
}

function Ramo({
  nos,
  nivel,
  abertos,
  alternar,
  ehAtivo,
}: {
  nos: No[]
  nivel: number
  abertos: Set<string>
  alternar: (id: string) => void
  ehAtivo: (no: No) => boolean
}) {
  return (
    <>
      {nos.map((no) => {
        const aberto = abertos.has(no.id)
        return (
          <div key={no.id}>
            <Linha
              no={no}
              nivel={nivel}
              aberto={aberto}
              ativo={ehAtivo(no)}
              alternar={() => alternar(no.id)}
            />
            {aberto && no.filhos?.length ? (
              <div
                className="border-l border-[var(--borda)]"
                style={{ marginLeft: recuo(nivel) + 8 }}
              >
                <div style={{ marginLeft: -(recuo(nivel) + 8) }}>
                  <Ramo
                    nos={no.filhos}
                    nivel={nivel + 1}
                    abertos={abertos}
                    alternar={alternar}
                    ehAtivo={ehAtivo}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

export function Explorer({
  raiz,
  modulos,
  canais,
  grupos,
}: {
  raiz: string
  modulos: ModuloArvore[]
  canais: CanalItem[]
  grupos: GrupoItem[]
}) {
  const caminho = usePathname()
  const params = useSearchParams()
  const [abertos, setAbertos] = useState<Set<string>>(new Set(['painel']))
  const [raizAberta, setRaizAberta] = useState(true)

  // /chat sem query cai no canal geral — o primeiro da lista.
  const canalAtivo =
    caminho === '/chat' ? params.get('canal') ?? canais[0]?.slug ?? null : null

  const arvore = useMemo<No[]>(
    () => [
      {
        id: 'painel',
        rotulo: 'Painel',
        href: '/',
        Icone: LayoutDashboard,
        filhos: modulos.map((m) => ({
          id: `mod:${m.slug}`,
          rotulo: m.titulo,
          iconeModulo: m.icone,
          filhos: m.aulas.map((a) => ({
            id: `aula:${a.slug}`,
            rotulo: a.titulo,
            href: `/aulas/${a.slug}`,
            Icone: FileCode2,
          })),
        })),
      },
      { id: 'aulas', rotulo: 'Aulas', href: '/aulas', Icone: BookOpen },
      { id: 'anotacoes', rotulo: 'Anotações', href: '/anotacoes', Icone: NotebookPen },
      { id: 'arquivos', rotulo: 'Materiais', href: '/arquivos', Icone: Files },
      {
        id: 'chat',
        rotulo: 'Chat',
        href: '/chat',
        Icone: MessageSquare,
        filhos: canais.map((c) => ({
          id: `canal:${c.slug}`,
          rotulo: c.nome,
          href: `/chat?canal=${c.slug}`,
          Icone: Hash,
        })),
      },
      {
        id: 'grupos',
        rotulo: 'Grupos',
        href: '/grupos',
        Icone: Lock,
        filhos: grupos.map((g) => ({
          id: `grupo:${g.id}`,
          rotulo: g.nome,
          href: `/chat?canal=g:${g.id}`,
          Icone: Lock,
        })),
      },
      { id: 'turma', rotulo: 'Turma', href: '/turma', Icone: Users },
    ],
    [modulos, canais, grupos],
  )

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_ABERTOS)
    if (salvo) setAbertos(new Set(JSON.parse(salvo) as string[]))
  }, [])

  // Revela o item aberto: expande os pais dele (igual "reveal in explorer").
  useEffect(() => {
    const abrir: string[] = []
    const slug = caminho.startsWith('/aulas/') ? caminho.slice(7) : null
    if (slug) {
      const dono = modulos.find((m) => m.aulas.some((a) => a.slug === slug))
      if (dono) abrir.push('painel', `mod:${dono.slug}`)
    }
    if (canalAtivo) abrir.push(canalAtivo.startsWith('g:') ? 'grupos' : 'chat')
    if (!abrir.length) return
    setAbertos((atual) =>
      abrir.every((k) => atual.has(k)) ? atual : new Set([...atual, ...abrir]),
    )
  }, [caminho, canalAtivo, modulos])

  const guardar = (novo: Set<string>) => {
    setAbertos(novo)
    localStorage.setItem(CHAVE_ABERTOS, JSON.stringify([...novo]))
  }

  const alternar = (id: string) => {
    const novo = new Set(abertos)
    novo.has(id) ? novo.delete(id) : novo.add(id)
    guardar(novo)
  }

  const ehAtivo = (no: No) => {
    if (!no.href) return false
    if (canalAtivo) return no.href === `/chat?canal=${canalAtivo}`
    return caminho === no.href
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto py-1">
      <div className="group/raiz flex h-8 items-center gap-1 pl-2 pr-2">
        <button
          type="button"
          onClick={() => setRaizAberta((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-1 text-left text-[12px] font-bold uppercase tracking-wide suave hover:text-[var(--texto)]"
        >
          {raizAberta ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="truncate">{raiz}</span>
        </button>
        <button
          type="button"
          onClick={() => guardar(new Set())}
          className="grid h-6 w-6 place-items-center rounded opacity-0 suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)] focus-visible:opacity-100 group-hover/raiz:opacity-100"
          title="Recolher tudo"
          aria-label="Recolher tudo"
        >
          <ChevronsDownUp size={15} />
        </button>
      </div>

      {raizAberta && (
        <Ramo nos={arvore} nivel={1} abertos={abertos} alternar={alternar} ehAtivo={ehAtivo} />
      )}
    </div>
  )
}

export function TrocarDisciplina({
  atual,
  lista,
}: {
  atual: DisciplinaItem | null
  lista: DisciplinaItem[]
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [i, setI] = useState(0)
  const [montado, setMontado] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => setMontado(true), [])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return lista
    return lista.filter((d) => `${d.nome} ${d.curto} ${d.professor}`.toLowerCase().includes(q))
  }, [busca, lista])

  useEffect(() => setI(0), [busca])

  useEffect(() => {
    if (!aberto) return
    campo.current?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aberto])

  const escolher = (slug: string) => {
    setAberto(false)
    startTransition(() => void escolherDisciplina(slug))
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setBusca('')
          setAberto(true)
        }}
        className="flex h-11 w-full shrink-0 items-center gap-2 border-t border-[var(--borda)] px-3 text-left text-[14px] transition-colors hover:bg-[var(--painel-2)]"
        title="Trocar disciplina"
      >
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: atual?.cor ?? 'var(--texto-2)' }}
        />
        <span className="min-w-0 flex-1 truncate font-medium">
          {atual?.curto ?? 'Escolher disciplina'}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 suave" />
      </button>

      {aberto &&
        montado &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0" onClick={() => setAberto(false)} />
            <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[var(--borda)] bg-[var(--fundo)] shadow-2xl shadow-black/25 surge">
            <input
              ref={campo}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setI((n) => (n + 1) % Math.max(filtradas.length, 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setI((n) => (n - 1 + filtradas.length) % Math.max(filtradas.length, 1))
                } else if (e.key === 'Enter' && filtradas[i]) {
                  escolher(filtradas[i].slug)
                }
              }}
              placeholder="Selecione uma disciplina para abrir"
              className="w-full border-b border-[var(--borda)] bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-[var(--texto-2)]"
            />
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {filtradas.length === 0 && (
                <li className="px-3 py-6 text-center text-sm suave">Nenhuma disciplina encontrada</li>
              )}
              {filtradas.map((d, n) => (
                <li key={d.slug}>
                  <button
                    type="button"
                    onMouseMove={() => setI(n)}
                    onClick={() => escolher(d.slug)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      n === i ? 'bg-fiap-500/12' : ''
                    }`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.cor }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{d.nome}</span>
                      <span className="block truncate text-xs suave">Prof. {d.professor}</span>
                    </span>
                    {atual?.slug === d.slug && <Check size={15} className="shrink-0 text-fiap-500" />}
                  </button>
                </li>
              ))}
            </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
