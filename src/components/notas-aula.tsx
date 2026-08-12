import { Globe, Lock, NotebookPen, Trash2 } from 'lucide-react'
import { apagarNota, salvarNota } from '@/lib/acoes'
import { Area, Avatar, Botao, Selo, quando } from './ui'

type Nota = {
  id: number
  titulo: string
  corpo: string
  publica: boolean
  usuario_id: number
  atualizado_em: string
  autor: string
  autor_foto: string | null
}

export function NotasDaAula({
  aula,
  notas,
  usuarioId,
}: {
  aula: string
  notas: Nota[]
  usuarioId: number
}) {
  return (
    <section className="painel p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold">
        <NotebookPen size={17} className="text-fiap-500" /> Anotações
      </h2>
      <p className="mb-4 text-xs suave">
        Privada fica só com você. Pública aparece para toda a turma nesta aula.
      </p>

      <form action={salvarNota} className="space-y-2">
        <input type="hidden" name="aula" value={aula} />
        <Area name="corpo" rows={3} placeholder="O que você não quer esquecer desta aula?" required />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm suave">
            <input type="checkbox" name="publica" className="accent-fiap-500" />
            Compartilhar com a turma
          </label>
          <div className="flex-1" />
          <Botao type="submit" tamanho="sm">
            Salvar
          </Botao>
        </div>
      </form>

      <ul className="mt-5 space-y-3">
        {notas.map((n) => (
          <li key={n.id} className="rounded-xl border p-3">
            <div className="mb-1 flex items-center gap-2 text-xs suave">
              <Avatar nome={n.autor} tamanho={20} usuarioId={n.usuario_id} foto={n.autor_foto} />
              <span>{n.usuario_id === usuarioId ? 'você' : n.autor.split(' ')[0]}</span>
              <span>·</span>
              <span>{quando(n.atualizado_em)}</span>
              {n.publica ? (
                <Selo tom="fiap">
                  <Globe size={10} /> pública
                </Selo>
              ) : (
                <Selo>
                  <Lock size={10} /> privada
                </Selo>
              )}
              <div className="flex-1" />
              {n.usuario_id === usuarioId && (
                <form action={apagarNota.bind(null, n.id)}>
                  <button className="suave hover:text-red-500" aria-label="Apagar anotação">
                    <Trash2 size={14} />
                  </button>
                </form>
              )}
            </div>
            {n.titulo && <p className="text-sm font-medium">{n.titulo}</p>}
            <p className="whitespace-pre-wrap text-sm">{n.corpo}</p>
          </li>
        ))}
        {notas.length === 0 && <li className="text-sm suave">Nenhuma anotação nesta aula ainda.</li>}
      </ul>
    </section>
  )
}
