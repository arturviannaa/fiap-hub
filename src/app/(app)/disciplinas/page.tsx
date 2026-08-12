import { ArrowRight } from 'lucide-react'
import { disciplinas } from '@/lib/conteudo'
import { escolherDisciplina } from '@/lib/acoes'
import { discAtiva } from '@/lib/disciplina'
import { IconeModulo } from '@/components/icone-modulo'
import { Selo } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Disciplinas' }

export default async function Disciplinas() {
  const lista = disciplinas()
  const atual = await discAtiva()

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Escolha a disciplina</h1>
        <p className="mt-1 text-sm suave">
          Aulas, chat, materiais e anotações são de cada disciplina. Seu perfil, tags, grupos e conquistas
          seguem com você em todas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {lista.map((d) => (
          <form key={d.slug} action={escolherDisciplina.bind(null, d.slug)}>
            <button
              className="painel group flex w-full flex-col gap-3 p-5 text-left transition-colors hover:border-fiap-500/50"
              style={{ borderColor: atual === d.slug ? d.cor : undefined }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-12 w-12 place-items-center rounded-2xl text-white"
                  style={{ background: d.cor }}
                >
                  <IconeModulo nome={d.icone} size={24} />
                </span>
                {atual === d.slug && <Selo tom="verde">atual</Selo>}
              </div>
              <div>
                <p className="font-semibold">{d.nome}</p>
                <p className="mt-0.5 text-sm suave">Prof. {d.professor}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <span className="text-xs suave">{d.totalAulas} aulas</span>
                <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: d.cor }}>
                  Entrar <ArrowRight size={15} />
                </span>
              </div>
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
