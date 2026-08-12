import { NextResponse, type NextRequest } from 'next/server'
import { ipDe, permitido } from '@/lib/limites'

// /api/mobile valida por Bearer token na própria rota, não por cookie.
const PUBLICAS = ['/entrar', '/cadastro', '/api/auth', '/api/mobile', '/api/app', '/api/saude', '/conteudo', '/favicon.svg', '/manifest', '/icon']

// Teto por IP. IMPORTANTE: a turma toda pode estar atrás de um único NAT (WiFi
// da faculdade) — todos com o mesmo IP público. Então os limites por IP são um
// freio grosso contra flood anônimo, generosos o bastante para uma sala inteira.
// O abuso autenticado (spam, travazap) é barrado pelos limites POR USUÁRIO
// (cooldown do chat, cota de notas/uploads), que são imunes ao NAT.
const LIMITES: [RegExp, number, number][] = [
  [/^\/api\/auth\/(callback|signin)/, 40, 60_000], // força bruta de login: ~1 sala tentando junto
  [/^\/api\/chat\//, 200, 60_000], // SSE: 1 conexão por aba, sala inteira reconectando
  [/^\/api\//, 600, 60_000], // downloads e demais APIs
  [/^\//, 1200, 60_000], // navegação: 40 pessoas × 30 req/min
]

// Server Action é POST na própria página: limite por IP separado e alto (o
// cooldown por usuário é quem segura o flood). Só barra um script disparando.
const LIMITE_ACAO = [400, 60_000] as const

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
