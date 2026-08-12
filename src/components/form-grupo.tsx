'use client'

import { useActionState } from 'react'
import { AlertCircle, Loader2, Users } from 'lucide-react'
import { criarGrupo } from '@/lib/acoes'
import { Avatar, Botao, Campo } from './ui'

type Estado = { erro?: string } | null

async function acao(_estado: Estado, dados: FormData): Promise<Estado> {
  return (await criarGrupo(dados)) as Estado
}

export function FormGrupo({ turma }: { turma: { id: number; nome: string }[] }) {
  const [estado, enviar, pendente] = useActionState<Estado, FormData>(acao, null)

  return (
    <form action={enviar} className="painel h-fit space-y-3 p-4 lg:sticky lg:top-20">
      <h2 className="flex items-center gap-2 font-semibold">
        <Users size={17} className="text-fiap-500" /> Novo grupo
      </h2>

      {estado?.erro && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={15} /> {estado.erro}
        </p>
      )}

      <Campo name="nome" required maxLength={60} placeholder="Nome (ex.: Trabalho de Matrizes)" />
      <Campo name="descricao" maxLength={160} placeholder="Descrição (opcional)" />

      <div>
        <p className="mb-1.5 text-sm font-medium">Quem participa</p>
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2">
          {turma.length === 0 && <p className="p-2 text-sm suave">Ninguém mais cadastrado ainda.</p>}
          {turma.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-sm hover:bg-[var(--painel-2)]"
            >
              <input type="checkbox" name="membros" value={p.id} className="accent-fiap-500" />
              <Avatar nome={p.nome} tamanho={24} />
              <span className="truncate">{p.nome}</span>
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs suave">Você entra automaticamente.</p>
      </div>

      <Botao type="submit" className="w-full" disabled={pendente}>
        {pendente && <Loader2 size={15} className="animate-spin" />}
        Criar grupo
      </Botao>
    </form>
  )
}
