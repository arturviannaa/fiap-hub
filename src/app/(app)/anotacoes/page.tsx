import { usuarioAtual } from '@/lib/auth'
import { sql, um } from '@/lib/db'
import { acharAula } from '@/lib/conteudo'
import { discAtiva } from '@/lib/disciplina'
import { redirect } from 'next/navigation'
import { Cabecalho } from '@/components/cabecalho'
import { QuadroAnotacoes, type NotaComTag } from '@/components/quadro-anotacoes'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Anotações' }

type NotaLinha = Omit<NotaComTag, 'tag'>

export default async function Anotacoes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const aba = (await searchParams).aba === 'turma' ? 'turma' : 'minhas'

  const [notas, minhas, turma] = await Promise.all([
    sql<NotaLinha>(
      aba === 'turma'
        ? `SELECT n.id, n.titulo, n.corpo, n.publica, n.estilo, n.aula_slug, n.usuario_id, n.atualizado_em, u.nome AS autor
           FROM notas n JOIN usuarios u ON u.id = n.usuario_id
           WHERE n.publica AND n.disciplina = $1 ORDER BY n.atualizado_em DESC LIMIT 200`
        : `SELECT n.id, n.titulo, n.corpo, n.publica, n.estilo, n.aula_slug, n.usuario_id, n.atualizado_em, u.nome AS autor
           FROM notas n JOIN usuarios u ON u.id = n.usuario_id
           WHERE n.usuario_id = $1 AND n.disciplina = $2 ORDER BY n.atualizado_em DESC LIMIT 200`,
      aba === 'turma' ? [disc] : [u.id, disc],
    ),
    um<{ c: string }>('SELECT count(*)::text c FROM notas WHERE usuario_id = $1 AND disciplina = $2', [u.id, disc]),
    um<{ c: string }>('SELECT count(*)::text c FROM notas WHERE publica AND disciplina = $1', [disc]),
  ])

  const notasComTag: NotaComTag[] = notas.map((n) => ({
    ...n,
    tag: n.aula_slug ? (acharAula(n.aula_slug)?.moduloTitulo ?? null) : null,
  }))

  return (
    <div className="mx-auto max-w-6xl">
      <Cabecalho
        titulo="Anotações"
        descricao="Um quadro com suas anotações. Privadas por padrão — publique para dividir com a turma."
      />

      <QuadroAnotacoes
        notas={notasComTag}
        aba={aba}
        meuId={u.id}
        contagens={{ minhas: Number(minhas?.c ?? 0), turma: Number(turma?.c ?? 0) }}
      />
    </div>
  )
}
