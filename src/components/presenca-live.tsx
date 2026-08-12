'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { quando } from './ui'

// Um único EventSource por página alimenta todos os indicadores. O provider
// mantém o conjunto de ids online; cada StatusPresenca só consome.
const Ctx = createContext<Set<number>>(new Set())

export function PresencaProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState<Set<number>>(new Set())

  useEffect(() => {
    const es = new EventSource('/api/presenca/stream')
    es.onmessage = (e) => {
      try {
        const { online } = JSON.parse(e.data)
        setOnline(new Set(online))
      } catch {}
    }
    return () => es.close()
  }, [])

  return <Ctx.Provider value={online}>{children}</Ctx.Provider>
}

// Ponto + texto que vira "ativo agora" (verde) no instante em que o stream
// diz que a pessoa está online, sem recarregar a página.
export function StatusPresenca({
  usuarioId,
  vistoEm,
  eu,
}: {
  usuarioId: number
  vistoEm: string
  eu?: boolean
}) {
  const online = useContext(Ctx)
  // Você aparece online de imediato (não espera o primeiro push do stream).
  const ativo = eu || online.has(usuarioId)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${ativo ? 'bg-emerald-500' : 'bg-[var(--borda)]'}`} />
      {ativo ? 'ativo agora' : `ativo ${quando(vistoEm)} atrás`}
    </span>
  )
}
