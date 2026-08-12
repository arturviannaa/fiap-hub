import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Conta o download e redireciona pra APK. O botão da landing aponta pra cá.
export async function GET() {
  await sql(
    `INSERT INTO contadores (chave, valor) VALUES ('downloads', 1)
     ON CONFLICT (chave) DO UPDATE SET valor = contadores.valor + 1`,
  ).catch(() => {})
  return Response.redirect('https://fiap.pervian.tech/app/FIAP-Estudante.apk', 302)
}
