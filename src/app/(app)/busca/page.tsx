import Link from 'next/link'
import { BookOpen, FileText, NotebookPen, Search } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { todasAulas } from '@/lib/conteudo'
import { discOuPadrao } from '@/lib/disciplina'
import { Cabecalho } from '@/components/cabecalho'
import { Campo, Selo, Vazio, tamanhoLegivel } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Busca' }

const semAcento = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Trecho ao redor da primeira ocorrencia, com o termo destacado.
function trecho(texto: string, termo: string) {
  const i = semAcento(texto).indexOf(semAcento(termo))
  if (i < 0) return texto.slice(0, 160)
  const ini = Math.max(0, i - 70)
  const bruto = (ini > 0 ? '…' : '') + texto.slice(ini, i + termo.length + 110) + '…'
  return bruto
}

function Destaque({ texto, termo }: { texto: string; termo: string }) {
  const idx = semAcento(texto).indexOf(semAcento(termo))
  if (idx < 0) return <>{texto}</>
  return (
    <>
      {texto.slice(0, idx)}
      <mark className="rounded bg-fiap-500/25 px-0.5 text-inherit">{texto.slice(idx, idx + termo.length)}</mark>
      {texto.slice(idx + termo.length)}
    </>
  )
}

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const u = await usuarioAtual()
  const disc = await discOuPadrao()
  const q = ((await searchParams).q || '').trim()

  const aulas = q
    ? todasAulas(disc)
        .map((a) => ({
          aula: a,
          hit:
            semAcento(a.titulo).includes(semAcento(q)) ||
            a.tags.some((t) => semAcento(t).includes(semAcento(q))),
          pos: semAcento(a.textoBusca).indexOf(semAcento(q)),
        }))
        .filter((r) => r.hit || r.pos >= 0)
        .slice(0, 20)
    : []

  const [notas, arquivos] = q
    ? await Promise.all([
        sql<{ id: number; titulo: string; corpo: string; aula_slug: string | null; autor: string }>(
          `SELECT n.id, n.titulo, n.corpo, n.aula_slug, u.nome AS autor
           FROM notas n JOIN usuarios u ON u.id = n.usuario_id
           WHERE (n.publica OR n.usuario_id = $1) AND (n.corpo ILIKE $2 OR n.titulo ILIKE $2)
           ORDER BY n.id DESC LIMIT 20`,
          [u.id, `%${q}%`],
        ),
        sql<{ id: number; nome: string; descricao: string; tamanho: number; autor: string }>(
          `SELECT a.id, a.nome, a.descricao, a.tamanho, u.nome AS autor
           FROM arquivos a JOIN usuarios u ON u.id = a.usuario_id
           WHERE (a.publico OR a.usuario_id = $1) AND (a.nome ILIKE $2 OR a.descricao ILIKE $2)
           ORDER BY a.id DESC LIMIT 20`,
          [u.id, `%${q}%`],
        ),
      ])
    : [[], []]

  const total = aulas.length + notas.length + arquivos.length

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Busca" descricao="Procura no conteúdo das aulas, nas anotações e nos materiais." />

      <form className="relative mb-6">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 suave" />
        <Campo
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="ex.: dicionário, try except, list comprehension…"
          className="h-12 pl-10 text-base"
        />
      </form>

      {!q ? (
        <Vazio
          icone={<Search size={22} />}
          titulo="O que você procura?"
          texto="Digite um termo para buscar em todas as aulas da disciplina, nas anotações da turma e nos materiais."
        />
      ) : total === 0 ? (
        <Vazio icone={<Search size={22} />} titulo={`Nada encontrado para “${q}”`} texto="Tente outro termo." />
      ) : (
        <div className="space-y-6">
          {aulas.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold suave">
                <BookOpen size={15} /> Aulas ({aulas.length})
              </h2>
              <ul className="painel divide-y overflow-hidden">
                {aulas.map(({ aula, pos }) => (
                  <li key={aula.slug}>
                    <Link href={`/aulas/${aula.slug}`} className="block p-4 hover:bg-[var(--painel-2)]">
                      <p className="text-[11px] suave">{aula.moduloTitulo}</p>
                      <p className="font-medium">
                        <Destaque texto={aula.titulo} termo={q} />
                      </p>
                      {pos >= 0 && (
                        <p className="mt-1 line-clamp-2 font-mono text-xs suave">
                          <Destaque texto={trecho(aula.textoBusca, q)} termo={q} />
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {notas.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold suave">
                <NotebookPen size={15} /> Anotações ({notas.length})
              </h2>
              <ul className="painel divide-y overflow-hidden">
                {notas.map((n) => (
                  <li key={n.id} className="p-4">
                    <p className="text-[11px] suave">{n.autor}</p>
                    {n.titulo && <p className="font-medium">{n.titulo}</p>}
                    <p className="line-clamp-2 text-sm">
                      <Destaque texto={trecho(n.corpo, q)} termo={q} />
                    </p>
                    {n.aula_slug && (
                      <Link href={`/aulas/${n.aula_slug}`} className="text-xs text-fiap-500 hover:underline">
                        ver aula →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {arquivos.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold suave">
                <FileText size={15} /> Materiais ({arquivos.length})
              </h2>
              <ul className="painel divide-y overflow-hidden">
                {arquivos.map((a) => (
                  <li key={a.id} className="p-4">
                    <a href={`/api/arquivos/${a.id}`} className="font-medium hover:text-fiap-500">
                      <Destaque texto={a.nome} termo={q} />
                    </a>
                    <p className="text-xs suave">
                      {a.autor} · {tamanhoLegivel(a.tamanho)}
                    </p>
                    {a.descricao && <p className="mt-0.5 text-sm suave">{a.descricao}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {q && total > 0 && (
        <p className="mt-6 text-center text-xs suave">
          <Selo>{total} resultados</Selo>
        </p>
      )}
    </div>
  )
}
