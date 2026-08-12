'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { cadastrar, entrar, type EstadoForm } from '@/lib/acoes-auth'
import { Botao, Campo } from './ui'

function Erro({ texto }: { texto?: string }) {
  if (!texto) return null
  return (
    <p className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      {texto}
    </p>
  )
}

export function FormEntrar({ erroInicial }: { erroInicial?: string }) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(entrar, null)
  return (
    <form action={acao} className="space-y-3">
      <Erro texto={estado?.erro || erroInicial} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">E-mail institucional</span>
        <Campo name="email" type="email" required autoComplete="email" placeholder="nome@fiap.com.br" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Senha</span>
        <Campo name="senha" type="password" required autoComplete="current-password" placeholder="••••••••" />
      </label>
      <Botao type="submit" tamanho="lg" className="w-full" disabled={pendente}>
        {pendente && <Loader2 size={16} className="animate-spin" />}
        Entrar
      </Botao>
      <p className="text-center text-sm suave">
        Primeira vez?{' '}
        <Link href="/cadastro" className="font-medium text-fiap-500 hover:underline">
          Criar conta com o código da turma
        </Link>
      </p>
    </form>
  )
}

export function FormCadastro() {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(cadastrar, null)
  return (
    <form action={acao} className="space-y-3">
      <Erro texto={estado?.erro} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome completo</span>
        <Campo name="nome" required autoComplete="name" placeholder="Como a turma te chama" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">E-mail institucional</span>
        <Campo name="email" type="email" required autoComplete="email" placeholder="nome@fiap.com.br" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Senha</span>
        <Campo name="senha" type="password" required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Código da turma</span>
        <Campo name="convite" required placeholder="Combinado no grupo da turma" />
      </label>
      <Botao type="submit" tamanho="lg" className="w-full" disabled={pendente}>
        {pendente && <Loader2 size={16} className="animate-spin" />}
        Criar conta
      </Botao>
      <p className="text-center text-sm suave">
        Já tem conta?{' '}
        <Link href="/entrar" className="font-medium text-fiap-500 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  )
}
