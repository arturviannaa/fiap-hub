import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { gruposDoUsuario } from '@/lib/chat'
import { Cabecalho } from '@/components/cabecalho'
import { GradeGrupos, type GrupoComMembros } from '@/components/grade-grupos'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Grupos' }

export default async function Grupos() {
  const u = await usuarioAtual()
  const [grupos, turma] = await Promise.all([
    gruposDoUsuario(u.id),
    sql<{ id: number; nome: string; foto: string | null }>(
      'SELECT id, nome, foto FROM usuarios WHERE id <> $1 ORDER BY nome',
      [u.id],
    ),
  ])

  const membrosPorGrupo = grupos.length
    ? await sql<{ grupo_id: number; id: number; nome: string; foto: string | null }>(
        `SELECT gm.grupo_id, u.id, u.nome, u.foto FROM grupo_membros gm
         JOIN usuarios u ON u.id = gm.usuario_id
         WHERE gm.grupo_id = ANY($1::int[]) ORDER BY u.nome`,
        [grupos.map((g) => g.id)],
      )
    : []

  const gruposComMembros: GrupoComMembros[] = grupos.map((g) => {
    const membros = membrosPorGrupo.filter((m) => m.grupo_id === g.id)
    const fora = turma.filter((p) => !membros.some((m) => m.id === p.id))
    return { id: g.id, nome: g.nome, descricao: g.descricao, criador_id: g.criador_id, membros, fora }
  })

  return (
    <div className="mx-auto max-w-6xl">
      <Cabecalho
        titulo="Grupos"
        descricao="Espaços privados para trabalho em equipe: só quem foi convidado vê as mensagens e os arquivos."
      />

      <GradeGrupos grupos={gruposComMembros} turma={turma} meuId={u.id} />
    </div>
  )
}
