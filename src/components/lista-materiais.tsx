'use client'

import { useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { apagarArquivo } from '@/lib/acoes'
import { Avatar, Segmentado, categoriaArquivo, quando, tamanhoLegivel, tipoArquivo } from './ui'

export type ArquivoLinha = {
  id: number
  nome: string
  descricao: string
  tamanho: number | string
  publico: boolean
  usuario_id: number
  usuario_foto: string | null
  downloads: number
  criado_em: string
  autor: string
  aulaTitulo: string | null
}

const CHIPS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'pdf', rotulo: 'PDF' },
  { valor: 'py', rotulo: 'Script .py' },
  { valor: 'planilha', rotulo: 'Planilha' },
  { valor: 'imagem', rotulo: 'Imagem' },
] as const

export function ListaMateriais({
  arquivos,
  aba,
  meuId,
}: {
  arquivos: ArquivoLinha[]
  aba: 'turma' | 'meus'
  meuId: number
}) {
  const [chip, setChip] = useState<(typeof CHIPS)[number]['valor']>('todos')

  const filtrados = chip === 'todos' ? arquivos : arquivos.filter((a) => categoriaArquivo(a.nome) === chip)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.valor}
              onClick={() => setChip(c.valor)}
              className={`rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                chip === c.valor
                  ? 'border-transparent bg-gradient-to-br from-fiap-400 to-fiap-500 text-white shadow-md shadow-fiap-500/30'
                  : 'border-[var(--borda)] bg-[var(--painel-2)] suave hover:text-[var(--texto)]'
              }`}
            >
              {c.rotulo}
            </button>
          ))}
        </div>
        <Segmentado
          itens={[
            { href: '/arquivos?aba=turma', rotulo: 'Da turma', ativo: aba === 'turma' },
            { href: '/arquivos?aba=meus', rotulo: 'Meus arquivos', ativo: aba === 'meus' },
          ]}
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="painel px-6 py-14 text-center text-sm suave">Nenhum material nessa categoria.</p>
      ) : (
        <div className="painel overflow-hidden p-1.5">
          <div className="hidden grid-cols-[1fr_150px_90px_150px_72px] gap-3 px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wide suave sm:grid">
            <span>Arquivo</span>
            <span>Aula</span>
            <span>Tamanho</span>
            <span>Enviado por</span>
            <span />
          </div>
          {filtrados.map((a) => {
            const tipo = tipoArquivo(a.nome)
            return (
              <div
                key={a.id}
                className="grid grid-cols-1 gap-3 border-t border-[var(--borda)] px-3.5 py-3 first:border-t-0 sm:grid-cols-[1fr_150px_90px_150px_72px] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border text-[9px] font-extrabold"
                    style={{ background: `${tipo.cor}1a`, borderColor: `${tipo.cor}30`, color: tipo.cor }}
                  >
                    {tipo.rotulo}
                  </span>
                  <div className="min-w-0">
                    <a href={`/api/arquivos/${a.id}`} className="block truncate text-sm font-semibold hover:text-fiap-500">
                      {a.nome}
                    </a>
                    <p className="truncate text-xs suave">
                      {a.descricao || `enviado ${quando(a.criado_em)}`}
                    </p>
                  </div>
                </div>
                <span className="truncate text-xs suave sm:text-sm">{a.aulaTitulo ?? '—'}</span>
                <span className="text-sm suave">{tamanhoLegivel(a.tamanho)}</span>
                <div className="flex items-center gap-2">
                  <Avatar nome={a.autor} tamanho={24} usuarioId={a.usuario_id} foto={a.usuario_foto} />
                  <span className="truncate text-sm">{a.usuario_id === meuId ? 'você' : a.autor.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-1 justify-self-start sm:justify-self-end">
                  <a
                    href={`/api/arquivos/${a.id}`}
                    className="grid h-8 w-8 place-items-center rounded-lg suave hover:bg-[var(--painel-2)] hover:text-fiap-500"
                    aria-label="Baixar"
                  >
                    <Download size={15} />
                  </a>
                  {a.usuario_id === meuId && (
                    <button
                      onClick={() => apagarArquivo(a.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg suave hover:bg-[var(--painel-2)] hover:text-red-500"
                      aria-label="Apagar arquivo"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
