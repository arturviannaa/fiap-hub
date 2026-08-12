import type { ReactNode } from 'react'

export function Cabecalho({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm suave">{descricao}</p>}
      </div>
      {acao}
    </div>
  )
}
