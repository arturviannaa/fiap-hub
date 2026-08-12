import { BookOpen, Files, LogOut, MessageSquare, NotebookPen } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { um } from '@/lib/db'
import { todasAulas } from '@/lib/conteudo'
import { salvarPerfil } from '@/lib/acoes'
import { Cabecalho } from '@/components/cabecalho'
import { FotoPerfil } from '@/components/foto-perfil'
import { Area, Botao, Campo } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Perfil' }

export default async function Perfil() {
  const u = await usuarioAtual()
  const total = todasAulas().length
  const s = await um<{ aulas: string; notas: string; arquivos: string; mensagens: string }>(
    `SELECT (SELECT count(*) FROM progresso WHERE usuario_id=$1)::text AS aulas,
            (SELECT count(*) FROM notas WHERE usuario_id=$1)::text AS notas,
            (SELECT count(*) FROM arquivos WHERE usuario_id=$1)::text AS arquivos,
            (SELECT count(*) FROM mensagens WHERE usuario_id=$1)::text AS mensagens`,
    [u.id],
  )

  const cartoes = [
    { Icone: BookOpen, valor: `${s?.aulas}/${total}`, rotulo: 'aulas concluídas' },
    { Icone: NotebookPen, valor: s?.notas, rotulo: 'anotações' },
    { Icone: Files, valor: s?.arquivos, rotulo: 'materiais' },
    { Icone: MessageSquare, valor: s?.mensagens, rotulo: 'mensagens' },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Meu perfil" />

      <div className="painel mb-4 flex flex-wrap items-center gap-4 p-5">
        <FotoPerfil usuarioId={u.id} nome={u.nome} foto={u.foto} />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{u.nome}</p>
          <p className="truncate text-sm suave">{u.email}</p>
        </div>
        <div className="flex-1" />
        <a
          href="/api/auth/signout"
          className="inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm hover:bg-[var(--painel-2)]"
        >
          <LogOut size={15} /> Sair
        </a>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cartoes.map(({ Icone, valor, rotulo }) => (
          <div key={rotulo} className="painel p-4">
            <Icone size={17} className="text-fiap-500" />
            <p className="mt-2 text-xl font-semibold">{valor}</p>
            <p className="text-xs suave">{rotulo}</p>
          </div>
        ))}
      </div>

      <form action={salvarPerfil} className="painel space-y-3 p-5">
        <h2 className="font-semibold">Editar dados</h2>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Nome</span>
          <Campo name="nome" defaultValue={u.nome} maxLength={80} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Bio</span>
          <Area name="bio" defaultValue={u.bio} rows={3} maxLength={280} placeholder="Uma linha sobre você para a turma" />
        </label>
        <Botao type="submit">Salvar</Botao>
      </form>
    </div>
  )
}
