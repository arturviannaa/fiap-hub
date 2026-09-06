'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, Moon, Search, SquarePen, Sun, X } from 'lucide-react'
import { Avatar } from './ui'
import { Presenca } from './presenca'
import {
  Explorer,
  TrocarDisciplina,
  type CanalItem,
  type DisciplinaItem,
  type GrupoItem,
  type ModuloArvore,
} from './explorer'
import { sair } from '@/lib/acoes-auth'

const ICONE = 'grid h-9 w-9 place-items-center rounded-xl suave transition-colors hover:bg-[var(--painel-2)] hover:text-[var(--texto)]'

function TemaBotao() {
  const [escuro, setEscuro] = useState(false)
  useEffect(() => setEscuro(document.documentElement.classList.contains('dark')), [])
  return (
    <button
      type="button"
      onClick={() => {
        const novo = !escuro
        document.documentElement.classList.toggle('dark', novo)
        localStorage.setItem('tema', novo ? 'escuro' : 'claro')
        setEscuro(novo)
      }}
      className={ICONE}
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
    >
      {escuro ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

function MenuPerfil({
  usuario,
}: {
  usuario: { id: number; nome: string; email: string; foto: string | null }
}) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false)
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    window.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fora)
      window.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label="Meu perfil"
        className={`grid h-10 w-10 place-items-center rounded-full ring-offset-2 ring-offset-[var(--fundo)] transition-shadow ${
          aberto ? 'ring-2 ring-fiap-500/60' : ''
        }`}
      >
        <Avatar nome={usuario.nome} tamanho={36} usuarioId={usuario.id} foto={usuario.foto} />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--borda)] bg-[var(--fundo)] shadow-2xl shadow-black/20 surge"
        >
          <div className="flex items-center gap-2.5 p-3">
            <Avatar nome={usuario.nome} tamanho={38} usuarioId={usuario.id} foto={usuario.foto} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">{usuario.nome}</span>
              <span className="block truncate text-[11px] suave">{usuario.email}</span>
            </span>
          </div>

          <div className="border-t border-[var(--borda)] p-2">
            <Link
              href="/perfil"
              onClick={() => setAberto(false)}
              className="flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm transition-colors hover:bg-[var(--painel-2)]"
            >
              <SquarePen size={16} className="suave" />
              Editar perfil
            </Link>
          </div>

          <div className="flex items-center gap-1 border-t border-[var(--borda)] p-2">
            <TemaBotao />
            <form action={sair} className="contents">
              <button type="submit" className={ICONE} aria-label="Sair" title="Sair">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export function Shell({
  usuario,
  disciplina,
  disciplinas = [],
  modulos = [],
  canais = [],
  grupos = [],
  children,
}: {
  usuario: { id: number; nome: string; email: string; papeis: string[]; foto: string | null }
  disciplina?: DisciplinaItem | null
  disciplinas?: DisciplinaItem[]
  modulos?: ModuloArvore[]
  canais?: CanalItem[]
  grupos?: GrupoItem[]
  children: React.ReactNode
}) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)
  useEffect(() => setAberto(false), [caminho])

  const lateral = (
    <div className="flex h-full min-h-0 flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-3 py-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fiap-400 to-fiap-500 text-lg font-extrabold text-white shadow-lg shadow-fiap-500/40">
          F
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold">Turma FIAP</span>
          <span className="block text-[12px] suave">Plataforma de Estudos</span>
        </span>
      </Link>

      <Explorer
        raiz={disciplina?.curto ?? 'Turma FIAP'}
        modulos={modulos}
        canais={canais}
        grupos={grupos}
      />

      <TrocarDisciplina atual={disciplina ?? null} lista={disciplinas} />
    </div>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17.5rem_1fr]">
      <Presenca />
      <aside className="sticky top-0 hidden h-dvh border-r border-[var(--borda)] bg-[var(--painel)] backdrop-blur-2xl lg:block">
        {lateral}
      </aside>

      {/* Drawer no mobile */}
      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-[17.5rem] border-r border-[var(--borda)] bg-[var(--fundo)] surge">
            <button
              onClick={() => setAberto(false)}
              className="absolute right-2 top-3 z-10 grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--painel-2)]"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
            {lateral}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[var(--borda)] bg-[var(--painel)] px-3 backdrop-blur-2xl sm:px-6">
          <button
            onClick={() => setAberto(true)}
            className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--borda)] bg-[var(--painel-2)] lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
          <Link
            href="/busca"
            className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[var(--borda)] bg-[var(--painel-2)] px-4 text-sm suave hover:bg-[var(--painel)] sm:max-w-sm"
          >
            <Search size={16} className="shrink-0" />
            <span className="truncate">Buscar nas aulas…</span>
          </Link>
          <div className="hidden flex-1 sm:block" />
          <MenuPerfil usuario={usuario} />
        </header>
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  )
}
