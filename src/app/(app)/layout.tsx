import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { um } from '@/lib/db'
import { Shell } from '@/components/shell'
import { discAtiva } from '@/lib/disciplina'
import { disciplinas } from '@/lib/conteudo'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sessao = await auth()
  const id = (sessao?.user as any)?.id
  const usuario = id
    ? await um<{ id: number; nome: string; email: string; papeis: string[]; foto: string | null }>(
        'SELECT id, nome, email, papeis, foto FROM usuarios WHERE id = $1',
        [id],
      )
    : null
  if (!usuario) redirect('/entrar')
  const slug = await discAtiva()
  const disc = slug ? disciplinas().find((d) => d.slug === slug) ?? null : null
  return (
    <Shell usuario={usuario} disciplina={disc && { nome: disc.nome, curto: disc.curto, cor: disc.cor }}>
      {children}
    </Shell>
  )
}
