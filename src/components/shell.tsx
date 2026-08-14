'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  BookOpen,
  Files,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  NotebookPen,
  Search,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { Avatar } from './ui'
import { Presenca } from './presenca'
import { sair } from '@/lib/acoes-auth'

const LINKS = [
  { href: '/', rotulo: 'Painel', Icone: LayoutDashboard },
  { href: '/aulas', rotulo: 'Aulas', Icone: BookOpen },
  { href: '/anotacoes', rotulo: 'Anotações', Icone: NotebookPen },
  { href: '/arquivos', rotulo: 'Materiais', Icone: Files },
  { href: '/chat', rotulo: 'Chat', Icone: MessageSquare },
  { href: '/grupos', rotulo: 'Grupos', Icone: Lock },
  { href: '/turma', rotulo: 'Turma', Icone: Users },
]

function TemaBotao() {
  const [escuro, setEscuro] = useState(false)
  useEffect(() => setEscuro(document.documentElement.classList.contains('dark')), [])
  return (
    <button
      onClick={() => {
        const novo = !escuro
        document.documentElement.classList.toggle('dark', novo)
        localStorage.setItem('tema', novo ? 'escuro' : 'claro')
        setEscuro(novo)
      }}
      className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--borda)] bg-[var(--painel-2)] hover:bg-[var(--painel)]"
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
    >
      {escuro ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

export function Shell({
  usuario,
  disciplina,
  children,
}: {
  usuario: { id: number; nome: string; email: string; papeis: string[]; foto: string | null }
  disciplina?: { nome: string; curto: string; cor: string } | null
  children: React.ReactNode
}) {
  const caminho = usePathname()
  const [aberto, setAberto] = useState(false)
  useEffect(() => setAberto(false), [caminho])

  const ativo = (href: string) => (href === '/' ? caminho === '/' : caminho.startsWith(href))

  const nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, rotulo, Icone }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
            ativo(href)
              ? 'border-[var(--borda)] bg-[var(--painel)] font-semibold text-fiap-600 shadow-md shadow-fiap-500/10 dark:text-fiap-400'
              : 'border-transparent suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]'
          }`}
        >
          <Icone size={18} />
          {rotulo}
        </Link>
      ))}
    </nav>
  )

  const lateral = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" className="flex items-center gap-2.5 px-2 pt-1">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-fiap-400 to-fiap-500 text-lg font-extrabold text-white shadow-lg shadow-fiap-500/40">
          F
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-bold">Turma FIAP</span>
          <span className="block text-[11px] suave">Plataforma de Estudos</span>
        </span>
      </Link>

      {disciplina && (
        <Link
          href="/disciplinas"
          className="painel flex items-center gap-2.5 p-3 transition-colors hover:bg-[var(--painel-2)]"
          title="Trocar de disciplina"
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px]"
            style={{ background: disciplina.cor, boxShadow: `0 0 0 4px ${disciplina.cor}30` }}
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold">{disciplina.curto}</span>
            <span className="block text-[11px] suave">trocar disciplina</span>
          </span>
        </Link>
      )}

      {nav}
      <div className="mt-auto border-t border-[var(--borda)] pt-3">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-2xl p-2 hover:bg-[var(--painel-2)]"
          title="Meu perfil"
        >
          <Avatar nome={usuario.nome} tamanho={34} usuarioId={usuario.id} foto={usuario.foto} />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium">{usuario.nome}</span>
            <span className="block truncate text-[11px] suave">{usuario.email}</span>
          </span>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <Presenca />
      <aside className="sticky top-0 hidden h-dvh border-r border-[var(--borda)] bg-[var(--painel)] backdrop-blur-2xl lg:block">
        {lateral}
      </aside>

      {/* Drawer no mobile */}
      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-[var(--borda)] bg-[var(--painel)] backdrop-blur-2xl surge">
            <button
              onClick={() => setAberto(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-lg hover:bg-[var(--painel-2)]"
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
            className="flex h-10 flex-1 items-center gap-2 rounded-2xl border border-[var(--borda)] bg-[var(--painel-2)] px-4 text-sm suave hover:bg-[var(--painel)] sm:max-w-sm"
          >
            <Search size={16} />
            Buscar nas aulas…
          </Link>
          <div className="flex-1" />
          <TemaBotao />
          <form action={sair}>
            <button
              type="submit"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-[var(--borda)] bg-[var(--painel-2)] hover:bg-[var(--painel)]"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={17} />
            </button>
          </form>
        </header>
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  )
}
