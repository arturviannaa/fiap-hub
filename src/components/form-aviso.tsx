'use client'

import { useActionState } from 'react'
import { AlertCircle, Check, Loader2, Megaphone } from 'lucide-react'
import { enviarAviso } from '@/lib/acoes'
import { Area, Botao, Campo } from './ui'

type Estado = { erro?: string; ok?: boolean } | null

async function acao(_e: Estado, dados: FormData): Promise<Estado> {
  return (await enviarAviso(dados)) as Estado
}

// Só admin vê (a página checa). Manda push pra turma inteira.
export function FormAviso() {
  const [estado, enviar, pendente] = useActionState<Estado, FormData>(acao, null)
  return (
    <form action={enviar} className="painel space-y-2 p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <Megaphone size={17} className="text-fiap-500" /> Enviar aviso pra turma
      </h2>
      <p className="text-xs suave">Chega como notificação push no app de todo mundo.</p>
      {estado?.erro && (
        <p className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} /> {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Check size={14} /> Aviso enviado!
        </p>
      )}
      <Campo name="titulo" required maxLength={80} placeholder="Título (ex.: Prova adiada)" />
      <Area name="corpo" rows={2} maxLength={200} placeholder="Mensagem (opcional)" />
      <Botao type="submit" disabled={pendente} className="w-full">
        {pendente ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
        Enviar aviso
      </Botao>
    </form>
  )
}
