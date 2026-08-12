'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function BlocoCodigo({ html, codigo, indice }: { html: string; codigo: string; indice: number }) {
  const [copiado, setCopiado] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-[var(--codigo-fundo)]">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="font-mono text-[11px] text-white/40">In [{indice}]</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(codigo).then(() => {
              setCopiado(true)
              setTimeout(() => setCopiado(false), 1600)
            })
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copiado ? <Check size={13} /> : <Copy size={13} />}
          {copiado ? 'copiado' : 'copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-[#e6e8f0]" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
