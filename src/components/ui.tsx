import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none'

const VARIANTES = {
  primario: 'bg-gradient-to-br from-fiap-400 to-fiap-500 text-white hover:from-fiap-500 hover:to-fiap-600 shadow-lg shadow-fiap-500/30',
  neutro: 'border bg-[var(--painel-2)] backdrop-blur-sm hover:bg-[var(--painel)]',
  fantasma: 'hover:bg-[var(--painel-2)] suave hover:text-[var(--texto)]',
  perigo: 'border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10',
} as const

const TAMANHOS = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5',
  icone: 'h-9 w-9',
} as const

type BotaoProps = {
  variante?: keyof typeof VARIANTES
  tamanho?: keyof typeof TAMANHOS
}

export function Botao({
  variante = 'primario',
  tamanho = 'md',
  className = '',
  ...props
}: ComponentProps<'button'> & BotaoProps) {
  return <button className={`${BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`} {...props} />
}

export function BotaoLink({
  variante = 'primario',
  tamanho = 'md',
  className = '',
  ...props
}: ComponentProps<typeof Link> & BotaoProps) {
  return <Link className={`${BASE} ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`} {...props} />
}

export function Campo({ className = '', ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={`h-10 w-full rounded-xl border bg-[var(--painel)] px-3 text-sm placeholder:text-[var(--texto-2)] focus:border-fiap-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}

export function Area({ className = '', ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={`w-full rounded-xl border bg-[var(--painel)] p-3 text-sm leading-relaxed placeholder:text-[var(--texto-2)] focus:border-fiap-500 focus:outline-none ${className}`}
      {...props}
    />
  )
}

// Abas em pill (ex.: "Minhas" / "Da turma"). Navegação por link (searchParams),
// não é estado de cliente — cada aba é uma URL diferente.
export function Segmentado({ itens }: { itens: { href: string; rotulo: string; ativo: boolean }[] }) {
  return (
    <div className="inline-flex gap-0.5 rounded-2xl border bg-[var(--painel-2)] p-1">
      {itens.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            it.ativo
              ? 'bg-gradient-to-br from-fiap-400 to-fiap-500 text-white shadow-md shadow-fiap-500/30'
              : 'suave hover:text-[var(--texto)]'
          }`}
        >
          {it.rotulo}
        </Link>
      ))}
    </div>
  )
}

// Ícone com fundo colorido arredondado + borda (módulos, arquivos, cartões de
// estatística). Um componente só pra não repetir a mesma classe em cada tela.
export function IconeBadge({
  children,
  tamanho = 44,
  tom = 'fiap',
}: {
  children: ReactNode
  tamanho?: number
  tom?: 'fiap' | 'neutro'
}) {
  const tons = {
    fiap: 'border-fiap-500/20 bg-fiap-500/12 text-fiap-500',
    neutro: 'border-[var(--borda)] bg-[var(--painel-2)] suave',
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-2xl border ${tons[tom]}`}
      style={{ width: tamanho, height: tamanho }}
    >
      {children}
    </span>
  )
}

export function Selo({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'fiap' | 'verde' }) {
  const tons = {
    neutro: 'bg-[var(--painel-2)] suave',
    fiap: 'bg-fiap-500/12 text-fiap-600 dark:text-fiap-400',
    verde: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tons[tom]}`}>
      {children}
    </span>
  )
}

const PAPEL_ROTULO: Record<string, { texto: string; classe: string }> = {
  admin: { texto: 'admin', classe: 'bg-fiap-500/15 text-fiap-600 dark:text-fiap-400' },
  professor: { texto: 'professor', classe: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  aluno: { texto: 'aluno', classe: 'bg-sky-500/12 text-sky-600 dark:text-sky-400' },
}

// Ordem de exibição: admin e professor primeiro, aluno por último.
const ORDEM_PAPEL = ['admin', 'professor', 'aluno']

/** Tags de perfil (um usuário pode ter várias). `mudo` esconde 'aluno' —
 *  útil no chat, onde só interessa destacar admin/professor. */
export function TagsPapel({ papeis, mudo }: { papeis: string[]; mudo?: boolean }) {
  const lista = [...new Set(papeis)]
    .filter((p) => (mudo ? p !== 'aluno' : true))
    .sort((a, b) => ORDEM_PAPEL.indexOf(a) - ORDEM_PAPEL.indexOf(b))
  if (lista.length === 0) return null
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {lista.map((papel) => {
        const p = PAPEL_ROTULO[papel] ?? PAPEL_ROTULO.aluno
        return (
          <span
            key={papel}
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${p.classe}`}
          >
            {p.texto}
          </span>
        )
      })}
    </span>
  )
}

export function Vazio({ icone, titulo, texto }: { icone: ReactNode; titulo: string; texto: string }) {
  return (
    <div className="painel flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--painel-2)] suave">{icone}</div>
      <p className="font-medium">{titulo}</p>
      <p className="max-w-sm text-sm suave">{texto}</p>
    </div>
  )
}

const CORES = ['#ed145b', '#7c5cff', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']

// Passe usuarioId + foto para mostrar a foto de perfil; sem eles cai nas
// iniciais coloridas. `foto` (nome do arquivo no disco) entra na URL como
// cache-buster: trocar a foto muda a URL e o navegador rebusca.
export function Avatar({
  nome,
  tamanho = 36,
  usuarioId,
  foto,
}: {
  nome: string
  tamanho?: number
  usuarioId?: number
  foto?: string | null
}) {
  if (usuarioId && foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/avatar/${usuarioId}?v=${encodeURIComponent(foto.slice(7, 15))}`}
        alt={nome}
        width={tamanho}
        height={tamanho}
        loading="lazy"
        className="shrink-0 rounded-full object-cover"
        style={{ width: tamanho, height: tamanho }}
      />
    )
  }
  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  // Cor derivada do nome: estavel entre sessoes.
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cor = CORES[h % CORES.length]
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: tamanho, height: tamanho, background: cor, fontSize: tamanho * 0.38 }}
      aria-hidden
    >
      {iniciais || '?'}
    </span>
  )
}

export function quando(data: string | Date) {
  const d = typeof data === 'string' ? new Date(data) : data
  const seg = (Date.now() - d.getTime()) / 1000
  if (seg < 60) return 'agora'
  if (seg < 3600) return `${Math.floor(seg / 60)} min`
  if (seg < 86400) return `${Math.floor(seg / 3600)} h`
  if (seg < 604800) return `${Math.floor(seg / 86400)} d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// bytes chega como string quando vem do Postgres (BIGINT vira string no pg).
export function tamanhoLegivel(bytes: number | string) {
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = Number(bytes)
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`
}
