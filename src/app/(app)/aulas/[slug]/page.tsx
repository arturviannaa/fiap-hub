import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, Code2, ExternalLink, FolderGit2, ListTree } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql, um } from '@/lib/db'
import { acharAula, conteudo, disciplinaDaAula, vizinhas } from '@/lib/conteudo'
import { BlocoCodigo } from '@/components/bloco-codigo'
import { MarcarAula } from '@/components/marcar-aula'
import { NotasDaAula } from '@/components/notas-aula'
import { ArquivosDaAula } from '@/components/arquivos-aula'
import { Selo } from '@/components/ui'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const aula = acharAula((await params).slug)
  return { title: aula?.titulo ?? 'Aula' }
}

// Indice lateral: h2/h3 do markdown ja renderizado.
function indice(html: string[]) {
  const itens: { id: string; texto: string; nivel: number }[] = []
  for (const h of html) {
    for (const m of h.matchAll(/<h([23]) id="([^"]*)">([\s\S]*?)<\/h[23]>/g)) {
      const texto = m[3].replace(/<[^>]*>/g, '').trim()
      if (texto && m[2]) itens.push({ id: m[2], texto, nivel: Number(m[1]) })
    }
  }
  return itens
}

export default async function PaginaAula({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const aula = acharAula(slug)
  if (!aula) notFound()

  const u = await usuarioAtual()
  const [feito, notas, arquivos] = await Promise.all([
    um('SELECT 1 FROM progresso WHERE usuario_id = $1 AND aula_slug = $2', [u.id, slug]),
    sql(
      `SELECT n.id, n.titulo, n.corpo, n.publica, n.usuario_id, n.atualizado_em, u.nome AS autor, u.foto AS autor_foto
       FROM notas n JOIN usuarios u ON u.id = n.usuario_id
       WHERE n.aula_slug = $1 AND (n.publica OR n.usuario_id = $2)
       ORDER BY n.id DESC`,
      [slug, u.id],
    ),
    sql(
      `SELECT a.id, a.nome, a.tamanho, a.publico, a.usuario_id, a.criado_em, u.nome AS autor
       FROM arquivos a JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.aula_slug = $1 AND (a.publico OR a.usuario_id = $2)
       ORDER BY a.id DESC`,
      [slug, u.id],
    ),
  ])

  const { anterior, proxima } = vizinhas(slug)
  const toc = indice(aula.blocos.filter((b) => b.tipo === 'md').map((b: any) => b.html))
  const fonte = conteudo(disciplinaDaAula(slug)).disciplina.fonte

  let nCodigo = 0

  return (
    <div className="mx-auto max-w-6xl xl:grid xl:grid-cols-[1fr_15rem] xl:gap-8">
      <article className="min-w-0">
        <nav className="mb-3 flex items-center gap-1.5 text-xs suave">
          <Link href="/aulas" className="hover:text-fiap-500">
            Aulas
          </Link>
          <span>/</span>
          <Link href={`/aulas#${aula.modulo}`} className="hover:text-fiap-500">
            {aula.moduloTitulo}
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{aula.titulo}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs suave">
          <span className="inline-flex items-center gap-1">
            <Clock size={13} /> {aula.minutos} min de leitura
          </span>
          <span className="inline-flex items-center gap-1">
            <Code2 size={13} /> {aula.exemplos} exemplos
          </span>
          {aula.atualizadoEm && (
            <span>
              atualizado em{' '}
              {new Date(aula.atualizadoEm).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
          <a
            href={`${fonte}/blob/main/${encodeURI(aula.arquivoOrigem)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-fiap-500"
          >
            <FolderGit2 size={13} /> ver no GitHub <ExternalLink size={11} />
          </a>
        </div>

        {aula.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {aula.tags.map((t) => (
              <Selo key={t}>{t}</Selo>
            ))}
          </div>
        )}

        <div className="mt-7 space-y-5">
          {aula.blocos.map((b, i) =>
            // HTML sanitizado em build time por scripts/sanitiza.mjs (allowlist).
            // Nunca injete aqui nada que não tenha passado por limparHtml().
            // Sanitizar quebraria tabela do pandas; upgrade só se a fonte deixar de ser confiável.
            b.tipo === 'md' ? (
              <div key={i} className="aula-md" dangerouslySetInnerHTML={{ __html: b.html }} />
            ) : (
              <div key={i} className="space-y-2">
                <BlocoCodigo html={b.html} codigo={b.codigo} indice={++nCodigo} />
                {b.saidas.map((s, j) => (
                  <div key={j} className="rounded-xl border bg-[var(--painel-2)] px-4 py-3">
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide suave">saída</p>
                    {s.tipo === 'imagem' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.src} alt="Gráfico gerado pela célula" className="max-w-full rounded-lg" />
                    ) : s.tipo === 'html' ? (
                      <div className="saida-html overflow-x-auto" dangerouslySetInnerHTML={{ __html: s.html }} />
                    ) : (
                      <pre
                        className={`overflow-x-auto whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed ${
                          s.tipo === 'erro' ? 'text-red-500' : ''
                        }`}
                      >
                        {s.texto}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ),
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
          <MarcarAula slug={slug} concluida={!!feito} />
          <div className="flex-1" />
          {anterior && (
            <Link
              href={`/aulas/${anterior.slug}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm hover:bg-[var(--painel-2)]"
            >
              <ArrowLeft size={15} /> <span className="hidden sm:inline">{anterior.titulo}</span>
              <span className="sm:hidden">Anterior</span>
            </Link>
          )}
          {proxima && (
            <Link
              href={`/aulas/${proxima.slug}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm hover:bg-[var(--painel-2)]"
            >
              <span className="hidden sm:inline">{proxima.titulo}</span>
              <span className="sm:hidden">Próxima</span> <ArrowRight size={15} />
            </Link>
          )}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <NotasDaAula aula={slug} notas={notas} usuarioId={u.id} />
          <ArquivosDaAula aula={slug} arquivos={arquivos} usuarioId={u.id} />
        </div>
      </article>

      {toc.length > 2 && (
        <aside className="hidden xl:block">
          <div className="sticky top-20">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide suave">
              <ListTree size={13} /> Nesta aula
            </p>
            <ul className="space-y-1 border-l text-sm">
              {toc.map((t, i) => (
                <li key={i}>
                  <a
                    href={`#${t.id}`}
                    className={`block border-l-2 border-transparent py-1 pr-2 suave transition-colors hover:border-fiap-500 hover:text-[var(--texto)] ${
                      t.nivel === 3 ? 'pl-6 text-[13px]' : 'pl-3'
                    }`}
                  >
                    {t.texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}
    </div>
  )
}
