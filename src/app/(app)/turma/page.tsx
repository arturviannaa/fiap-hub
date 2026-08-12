import { Trophy } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { todasAulas } from '@/lib/conteudo'
import { Cabecalho } from '@/components/cabecalho'
import { EditorPapel } from '@/components/editor-papel'
import { Avatar, Selo, TagPapel, quando } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Turma' }

export default async function Turma() {
  const u = await usuarioAtual()
  const total = todasAulas().length

  // Ranking simples de conclusao: motiva sem expor nota de ninguem.
  const membros = await sql<{
    id: number
    nome: string
    email: string
    bio: string
    papel: string
    foto: string | null
    visto_em: string
    aulas: string
    notas: string
    arquivos: string
  }>(
    `SELECT u.id, u.nome, u.email, u.bio, u.papel, u.foto, u.visto_em,
            (SELECT count(*) FROM progresso p WHERE p.usuario_id = u.id)::text AS aulas,
            (SELECT count(*) FROM notas n WHERE n.usuario_id = u.id AND n.publica)::text AS notas,
            (SELECT count(*) FROM arquivos a WHERE a.usuario_id = u.id AND a.publico)::text AS arquivos
     FROM usuarios u ORDER BY (SELECT count(*) FROM progresso p WHERE p.usuario_id = u.id) DESC, u.nome`,
  )

  return (
    <div className="mx-auto max-w-4xl">
      <Cabecalho
        titulo="Turma"
        descricao={
          u.papel === 'admin'
            ? `${membros.length} pessoas. Como admin, você define as tags e pode corrigir nomes.`
            : `${membros.length} pessoas estudando por aqui.`
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {membros.map((m, i) => {
          const pct = total ? Math.round((Number(m.aulas) / total) * 100) : 0
          return (
            <li key={m.id} className="painel flex gap-3 p-4">
              <Avatar nome={m.nome} tamanho={44} usuarioId={m.id} foto={m.foto} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">
                    {m.nome}
                    {m.id === u.id && <span className="suave"> (você)</span>}
                  </span>
                  {i === 0 && Number(m.aulas) > 0 && (
                    <Selo tom="fiap">
                      <Trophy size={10} /> mais adiantado
                    </Selo>
                  )}
                  <TagPapel papel={m.papel} />
                </p>
                <p className="truncate text-xs suave">{m.email}</p>
                {m.bio && <p className="mt-1 text-sm">{m.bio}</p>}

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--painel-2)]">
                  <div className="h-full rounded-full bg-fiap-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] suave">
                  {m.aulas}/{total} aulas · {m.notas} anotações · {m.arquivos} materiais · ativo{' '}
                  {quando(m.visto_em)} atrás
                </p>

                {u.papel === 'admin' && (
                  <EditorPapel usuarioId={m.id} papel={m.papel} nome={m.nome} ehVoce={m.id === u.id} />
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
