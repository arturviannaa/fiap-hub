import { EventEmitter } from 'node:events'
import { Client } from 'pg'

export const CANAIS = [
  { slug: 'geral', nome: 'geral', descricao: 'Assunto livre da turma' },
  { slug: 'duvidas', nome: 'dúvidas', descricao: 'Travou num exercício? Pergunta aqui' },
  { slug: 'materiais', nome: 'materiais', descricao: 'Links, resumos e indicações' },
  { slug: 'provas', nome: 'provas', descricao: 'Combinados de estudo e datas' },
] as const

export const canalValido = (slug: string) => CANAIS.some((c) => c.slug === slug)

export type MensagemChat = {
  id: number
  canal: string
  corpo: string
  criado_em: string
  usuario_id: number
  nome: string
}

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
          const [id, canal] = String(n.payload).split(':')
          bus.emit('mensagem', { id: Number(id), canal })
        })
      })
      .catch(() => setTimeout(conectar, 2000))
  }
  conectar()
  return bus
}
