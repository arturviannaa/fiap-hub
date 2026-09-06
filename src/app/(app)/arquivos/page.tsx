import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { acharAula, todasAulas } from '@/lib/conteudo'
import { discAtiva } from '@/lib/disciplina'
import { redirect } from 'next/navigation'
import { Cabecalho } from '@/components/cabecalho'
import { FormUpload } from '@/components/form-upload'
import { ListaMateriais, type ArquivoLinha } from '@/components/lista-materiais'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Materiais' }

type Linha = Omit<ArquivoLinha, 'aulaTitulo'> & { aula_slug: string | null }

export default async function Arquivos({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const aba = (await searchParams).aba === 'meus' ? 'meus' : 'turma'

  const arquivos = await sql<Linha>(
    aba === 'meus'
      ? `SELECT a.id, a.nome, a.descricao, a.tamanho, a.publico, a.usuario_id, a.downloads, a.criado_em, a.aula_slug,
                u.nome AS autor, u.foto AS usuario_foto
         FROM arquivos a JOIN usuarios u ON u.id = a.usuario_id
         WHERE a.usuario_id = $1 AND a.disciplina = $2 AND a.descricao <> 'anexo do chat' ORDER BY a.id DESC`
      : `SELECT a.id, a.nome, a.descricao, a.tamanho, a.publico, a.usuario_id, a.downloads, a.criado_em, a.aula_slug,
                u.nome AS autor, u.foto AS usuario_foto
         FROM arquivos a JOIN usuarios u ON u.id = a.usuario_id
         WHERE a.publico AND a.disciplina = $1 AND a.descricao <> 'anexo do chat' ORDER BY a.id DESC`,
    aba === 'meus' ? [u.id, disc] : [disc],
  )

  const arquivosComAula: ArquivoLinha[] = arquivos.map((a) => ({
    ...a,
    aulaTitulo: a.aula_slug ? (acharAula(a.aula_slug)?.titulo ?? null) : null,
  }))

  return (
    <div className="mx-auto max-w-6xl">
      <Cabecalho
        titulo="Materiais"
        descricao="Resumos, listas resolvidas, PDFs e scripts. Público vai para a turma; privado fica só com você."
      />

      <div className="mb-5">
        <FormUpload dropzone aulas={todasAulas(disc).map((a) => ({ slug: a.slug, titulo: a.titulo }))} />
      </div>

      <ListaMateriais arquivos={arquivosComAula} aba={aba} meuId={u.id} />
    </div>
  )
}
