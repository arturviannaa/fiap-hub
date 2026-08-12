'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Pencil } from 'lucide-react'
import { alternarPapel, renomearUsuario } from '@/lib/acoes'

// Tags que o admin pode ligar/desligar. 'aluno' também sai (professor não é aluno).
const TAGS: { valor: string; rotulo: string }[] = [
  { valor: 'aluno', rotulo: 'aluno' },
  { valor: 'professor', rotulo: 'professor' },
  { valor: 'admin', rotulo: 'admin' },
]

/** Controles de moderação da Turma: só renderizado para admin. */
export function EditorPapel({
  usuarioId,
  papeis,
  nome,
  ehVoce,
}: {
  usuarioId: number
  papeis: string[]
  nome: string
  ehVoce: boolean
}) {
  const [pendente, iniciar] = useTransition()
  const [local, setLocal] = useState(papeis)

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs suave">tags:</span>
      {TAGS.map((t) => {
        const ativo = local.includes(t.valor)
        // admin não pode remover o próprio admin (evita se trancar pra fora)
        const travado = ehVoce && t.valor === 'admin' && ativo
        return (
          <button
            key={t.valor}
            disabled={pendente || travado}
            onClick={() =>
              iniciar(async () => {
                setLocal((atual) =>
                  ativo ? atual.filter((p) => p !== t.valor) : [...atual, t.valor],
                )
                await alternarPapel(usuarioId, t.valor)
              })
            }
            title={travado ? 'Você não pode remover o próprio admin' : `Alternar ${t.rotulo}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
              ativo
                ? 'border-fiap-500 bg-fiap-500/12 text-fiap-600 dark:text-fiap-400'
                : 'suave hover:bg-[var(--painel-2)]'
            }`}
          >
            {ativo && <Check size={11} />}
            {t.rotulo}
          </button>
        )
      })}
      {pendente && <Loader2 size={12} className="animate-spin suave" />}

      <form
        action={renomearUsuario.bind(null, usuarioId)}
        className="ml-1 flex items-center gap-1"
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
