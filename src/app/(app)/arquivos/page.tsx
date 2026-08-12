import Link from 'next/link'
import { Download, FileText, Globe, Lock, Trash2, Upload } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { acharAula, todasAulas } from '@/lib/conteudo'
import { discAtiva } from '@/lib/disciplina'
import { redirect } from 'next/navigation'
import { apagarArquivo } from '@/lib/acoes'
import { Cabecalho } from '@/components/cabecalho'
import { FormUpload } from '@/components/form-upload'
import { Selo, Vazio, quando, tamanhoLegivel } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Materiais' }

type Arquivo = {
  id: number
  nome: string
  descricao: string
  tamanho: number
  publico: boolean
  aula_slug: string | null
  usuario_id: number
  downloads: number
  criado_em: string
  autor: string
}

export default async function Arquivos({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const aba = (await searchParams).aba === 'meus' ? 'meus' : 'turma'

  const arquivos = await sql<Arquivo>(
    aba === 'meus'
      ? `SELECT a.*, u.nome AS autor FROM arquivos a JOIN usuarios u ON u.id = a.usuario_id
         WHERE a.usuario_id = $1 AND a.disciplina = $2 AND a.descricao <> 'anexo do chat' ORDER BY a.id DESC`
      : `SELECT a.*, u.nome AS autor FROM arquivos a JOIN usuarios u ON u.id = a.usuario_id
         WHERE a.publico AND a.disciplina = $1 AND a.descricao <> 'anexo do chat' ORDER BY a.id DESC`,
    aba === 'meus' ? [u.id, disc] : [disc],
  )

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo="Materiais"
        descricao="Resumos, listas resolvidas, PDFs e scripts. Público vai para a turma; privado fica só com você."
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="painel h-fit space-y-3 p-4 lg:sticky lg:top-20">
          <h2 className="flex items-center gap-2 font-semibold">
            <Upload size={17} className="text-fiap-500" /> Enviar material
          </h2>
          <FormUpload aulas={todasAulas(disc).map((a) => ({ slug: a.slug, titulo: a.titulo }))} />
        </div>

        <div>
          <div className="mb-4 inline-flex rounded-xl border p-1">
            {(['turma', 'meus'] as const).map((t) => (
              <Link
                key={t}
                href={`/arquivos?aba=${t}`}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  aba === t ? 'bg-fiap-500 font-medium text-white' : 'suave'
                }`}
              >
                {t === 'turma' ? 'Da turma' : 'Meus arquivos'}
              </Link>
            ))}
          </div>

          {arquivos.length === 0 ? (
            <Vazio
              icone={<FileText size={22} />}
              titulo="Nenhum material ainda"
              texto="Envie o primeiro arquivo pelo formulário ao lado."
            />
          ) : (
            <ul className="painel divide-y overflow-hidden">
              {arquivos.map((a) => {
                const aula = a.aula_slug ? acharAula(a.aula_slug) : null
                return (
                  <li key={a.id} className="flex items-center gap-3 p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--painel-2)] suave">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={`/api/arquivos/${a.id}`}
                        className="block truncate font-medium hover:text-fiap-500"
                      >
                        {a.nome}
                      </a>
                      {a.descricao && <p className="truncate text-sm suave">{a.descricao}</p>}
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs suave">
                        <span>{tamanhoLegivel(a.tamanho)}</span>
                        <span>·</span>
                        <span>{a.usuario_id === u.id ? 'você' : a.autor.split(' ')[0]}</span>
                        <span>·</span>
                        <span>{quando(a.criado_em)}</span>
                        {a.downloads > 0 && <span>· {a.downloads} downloads</span>}
                        {aula && (
                          <Link href={`/aulas/${aula.slug}`} className="text-fiap-500 hover:underline">
                            {aula.titulo}
                          </Link>
                        )}
                        {a.publico ? (
                          <Selo tom="fiap">
                            <Globe size={10} /> pública
                          </Selo>
                        ) : (
                          <Selo>
                            <Lock size={10} /> privado
                          </Selo>
                        )}
                      </p>
                    </div>
                    <a href={`/api/arquivos/${a.id}`} className="suave hover:text-fiap-500" aria-label="Baixar">
                      <Download size={17} />
                    </a>
                    {a.usuario_id === u.id && (
                      <form action={apagarArquivo.bind(null, a.id)}>
                        <button className="suave hover:text-red-500" aria-label="Apagar arquivo">
                          <Trash2 size={16} />
                        </button>
                      </form>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
