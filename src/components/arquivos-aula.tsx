import { Download, Globe, Lock, Paperclip, Trash2 } from 'lucide-react'
import { apagarArquivo } from '@/lib/acoes'
import { FormUpload } from './form-upload'
import { Selo, quando, tamanhoLegivel } from './ui'

type Arquivo = {
  id: number
  nome: string
  tamanho: number
  publico: boolean
  usuario_id: number
  criado_em: string
  autor: string
}

export function ArquivosDaAula({
  aula,
  arquivos,
  usuarioId,
}: {
  aula: string
  arquivos: Arquivo[]
  usuarioId: number
}) {
  return (
    <section className="painel p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <Paperclip size={17} className="text-fiap-500" /> Materiais desta aula
      </h2>
      <p className="mb-4 text-xs suave">Resumos, exercícios resolvidos, .py, PDF… até 25 MB.</p>

      <FormUpload aula={aula} compacto />

      <ul className="mt-5 space-y-2">
        {arquivos.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-xl border p-3">
            <div className="min-w-0 flex-1">
              <a href={`/api/arquivos/${a.id}`} className="block truncate text-sm font-medium hover:text-fiap-500">
                {a.nome}
              </a>
              <p className="flex items-center gap-2 text-xs suave">
                {tamanhoLegivel(a.tamanho)} · {a.usuario_id === usuarioId ? 'você' : a.autor.split(' ')[0]} ·{' '}
                {quando(a.criado_em)}
                {a.publico ? (
                  <Selo tom="fiap">
                    <Globe size={10} /> pública
                  </Selo>
                ) : (
                  <Selo>
                    <Lock size={10} /> privado
                  </Selo>
                )}
              </p>
            </div>
            <a href={`/api/arquivos/${a.id}`} className="suave hover:text-fiap-500" aria-label="Baixar">
              <Download size={16} />
            </a>
            {a.usuario_id === usuarioId && (
              <form action={apagarArquivo.bind(null, a.id)}>
                <button className="suave hover:text-red-500" aria-label="Apagar arquivo">
                  <Trash2 size={15} />
                </button>
              </form>
            )}
          </li>
        ))}
        {arquivos.length === 0 && <li className="text-sm suave">Nenhum material enviado nesta aula.</li>}
      </ul>
    </section>
  )
}
