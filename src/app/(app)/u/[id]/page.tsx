import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen, Files, MessageSquare, NotebookPen, Pencil } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { um } from '@/lib/db'
import { todasAulas } from '@/lib/conteudo'
import { Avatar, BotaoLink, TagsPapel, quando } from '@/components/ui'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const p = Number.isInteger(id) ? await um<{ nome: string }>('SELECT nome FROM usuarios WHERE id = $1', [id]) : null
  return { title: p ? p.nome : 'Perfil' }
}

export default async function PerfilPublico({ params }: { params: Promise<{ id: string }> }) {
  const eu = await usuarioAtual()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id < 1) notFound()

  const p = await um<{
    id: number
    nome: string
    email: string
    bio: string
    papeis: string[]
    foto: string | null
    criado_em: string
    visto_em: string
    aulas: string
    notas: string
    arquivos: string
  }>(
    `SELECT u.id, u.nome, u.email, u.bio, u.papeis, u.foto, u.criado_em, u.visto_em,
            (SELECT count(*) FROM progresso p WHERE p.usuario_id = u.id)::text AS aulas,
            (SELECT count(*) FROM notas n WHERE n.usuario_id = u.id AND n.publica)::text AS notas,
            (SELECT count(*) FROM arquivos a WHERE a.usuario_id = u.id AND a.publico)::text AS arquivos
     FROM usuarios u WHERE u.id = $1`,
    [id],
  )
  if (!p) notFound()

  const total = todasAulas().length
  const ehVoce = p.id === eu.id
  const online = Date.now() - new Date(p.visto_em).getTime() < 90_000

  const stats = [
    { Icone: BookOpen, valor: `${p.aulas}/${total}`, rotulo: 'aulas concluídas' },
    { Icone: NotebookPen, valor: p.notas, rotulo: 'anotações públicas' },
    { Icone: Files, valor: p.arquivos, rotulo: 'materiais públicos' },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/turma" className="mb-4 inline-flex items-center gap-1.5 text-sm suave hover:text-fiap-500">
        <ArrowLeft size={15} /> Turma
      </Link>

      <div className="painel p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar nome={p.nome} tamanho={80} usuarioId={p.id} foto={p.foto} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{p.nome}</h1>
              <TagsPapel papeis={p.papeis} />
            </div>
            <p className="truncate text-sm suave">{p.email}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs suave">
              <span
                className={`inline-block h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-[var(--borda)]'}`}
              />
              {online ? 'ativo agora' : `ativo ${quando(p.visto_em)} atrás`}
            </p>
          </div>
          {ehVoce && (
            <BotaoLink href="/perfil" variante="neutro" tamanho="sm">
              <Pencil size={14} /> Editar
            </BotaoLink>
          )}
        </div>

        {p.bio && <p className="mt-4 border-t pt-4 text-sm leading-relaxed">{p.bio}</p>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map(({ Icone, valor, rotulo }) => (
          <div key={rotulo} className="painel p-4">
            <Icone size={17} className="text-fiap-500" />
            <p className="mt-2 text-xl font-semibold">{valor}</p>
            <p className="text-xs suave">{rotulo}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs suave">
        Na turma desde{' '}
        {new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </p>

      {!ehVoce && (
        <div className="mt-4 flex justify-center">
          <BotaoLink href="/chat" variante="neutro">
            <MessageSquare size={15} /> Ir para o chat
          </BotaoLink>
        </div>
      )}
    </div>
  )
}
