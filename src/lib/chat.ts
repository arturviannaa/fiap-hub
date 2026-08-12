import { EventEmitter } from 'node:events'
import { Client } from 'pg'
import { um, sql } from './db'

// Canais fixos são por-disciplina: o nome real é `<disc>:<base>` (ex.: python:geral).
// Grupos (g:<id>) são compartilhados entre disciplinas.
const CANAIS_BASE = [
  { slug: 'geral', nome: 'geral', descricao: 'Assunto livre da turma' },
  { slug: 'duvidas', nome: 'dúvidas', descricao: 'Travou num exercício? Pergunta aqui' },
  { slug: 'materiais', nome: 'materiais', descricao: 'Links, resumos e indicações' },
  { slug: 'provas', nome: 'provas', descricao: 'Combinados de estudo e datas' },
] as const

const BASES: Set<string> = new Set(CANAIS_BASE.map((c) => c.slug))

// Canais fixos de uma disciplina (o que o cliente lista/usa).
export function canaisDaDisciplina(disc: string) {
  return CANAIS_BASE.map((c) => ({ slug: `${disc}:${c.slug}`, nome: c.nome, descricao: c.descricao }))
}

// `<disc>:<base>` é canal fixo válido; `g:<id>` é grupo; resto é inválido.
export const canalFixo = (canal: string) => {
  const i = canal.indexOf(':')
  if (i < 1) return false
  const disc = canal.slice(0, i)
  const base = canal.slice(i + 1)
  return disc !== 'g' && BASES.has(base)
}

// Canal de grupo privado: 'g:<id>'.
export const grupoDoCanal = (canal: string) => {
  const m = /^g:(\d+)$/.exec(canal)
  return m ? Number(m[1]) : null
}

// Fonte unica de autorizacao do chat: usada pelo SSE e pelo envio de mensagem.
// Canal fixo e da turma inteira; canal de grupo so para quem e membro.
export async function canalPermitido(canal: string, usuarioId: number) {
  if (canalFixo(canal)) return true
  const grupo = grupoDoCanal(canal)
  if (!grupo) return false
  return !!(await um('SELECT 1 FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2', [
    grupo,
    usuarioId,
  ]))
}

export type Grupo = {
  id: number
  nome: string
  descricao: string
  criador_id: number
  membros: number
}

export function gruposDoUsuario(usuarioId: number) {
  return sql<Grupo>(
    `SELECT g.id, g.nome, g.descricao, g.criador_id,
            (SELECT count(*) FROM grupo_membros m WHERE m.grupo_id = g.id)::int AS membros
     FROM grupos g JOIN grupo_membros gm ON gm.grupo_id = g.id
     WHERE gm.usuario_id = $1
     ORDER BY g.nome`,
    [usuarioId],
  )
}

export type Anexo = {
  id: number
  nome: string
  mime: string
  tamanho: number
}

export type MensagemChat = {
  id: number
  canal: string
  corpo: string
  criado_em: string
  usuario_id: number
  nome: string
  papeis: string[]
  foto: string | null
  arquivo_id: number | null
  arquivo_nome: string | null
  arquivo_mime: string | null
  arquivo_tamanho: number | null
}

export const SELECT_MENSAGEM = `
  SELECT m.id, m.canal, m.corpo, m.criado_em, m.usuario_id, u.nome, u.papeis, u.foto,
         m.arquivo_id, a.nome AS arquivo_nome, a.mime AS arquivo_mime, a.tamanho AS arquivo_tamanho
  FROM mensagens m
  JOIN usuarios u ON u.id = m.usuario_id
  LEFT JOIN arquivos a ON a.id = m.arquivo_id`

// Um unico LISTEN por processo alimenta todas as conexoes SSE abertas. Sem
// isso seria uma conexao Postgres por aba aberta.
const g = globalThis as typeof globalThis & { _barramento?: EventEmitter }

export function barramento(): EventEmitter {
  if (g._barramento) return g._barramento
  const bus = new EventEmitter()
  bus.setMaxListeners(0)
  g._barramento = bus

  const conectar = () => {
    const cliente = new Client({ connectionString: process.env.DATABASE_URL })
    cliente.on('error', () => {
      cliente.end().catch(() => {})
      setTimeout(conectar, 2000)
    })
    cliente
      .connect()
      .then(() => cliente.query('LISTEN chat'))
      .then(() => {
        cliente.on('notification', (n) => {
          const [op, id, ...resto] = String(n.payload).split(':')
          // canal de grupo tem ':' no nome, entao o resto e remontado
          bus.emit('mensagem', { op, id: Number(id), canal: resto.join(':') })
        })
      })
      .catch(() => setTimeout(conectar, 2000))
  }
  conectar()
  return bus
}
