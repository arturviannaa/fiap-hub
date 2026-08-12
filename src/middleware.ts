import { NextResponse, type NextRequest } from 'next/server'
import { ipDe, permitido } from '@/lib/limites'

const PUBLICAS = ['/entrar', '/cadastro', '/api/auth', '/api/saude', '/conteudo', '/favicon.svg']

// Teto por IP e por tipo de rota. Login e cadastro são os alvos óbvios de
// força bruta; o SSE precisa de folga porque cada aba abre uma conexão.
const LIMITES: [RegExp, number, number][] = [
  [/^\/api\/auth\/(callback|signin)/, 8, 60_000], // 8 tentativas de login por minuto
  [/^\/api\/chat\//, 20, 60_000], // conexões do chat ao vivo
  [/^\/api\//, 60, 60_000], // demais APIs (download de arquivo etc.)
  [/^\//, 240, 60_000], // navegação normal: 4 páginas por segundo sustentadas
]

// Server Action é POST na própria página: limite separado, senão o flood de
// mensagens passaria pelo teto generoso de navegação.
const LIMITE_ACAO = [40, 60_000] as const

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = ipDe(req)

  const ehAcao = req.method === 'POST' && req.headers.has('next-action')
  const regra = LIMITES.find(([re]) => re.test(pathname))
  const cap = ehAcao ? LIMITE_ACAO[0] : (regra?.[1] ?? 240)
  const janela = ehAcao ? LIMITE_ACAO[1] : (regra?.[2] ?? 60_000)
  const balde = ehAcao ? 'acao' : pathname.split('/').slice(0, 3).join('/')

  if (!permitido(`${ip}:${balde}`, cap, janela)) {
    return new NextResponse('Devagar. Tente de novo em instantes.', {
      status: 429,
      headers: { 'Retry-After': '30' },
    })
  }

  if (PUBLICAS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  // Barreira barata: sem cookie de sessão nem adianta renderizar a página.
  // A validação de verdade (assinatura do JWT + usuário no banco) continua no
  // layout e em cada server action.
  const temSessao =
    req.cookies.has('authjs.session-token') || req.cookies.has('__Secure-authjs.session-token')
  if (temSessao) return NextResponse.next()

  if (pathname.startsWith('/api/')) return new NextResponse('não autenticado', { status: 401 })

  const destino = req.nextUrl.clone()
  destino.pathname = '/entrar'
  destino.search = ''
  return NextResponse.redirect(destino)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
