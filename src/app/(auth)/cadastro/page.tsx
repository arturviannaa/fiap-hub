import { redirect } from 'next/navigation'
import { auth, dominiosTexto } from '@/lib/auth'
import { FormCadastro } from '@/components/form-auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Criar conta' }

export default async function Cadastro() {
  if ((await auth())?.user) redirect('/')
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mb-6 mt-1 text-sm suave">
        Só entra quem tem e-mail {dominiosTexto} e o código combinado no grupo da turma.
      </p>

      <FormCadastro />
    </div>
  )
}
