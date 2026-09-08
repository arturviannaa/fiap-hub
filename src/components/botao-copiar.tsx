'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function BotaoCopiar({ valor, rotulo = 'copiar' }: { valor: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(valor).then(() => {
          setCopiado(true)
          setTimeout(() => setCopiado(false), 1600)
        })
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs suave transition-colors hover:bg-[var(--painel-2)] hover:text-[var(--texto)]"
      aria-label={`Copiar ${valor}`}
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? 'copiado' : rotulo}
    </button>
  )
}
