import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// O app manda o stack do próprio crash pra cá (não há Play Console num app
// sideloaded). Sai no log do container: docker compose logs app | grep crash-app
export async function POST(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const { tipo, versao, aparelho, stack } = await req.json().catch(() => ({}))
  console.error(
    `[crash-app] ${tipo} u=${u.id} v=${versao} ${aparelho}\n${String(stack || '').slice(0, 8000)}`,
  )
  return new Response(null, { status: 204 })
}
