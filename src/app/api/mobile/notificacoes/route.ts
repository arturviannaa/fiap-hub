import { sql, um } from '@/lib/db'
import { conteudo, ehNova } from '@/lib/conteudo'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

type Notif = { tipo: string; titulo: string; texto: string; quando: string; canal?: string; slug?: string }

// Feed de notificações: convites de grupo recentes + aulas novas. O "não lido"
// é o que é mais novo que a última vez que o usuário abriu a aba.
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const row = await um<{ notif_visto_em: string; notif_limpo_em: string }>(
    'SELECT notif_visto_em, notif_limpo_em FROM usuarios WHERE id = $1', [u.id])
  const visto = new Date(row?.notif_visto_em || 0).getTime()
  const limpo = new Date(row?.notif_limpo_em || 0).getTime()

  // convites: grupos onde entrei recentemente e não sou o criador
  const convites = await sql<{ id: number; nome: string; entrou_em: string; criador: string }>(
    `SELECT g.id, g.nome, gm.entrou_em, uc.nome AS criador
     FROM grupo_membros gm JOIN grupos g ON g.id = gm.grupo_id JOIN usuarios uc ON uc.id = g.criador_id
     WHERE gm.usuario_id = $1 AND g.criador_id <> $1
     ORDER BY gm.entrou_em DESC LIMIT 20`,
    [u.id],
  )

  const notifs: Notif[] = convites.map((c) => ({
    tipo: 'grupo',
    titulo: `Você entrou no grupo "${c.nome}"`,
    texto: `Adicionado por ${c.criador.split(' ')[0]}`,
    quando: c.entrou_em,
    canal: `g:${c.id}`,
  }))

  for (const a of conteudo().modulos.flatMap((m) => m.aulas)) {
    if (ehNova(a) && a.atualizadoEm) {
      notifs.push({
        tipo: 'aula',
        titulo: `Nova aula: ${a.titulo}`,
        texto: a.moduloTitulo,
        quando: a.atualizadoEm,
        slug: a.slug,
      })
    }
  }

  // Esconde o que o usuário já limpou da caixa.
  const visiveis = notifs
    .filter((n) => new Date(n.quando).getTime() > limpo)
    .sort((a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime())
  const naoLidas = visiveis.filter((n) => new Date(n.quando).getTime() > visto).length
  return Response.json({ notificacoes: visiveis.slice(0, 40), naoLidas })
}
