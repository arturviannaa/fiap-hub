import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { limparTexto, permitido } from '@/lib/limites'

type Nota = {
  id: number; titulo: string; corpo: string; publica: boolean
  aula_slug: string | null; usuario_id: number; atualizado_em: string
  autor: string; autor_foto: string | null
}

// Lista anotações: minhas (todas) ou da turma (públicas).
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const params = new URL(req.url).searchParams
  const disc = params.get('disciplina') || 'python'
  const aba = params.get('aba') === 'turma' ? 'turma' : 'minhas'
  const notas = await sql<Nota>(
    aba === 'turma'
      ? `SELECT n.id,n.titulo,n.corpo,n.publica,n.aula_slug,n.usuario_id,n.atualizado_em, u.nome AS autor, u.foto AS autor_foto
         FROM notas n JOIN usuarios u ON u.id=n.usuario_id WHERE n.publica AND n.disciplina=$1 ORDER BY n.atualizado_em DESC LIMIT 200`
      : `SELECT n.id,n.titulo,n.corpo,n.publica,n.aula_slug,n.usuario_id,n.atualizado_em, u.nome AS autor, u.foto AS autor_foto
         FROM notas n JOIN usuarios u ON u.id=n.usuario_id WHERE n.usuario_id=$1 AND n.disciplina=$2 ORDER BY n.atualizado_em DESC LIMIT 200`,
    aba === 'turma' ? [disc] : [u.id, disc],
  )
  return Response.json({ notas, euId: u.id })
}

// Cria anotação.
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  if (!permitido(`nota:${u.id}`, 20, 60_000)) return Response.json({ erro: 'Devagar.' }, { status: 429 })
  const b = await req.json().catch(() => ({}))
  const corpo = limparTexto(String(b.corpo || ''), 20000)
  if (!corpo) return Response.json({ erro: 'Escreva algo.' }, { status: 400 })
  const disc = String(b.disciplina || 'python')
  await sql('INSERT INTO notas (usuario_id, aula_slug, titulo, corpo, publica, disciplina) VALUES ($1,$2,$3,$4,$5,$6)', [
    u.id, b.aula || null, String(b.titulo || '').trim().slice(0, 160), corpo, !!b.publica, disc,
  ])
  return Response.json({ ok: true })
}
