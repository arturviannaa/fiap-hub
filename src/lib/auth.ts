import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sql, um } from './db'

export type Usuario = {
  id: number
  email: string
  nome: string
  papel: 'aluno' | 'admin'
  bio: string
}

// Dominios institucionais aceitos. A plataforma e da turma, entao email de fora
// simplesmente nao entra.
const DOMINIOS = (process.env.ALLOWED_EMAIL_DOMAINS || 'fiap.com.br,alunos.fiap.com.br')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

export function dominioPermitido(email: string) {
  const dominio = email.toLowerCase().split('@')[1]
  return !!dominio && DOMINIOS.some((d) => dominio === d || dominio.endsWith('.' + d))
}

export const dominiosTexto = DOMINIOS.map((d) => '@' + d).join(' ou ')

function nomeDoEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

export async function acharOuCriar(email: string, nome: string, provedor: string) {
  const existente = await um<Usuario>('SELECT id, email, nome, papel, bio FROM usuarios WHERE email = $1', [
    email.toLowerCase(),
  ])
  if (existente) {
    await sql('UPDATE usuarios SET visto_em = now() WHERE id = $1', [existente.id])
    return existente
  }
  // Primeiro a entrar vira admin: alguem precisa moderar e nao ha console.
  const [{ total }] = await sql<{ total: string }>('SELECT count(*)::text AS total FROM usuarios')
  const papel = total === '0' ? 'admin' : 'aluno'
  return um<Usuario>(
    `INSERT INTO usuarios (email, nome, provedor, papel) VALUES ($1, $2, $3, $4)
     RETURNING id, email, nome, papel, bio`,
    [email.toLowerCase(), nome || nomeDoEmail(email), provedor, papel],
  )
}

const provedores = [
  Credentials({
    name: 'Institucional',
    credentials: { email: {}, senha: {} },
    async authorize(dados) {
      const email = String(dados?.email || '').trim().toLowerCase()
      const senha = String(dados?.senha || '')
      if (!email || !senha || !dominioPermitido(email)) return null
      const conta = await um<Usuario & { senha_hash: string | null }>(
        'SELECT id, email, nome, papel, bio, senha_hash FROM usuarios WHERE email = $1',
        [email],
      )
      if (!conta?.senha_hash) return null
      if (!(await bcrypt.compare(senha, conta.senha_hash))) return null
      await sql('UPDATE usuarios SET visto_em = now() WHERE id = $1', [conta.id])
      return { id: String(conta.id), email: conta.email, name: conta.nome, papel: conta.papel }
    },
  }),
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: provedores,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/entrar', error: '/entrar' },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = Number(user.id)
        token.papel = (user as any).papel || 'aluno'
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.uid as number
        ;(session.user as any).papel = token.papel as string
      }
      return session
    },
  },
})

// Usado por toda pagina e server action: devolve o usuario logado ou lanca.
export async function usuarioAtual(): Promise<Usuario> {
  const sessao = await auth()
  const id = (sessao?.user as any)?.id
  if (!id) throw new Error('nao autenticado')
  const u = await um<Usuario>('SELECT id, email, nome, papel, bio FROM usuarios WHERE id = $1', [id])
  if (!u) throw new Error('nao autenticado')
  return u
}
