import { createHmac, timingSafeEqual } from 'node:crypto'
import { um } from './db'
import type { Usuario } from './auth'

// Token para o app nativo. O app não usa cookie/CSRF do Auth.js — manda
// `Authorization: Bearer <token>`. Token = base64url(payload).base64url(hmac),
// assinado com o AUTH_SECRET (o mesmo segredo do resto da auth). Sem dependência
// nova: HMAC-SHA256 do node basta.
const SEGREDO = process.env.AUTH_SECRET || 'dev-inseguro'
const VALIDADE_MS = 1000 * 60 * 60 * 24 * 60 // 60 dias

const b64url = (b: Buffer) => b.toString('base64url')

export function assinarToken(usuarioId: number) {
  const payload = b64url(Buffer.from(JSON.stringify({ uid: usuarioId, exp: Date.now() + VALIDADE_MS })))
  const assinatura = b64url(createHmac('sha256', SEGREDO).update(payload).digest())
  return `${payload}.${assinatura}`
}

function payloadValido(token: string): { uid: number; exp: number } | null {
  const [payload, assinatura] = token.split('.')
  if (!payload || !assinatura) return null
  const esperada = b64url(createHmac('sha256', SEGREDO).update(payload).digest())
  const a = Buffer.from(assinatura)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const dados = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof dados.uid !== 'number' || typeof dados.exp !== 'number') return null
    if (Date.now() > dados.exp) return null
    return dados
  } catch {
    return null
  }
}

// Lê o Bearer, valida, e devolve o usuário — ou null. Usado por toda rota /api/mobile.
export async function usuarioDoToken(req: Request): Promise<Usuario | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  const p = payloadValido(token)
  if (!p) return null
  return um<Usuario>('SELECT id, email, nome, papeis, bio, foto FROM usuarios WHERE id = $1', [p.uid])
}

export function naoAutorizado() {
  return Response.json({ erro: 'não autenticado' }, { status: 401 })
}
