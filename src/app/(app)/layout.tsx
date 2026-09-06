import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { um } from '@/lib/db'
import { Shell } from '@/components/shell'
import { discAtiva } from '@/lib/disciplina'
import { conteudo, disciplinas } from '@/lib/conteudo'
import { canaisDaDisciplina, gruposDoUsuario } from '@/lib/chat'

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
  const lista = disciplinas()
  const disc = slug ? lista.find((d) => d.slug === slug) ?? null : null
  const modulos = disc
    ? conteudo(disc.slug).modulos.map((m) => ({
        slug: m.slug,
        titulo: m.titulo,
        icone: m.icone,
        aulas: m.aulas.map((a) => ({ slug: a.slug, titulo: a.titulo })),
      }))
    : []
  const grupos = (await gruposDoUsuario(usuario.id)).map((g) => ({ id: g.id, nome: g.nome }))
  return (
    <Shell
      usuario={usuario}
      disciplina={disc}
      disciplinas={lista}
      modulos={modulos}
      canais={disc ? canaisDaDisciplina(disc.slug) : []}
      grupos={grupos}
    >
      {children}
    </Shell>
  )
}
