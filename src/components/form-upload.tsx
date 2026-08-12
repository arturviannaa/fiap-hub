'use client'

import { useActionState } from 'react'
import { AlertCircle, Loader2, Upload } from 'lucide-react'
import { enviarArquivo } from '@/lib/acoes'
import { Botao, Campo } from './ui'

type Estado = { erro?: string; ok?: boolean } | null

async function acao(_estado: Estado, dados: FormData): Promise<Estado> {
  return (await enviarArquivo(dados)) as Estado
}

export function FormUpload({
  aula,
  aulas,
  compacto,
}: {
  aula?: string
  aulas?: { slug: string; titulo: string }[]
  compacto?: boolean
}) {
  const [estado, enviar, pendente] = useActionState<Estado, FormData>(acao, null)

  return (
    <form action={enviar} className="space-y-2" key={estado?.ok ? 'limpo' : 'form'}>
      {aula && <input type="hidden" name="aula" value={aula} />}

      {estado?.erro && (
        <p className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={15} /> {estado.erro}
        </p>
      )}
      {estado?.ok && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-sm text-emerald-600 dark:text-emerald-400">
          Arquivo enviado.
        </p>
      )}

      <input
        type="file"
        name="arquivo"
        required
        className="w-full cursor-pointer rounded-xl border p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-fiap-500 file:px-3 file:py-1.5 file:text-white"
      />
      <Campo name="descricao" placeholder="Descrição (opcional)" />

      {aulas && (
        <select
          name="aula"
          defaultValue=""
          className="h-10 w-full rounded-xl border bg-[var(--painel)] px-3 text-sm focus:border-fiap-500 focus:outline-none"
        >
          <option value="">Sem aula específica</option>
          {aulas.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.titulo}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm suave">
          <input type="checkbox" name="publico" value="privado" className="accent-fiap-500" />
          Manter privado
        </label>
        <div className="flex-1" />
        <Botao
          type="submit"
          tamanho={compacto ? 'sm' : 'md'}
          variante={compacto ? 'neutro' : 'primario'}
          className={compacto ? '' : 'w-full'}
          disabled={pendente}
        >
          {pendente ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {pendente ? 'Enviando…' : 'Enviar (até 25 MB)'}
        </Botao>
      </div>
    </form>
  )
}
