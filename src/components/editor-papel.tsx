'use client'

import { useTransition } from 'react'
import { Check, Loader2, Pencil } from 'lucide-react'
import { definirPapel, renomearUsuario } from '@/lib/acoes'
import { PAPEIS } from '@/lib/papeis'

/** Controles de moderação: só renderizado para admin. */
export function EditorPapel({
  usuarioId,
  papel,
  nome,
  ehVoce,
}: {
  usuarioId: number
  papel: string
  nome: string
  ehVoce: boolean
}) {
  const [pendente, iniciar] = useTransition()

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs suave">
        tag:
        <select
          defaultValue={papel}
          disabled={pendente || (ehVoce && papel === 'admin')}
          onChange={(e) => {
            const novo = e.target.value
            iniciar(() => definirPapel(usuarioId, novo))
          }}
          className="h-7 rounded-lg border bg-[var(--painel)] px-1.5 text-xs disabled:opacity-50"
          title={ehVoce ? 'Você não pode remover o próprio admin' : `Definir tag de ${nome}`}
        >
          {PAPEIS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {pendente && <Loader2 size={12} className="animate-spin" />}
      </label>

      <form
        action={renomearUsuario.bind(null, usuarioId)}
        className="flex items-center gap-1"
        title="Corrigir nome exibido"
      >
        <Pencil size={12} className="suave" />
        <input
          name="nome"
          defaultValue={nome}
          maxLength={60}
          className="h-7 w-40 rounded-lg border bg-[var(--painel)] px-2 text-xs"
        />
        <button className="grid h-7 w-7 place-items-center rounded-lg border hover:bg-[var(--painel-2)]">
          <Check size={12} />
        </button>
      </form>
    </div>
  )
}
