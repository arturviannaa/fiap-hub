'use client'

import { useActionState, useRef, useState } from 'react'
import { AlertCircle, ArrowUp, Loader2, Upload } from 'lucide-react'
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
  dropzone,
}: {
  aula?: string
  aulas?: { slug: string; titulo: string }[]
  compacto?: boolean
  dropzone?: boolean
}) {
  const [estado, enviar, pendente] = useActionState<Estado, FormData>(acao, null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const inputArquivo = useRef<HTMLInputElement>(null)

  if (!dropzone)
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
          <Botao type="submit" tamanho="sm" variante="neutro" disabled={pendente}>
            {pendente ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {pendente ? 'Enviando…' : 'Enviar (até 25 MB)'}
          </Botao>
        </div>
      </form>
    )

  return (
    <form
      action={enviar}
      key={estado?.ok ? 'limpo' : 'form'}
      className="flex flex-col gap-3"
      onSubmit={() => setArquivo(null)}
    >
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

      <div
        onClick={() => inputArquivo.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setArrastando(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setArrastando(false)
          const f = e.dataTransfer.files?.[0]
          if (f) setArquivo(f)
        }}
        className="painel flex cursor-pointer items-center gap-4 p-5 transition-colors"
        style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: arrastando ? '#ed145b' : 'rgba(229,17,95,.35)' }}
      >
        <input
          ref={inputArquivo}
          type="file"
          name="arquivo"
          required
          className="hidden"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
        />
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-fiap-500/20 bg-fiap-500/12 text-fiap-500">
          <ArrowUp size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <b className="text-[15px]">
            {arquivo ? arquivo.name : 'Arraste arquivos aqui ou clique para enviar'}
          </b>
          <p className="mt-0.5 text-sm suave">
            {arquivo ? `pronto para enviar` : 'PDF, txt, csv, xlsx, py — até 25 MB por arquivo'}
          </p>
        </div>
        <label
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 text-sm suave"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" name="publico" value="privado" className="accent-fiap-500" />
          Manter privado
        </label>
        <Botao
          type="button"
          tamanho="sm"
          onClick={(e) => {
            e.stopPropagation()
            inputArquivo.current?.click()
          }}
        >
          Selecionar arquivo
        </Botao>
      </div>

      {arquivo && (
        <div className="flex flex-wrap items-center gap-3">
          <Campo name="descricao" placeholder="Descrição (opcional)" className="max-w-xs" />
          {aulas && (
            <select
              name="aula"
              defaultValue=""
              className="h-10 rounded-xl border bg-[var(--painel)] px-3 text-sm focus:border-fiap-500 focus:outline-none"
            >
              <option value="">Sem aula específica</option>
              {aulas.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.titulo}
                </option>
              ))}
            </select>
          )}
          <div className="flex-1" />
          <Botao type="submit" disabled={pendente}>
            {pendente ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {pendente ? 'Enviando…' : 'Enviar arquivo'}
          </Botao>
        </div>
      )}
    </form>
  )
}
