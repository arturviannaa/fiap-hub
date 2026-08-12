import { redirect } from 'next/navigation'
import { auth, dominiosTexto, microsoftAtivo } from '@/lib/auth'
import { FormCadastro } from '@/components/form-auth'
import { BotaoMicrosoft } from '@/components/botao-microsoft'

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

      {microsoftAtivo && (
        <>
          <BotaoMicrosoft />
          <div className="my-5 flex items-center gap-3 text-xs suave">
            <div className="h-px flex-1 bg-[var(--borda)]" />
            ou com senha
            <div className="h-px flex-1 bg-[var(--borda)]" />
          </div>
        </>
      )}

      <FormCadastro />
    </div>
  )
}
