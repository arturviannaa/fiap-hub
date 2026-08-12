import bcrypt from 'bcryptjs'
import { dominioPermitido } from '@/lib/auth'
import { sql, um } from '@/lib/db'
import { assinarToken } from '@/lib/mobile-auth'

// Login do app: e-mail institucional + senha → token Bearter. Mesma regra de
// domínio e mesmo hash bcrypt do login web; a conta é a mesma.
export async function POST(req: Request) {
  const { email, senha } = await req.json().catch(() => ({}))
  const e = String(email || '').trim().toLowerCase()
  if (!e || !dominioPermitido(e)) return Response.json({ erro: 'E-mail institucional inválido.' }, { status: 400 })

  const conta = await um<{ id: number; nome: string; papeis: string[]; foto: string | null; senha_hash: string | null }>(
    'SELECT id, nome, papeis, foto, senha_hash FROM usuarios WHERE email = $1',
    [e],
  )
  if (!conta?.senha_hash || !(await bcrypt.compare(String(senha || ''), conta.senha_hash)))
    return Response.json({ erro: 'E-mail ou senha incorretos.' }, { status: 401 })

  await sql('UPDATE usuarios SET visto_em = now() WHERE id = $1', [conta.id])
  return Response.json({
    token: assinarToken(conta.id),
    usuario: { id: conta.id, email: e, nome: conta.nome, papeis: conta.papeis, foto: conta.foto },
  })
}
