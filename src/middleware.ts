import { NextResponse, type NextRequest } from 'next/server'

// Barreira barata: sem cookie de sessao nem adianta renderizar a pagina.
// A validacao de verdade (assinatura do JWT + usuario no banco) continua no
// layout e em cada server action — isto aqui so evita render inutil e o
// "erro: nao autenticado" que o Next logava ao rodar layout e page em paralelo.
const PUBLICAS = ['/entrar', '/cadastro', '/api/auth', '/api/saude', '/conteudo', '/favicon.svg']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLICAS.some((p) => pathname.startsWith(p))) return NextResponse.next()

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
