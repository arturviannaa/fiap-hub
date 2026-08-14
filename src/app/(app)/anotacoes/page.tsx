import Link from 'next/link'
import { Globe, Lock, NotebookPen, Trash2 } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { acharAula } from '@/lib/conteudo'
import { discAtiva } from '@/lib/disciplina'
import { redirect } from 'next/navigation'
import { apagarNota, salvarNota } from '@/lib/acoes'
import { Cabecalho } from '@/components/cabecalho'
import { Area, Avatar, Botao, Campo, Segmentado, Selo, Vazio, quando } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Anotações' }

type Nota = {
  id: number
  titulo: string
  corpo: string
  publica: boolean
  aula_slug: string | null
  usuario_id: number
  atualizado_em: string
  autor: string
  autor_foto: string | null
}

function Cartao({ n, meu }: { n: Nota; meu: boolean }) {
  const aula = n.aula_slug ? acharAula(n.aula_slug) : null
  return (
    <article className="painel flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-xs suave">
        <Avatar nome={n.autor} tamanho={22} usuarioId={n.usuario_id} foto={n.autor_foto} />
        <span>{meu ? 'você' : n.autor.split(' ')[0]}</span>
        <span>·</span>
        <span>{quando(n.atualizado_em)}</span>
        <div className="flex-1" />
        {n.publica ? (
          <Selo tom="fiap">
            <Globe size={10} /> pública
          </Selo>
        ) : (
          <Selo>
            <Lock size={10} /> privada
          </Selo>
        )}
        {meu && (
          <form action={apagarNota.bind(null, n.id)}>
            <button className="suave hover:text-red-500" aria-label="Apagar anotação">
              <Trash2 size={14} />
            </button>
          </form>
        )}
      </div>
      {n.titulo && <h3 className="font-medium">{n.titulo}</h3>}
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.corpo}</p>
      {aula && (
        <Link href={`/aulas/${aula.slug}`} className="text-xs font-medium text-fiap-500 hover:underline">
          {aula.titulo} →
        </Link>
      )}
    </article>
  )
}

export default async function Anotacoes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const aba = (await searchParams).aba === 'turma' ? 'turma' : 'minhas'

  const notas = await sql<Nota>(
    aba === 'turma'
      ? `SELECT n.*, u.nome AS autor, u.foto AS autor_foto FROM notas n JOIN usuarios u ON u.id = n.usuario_id
         WHERE n.publica AND n.disciplina = $1 ORDER BY n.atualizado_em DESC LIMIT 200`
      : `SELECT n.*, u.nome AS autor, u.foto AS autor_foto FROM notas n JOIN usuarios u ON u.id = n.usuario_id
         WHERE n.usuario_id = $1 AND n.disciplina = $2 ORDER BY n.atualizado_em DESC LIMIT 200`,
    aba === 'turma' ? [disc] : [u.id, disc],
  )

  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo="Anotações"
        descricao="Suas anotações são privadas por padrão. Marque como pública para dividir com a turma."
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <form action={salvarNota} className="painel h-fit space-y-2 p-4 lg:sticky lg:top-20">
          <h2 className="flex items-center gap-2 font-semibold">
            <NotebookPen size={17} className="text-fiap-500" /> Nova anotação
          </h2>
          <Campo name="titulo" placeholder="Título (opcional)" />
          <Area name="corpo" rows={7} placeholder="Escreva aqui…" required />
          <label className="flex cursor-pointer items-center gap-2 text-sm suave">
            <input type="checkbox" name="publica" className="accent-fiap-500" />
            Compartilhar com a turma
          </label>
          <Botao type="submit" className="w-full">
            Salvar anotação
          </Botao>
        </form>

        <div>
          <div className="mb-4">
            <Segmentado
              itens={[
                { href: '/anotacoes?aba=minhas', rotulo: 'Minhas', ativo: aba === 'minhas' },
                { href: '/anotacoes?aba=turma', rotulo: 'Da turma', ativo: aba === 'turma' },
              ]}
            />
          </div>

          {notas.length === 0 ? (
            <Vazio
              icone={<NotebookPen size={22} />}
              titulo="Nada por aqui ainda"
              texto={
                aba === 'minhas'
                  ? 'Escreva sua primeira anotação no formulário ao lado.'
                  : 'Ninguém compartilhou anotações públicas ainda.'
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {notas.map((n) => (
                <Cartao key={n.id} n={n} meu={n.usuario_id === u.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
