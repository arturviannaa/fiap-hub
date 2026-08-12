'use client'

import { useTransition, useOptimistic } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { alternarProgresso } from '@/lib/acoes'

export function MarcarAula({ slug, concluida }: { slug: string; concluida: boolean }) {
  const [pendente, iniciar] = useTransition()
  const [otimista, setOtimista] = useOptimistic(concluida)

  return (
    <button
      onClick={() =>
        iniciar(async () => {
          setOtimista(!otimista)
          await alternarProgresso(slug, !otimista)
        })
      }
      disabled={pendente}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors ${
        otimista
          ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
          : 'bg-fiap-500 text-white hover:bg-fiap-600'
      }`}
    >
      {pendente ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      {otimista ? 'Aula concluída' : 'Marcar como concluída'}
    </button>
  )
}
