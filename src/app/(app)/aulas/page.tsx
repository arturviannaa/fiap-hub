import Link from 'next/link'
import { Check, Clock, Code2 } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { conteudo, ehNova } from '@/lib/conteudo'
import { discAtiva } from '@/lib/disciplina'
import { redirect } from 'next/navigation'
import { Cabecalho } from '@/components/cabecalho'
import { IconeModulo } from '@/components/icone-modulo'
import { Selo } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Aulas' }

export default async function Aulas() {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const dados = conteudo(disc)
  const feitas = await sql<{ aula_slug: string }>('SELECT aula_slug FROM progresso WHERE usuario_id = $1', [u.id])
  const concluidas = new Set(feitas.map((f) => f.aula_slug))

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo={dados.disciplina.nome}
        descricao={`${dados.disciplina.totalAulas} aulas · material da prof. ${dados.disciplina.professor}, sincronizado do repositório oficial da disciplina.`}
      />

      <div className="space-y-8">
        {dados.modulos.map((m, iM) => (
          <section key={m.slug} id={m.slug} className="scroll-mt-20">
            <div className="mb-3 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fiap-500/12 text-fiap-500">
                <IconeModulo nome={m.icone} />
              </span>
              <div>
                <h2 className="font-semibold">
                  <span className="suave">{String(iM + 1).padStart(2, '0')}.</span> {m.titulo}
                </h2>
                <p className="text-sm suave">{m.resumo}</p>
              </div>
            </div>

            <ul className="painel divide-y overflow-hidden">
              {m.aulas.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/aulas/${a.slug}`}
                    className="flex items-center gap-3 p-3.5 transition-colors hover:bg-[var(--painel-2)] sm:px-4"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                        concluidas.has(a.slug) ? 'border-emerald-500 bg-emerald-500 text-white' : ''
                      }`}
                    >
                      {concluidas.has(a.slug) && <Check size={14} strokeWidth={3} />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {a.titulo}
                        {ehNova(a) && <Selo tom="fiap">novo</Selo>}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs suave">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {a.minutos} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Code2 size={12} /> {a.exemplos} exemplos
                        </span>
                        <span className="hidden gap-1 sm:inline-flex">
                          {a.tags.slice(0, 4).map((t) => (
                            <code key={t} className="rounded bg-[var(--painel-2)] px-1.5 py-0.5 text-[10px]">
                              {t}
                            </code>
                          ))}
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
