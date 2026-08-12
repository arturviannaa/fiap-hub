import { sql, um } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { gruposDoUsuario } from '@/lib/chat'
import { limparTexto, permitido } from '@/lib/limites'

// Lista meus grupos + a turma (pra escolher quem entra num grupo novo).
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const [grupos, turma] = await Promise.all([
    gruposDoUsuario(u.id),
    sql<{ id: number; nome: string; foto: string | null }>(
      'SELECT id, nome, foto FROM usuarios WHERE id <> $1 ORDER BY nome',
      [u.id],
    ),
  ])
  return Response.json({ grupos, turma })
}

// Cria grupo com os membros escolhidos (o criador entra sempre).
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  if (!permitido(`grupo:${u.id}`, 5, 3_600_000)) return Response.json({ erro: 'Muitos grupos por hoje.' }, { status: 429 })

  const { nome, descricao, membros } = await req.json().catch(() => ({}))
  const nomeLimpo = limparTexto(String(nome || ''), 60)
  if (nomeLimpo.length < 2) return Response.json({ erro: 'Dê um nome ao grupo.' }, { status: 400 })

  const ids = Array.isArray(membros) ? membros.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 60) : []
  const grupo = await um<{ id: number }>(
    'INSERT INTO grupos (nome, descricao, criador_id) VALUES ($1,$2,$3) RETURNING id',
    [nomeLimpo, limparTexto(String(descricao || ''), 160), u.id],
  )
  await sql(
    `INSERT INTO grupo_membros (grupo_id, usuario_id)
     SELECT $1, id FROM usuarios WHERE id = ANY($2::int[]) ON CONFLICT DO NOTHING`,
    [grupo!.id, [u.id, ...ids]],
  )
  return Response.json({ ok: true, grupoId: grupo!.id, canal: `g:${grupo!.id}` })
}
