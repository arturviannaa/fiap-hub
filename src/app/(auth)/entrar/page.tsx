import { redirect } from 'next/navigation'
import { auth, dominiosTexto } from '@/lib/auth'
import { FormEntrar } from '@/components/form-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Entrar' }

const MENSAGENS: Record<string, string> = {
  dominio: `Essa conta não é institucional. Entre com seu e-mail ${dominiosTexto}.`,
  CredentialsSignin: 'E-mail ou senha incorretos.',
  AccessDenied: 'Acesso negado para essa conta.',
}

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; error?: string }>
}) {
  if ((await auth())?.user) redirect('/')
  const p = await searchParams
  const codigo = p.erro || p.error
  const erro = codigo ? MENSAGENS[codigo] || 'Não foi possível entrar.' : undefined

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 lg:hidden">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-fiap-500 text-lg font-bold text-white">
          F
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Entrar na plataforma</h1>
      <p className="mb-6 mt-1 text-sm suave">Acesso restrito à turma, com e-mail {dominiosTexto}.</p>

      <FormEntrar erroInicial={erro} />
    </div>
  )
}
