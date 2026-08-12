import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { um } from '@/lib/db'
import { Shell } from '@/components/shell'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sessao = await auth()
  const id = (sessao?.user as any)?.id
  const usuario = id
    ? await um<{ id: number; nome: string; email: string; papel: string; foto: string | null }>(
        'SELECT id, nome, email, papel, foto FROM usuarios WHERE id = $1',
        [id],
      )
    : null
  if (!usuario) redirect('/entrar')
  return <Shell usuario={usuario}>{children}</Shell>
}
