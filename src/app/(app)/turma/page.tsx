import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { todasAulas, totalAulasGlobais } from '@/lib/conteudo'
import { Cabecalho } from '@/components/cabecalho'
import { EditorPapel } from '@/components/editor-papel'
import { FormAviso } from '@/components/form-aviso'
import { PresencaProvider, StatusPresenca } from '@/components/presenca-live'
import { Avatar, Selo, TagsPapel, quando } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Turma' }

export default async function Turma() {
  const u = await usuarioAtual()
  const total = totalAulasGlobais()

  // Ranking simples de conclusao: motiva sem expor nota de ninguem.
  const membros = await sql<{
    id: number
    nome: string
    email: string
    bio: string
    papeis: string[]
    foto: string | null
    visto_em: string
    aulas: string
    notas: string
    arquivos: string
  }>(
    `SELECT u.id, u.nome, u.email, u.bio, u.papeis, u.foto, u.visto_em,
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
          u.papeis.includes('admin')
            ? `${membros.length} pessoas. Como admin, você define as tags e pode corrigir nomes.`
            : `${membros.length} pessoas estudando por aqui.`
        }
      />

      {u.papeis.includes('admin') && (
        <div className="mb-4">
          <FormAviso />
        </div>
      )}

      <PresencaProvider>
      <ul className="grid gap-3 sm:grid-cols-2">
        {membros.map((m, i) => {
          const pct = total ? Math.round((Number(m.aulas) / total) * 100) : 0
          return (
            <li key={m.id} className="painel flex gap-3 p-4">
              <Avatar nome={m.nome} tamanho={44} usuarioId={m.id} foto={m.foto} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={`/u/${m.id}`} className="truncate font-medium hover:text-fiap-500">
                    {m.nome}
                    {m.id === u.id && <span className="suave"> (você)</span>}
                  </Link>
                  {i === 0 && Number(m.aulas) > 0 && (
                    <Selo tom="fiap">
                      <Trophy size={10} /> mais adiantado
                    </Selo>
                  )}
                  <TagsPapel papeis={m.papeis} />
                </p>
                <p className="truncate text-xs suave">{m.email}</p>
                {m.bio && <p className="mt-1 text-sm">{m.bio}</p>}

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--painel-2)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-fiap-500 to-fiap-400 transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] suave">
                  {m.aulas}/{total} aulas · {m.notas} anotações · {m.arquivos} materiais ·{' '}
                  <StatusPresenca usuarioId={m.id} vistoEm={m.visto_em} eu={m.id === u.id} />
                </p>

                {u.papeis.includes('admin') && (
                  <EditorPapel usuarioId={m.id} papeis={m.papeis} nome={m.nome} ehVoce={m.id === u.id} />
                )}
              </div>
            </li>
          )
        })}
      </ul>
      </PresencaProvider>
    </div>
  )
}
