import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'
import { anexarReacoes, canaisDaDisciplina, SELECT_MENSAGEM, canalPermitido, gruposDoUsuario, type MensagemChat } from '@/lib/chat'
import { COOLDOWN_CHAT_MS, esperaRestante, limparTexto, marcarAcao } from '@/lib/limites'
import { pushMensagemGrupo } from '@/lib/push'

const moderador = (u: { papeis: string[] }) => u.papeis.includes('admin') || u.papeis.includes('professor')

// Histórico de um canal + a lista de canais fixos e os grupos do usuário.
export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const params = new URL(req.url).searchParams
  const disc = params.get('disciplina') || 'python'
  const canal = params.get('canal') || `${disc}:geral`
  if (!(await canalPermitido(canal, u.id))) return Response.json({ erro: 'sem acesso' }, { status: 403 })

  const [mensagens, grupos] = await Promise.all([
    sql<MensagemChat>(`${SELECT_MENSAGEM} WHERE m.canal = $1 ORDER BY m.id DESC LIMIT 80`, [canal]),
    gruposDoUsuario(u.id),
  ])

  return Response.json({
    canais: canaisDaDisciplina(disc),
    grupos,
    mensagens: await anexarReacoes(mensagens.reverse(), u.id),
    eu: { id: u.id, nome: u.nome, papeis: u.papeis },
  })
}

// Envia mensagem (mesmo cooldown/saneamento do site; admin e professor furam o cooldown).
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()

  const { canal, corpo } = await req.json().catch(() => ({}))
  if (!(await canalPermitido(String(canal || ''), u.id)))
    return Response.json({ erro: 'Você não participa deste canal.' }, { status: 403 })

  if (!moderador(u)) {
    const espera = esperaRestante(`chat:${u.id}`, COOLDOWN_CHAT_MS)
    if (espera > 0) return Response.json({ erro: `Aguarde ${espera}s.`, espera }, { status: 429 })
  }

  const texto = limparTexto(String(corpo || ''))
  if (!texto) return Response.json({ erro: 'Mensagem vazia.' }, { status: 400 })

  marcarAcao(`chat:${u.id}`)
  await sql('INSERT INTO mensagens (canal, usuario_id, corpo) VALUES ($1,$2,$3)', [canal, u.id, texto])
  pushMensagemGrupo(canal, u.id, u.nome, texto).catch(() => {})
  return Response.json({ ok: true })
}
