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
      className="grid h-9 w-9 place-items-center rounded-xl border hover:bg-[var(--painel-2)]"
      aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
    >
      {escuro ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

export function Shell({
  usuario,
  children,
}: {
  usuario: { id: number; nome: string; email: string; papeis: string[]; foto: string | null }
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
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
            ativo(href)
              ? 'bg-fiap-500/12 font-medium text-fiap-600 dark:text-fiap-400'
              : 'suave hover:bg-[var(--painel-2)] hover:text-[var(--texto)]'
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
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-fiap-500 font-bold text-white">F</span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Turma FIAP</span>
          <span className="block text-[11px] suave">Plataforma de Estudos</span>
        </span>
      </Link>
      {nav}
      <div className="mt-auto">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--painel-2)]"
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
      <aside className="sticky top-0 hidden h-dvh border-r bg-[var(--painel)] lg:block">{lateral}</aside>

      {/* Drawer no mobile */}
      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAberto(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r bg-[var(--painel)] surge">
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
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-[color-mix(in_srgb,var(--fundo)_88%,transparent)] px-3 backdrop-blur-md sm:px-5">
          <button
            onClick={() => setAberto(true)}
            className="grid h-9 w-9 place-items-center rounded-xl border lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
          <Link
            href="/busca"
            className="flex h-9 flex-1 items-center gap-2 rounded-xl border px-3 text-sm suave hover:bg-[var(--painel-2)] sm:max-w-sm"
          >
            <Search size={16} />
            Buscar nas aulas…
          </Link>
          <div className="flex-1" />
          <TemaBotao />
          <a
            href="/api/auth/signout"
            className="grid h-9 w-9 place-items-center rounded-xl border hover:bg-[var(--painel-2)]"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut size={17} />
          </a>
        </header>
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-7">{children}</main>
      </div>
    </div>
  )
}
