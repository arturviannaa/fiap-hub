import { sql } from '@/lib/db'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

type Material = {
  id: number; nome: string; descricao: string; tamanho: number; publico: boolean
  aula_slug: string | null; usuario_id: number; downloads: number; criado_em: string; autor: string
}

export async function GET(req: Request) {
  const u = await usuarioDoToken(req)
  if (!u) return naoAutorizado()
  const aba = new URL(req.url).searchParams.get('aba') === 'meus' ? 'meus' : 'turma'
  const materiais = await sql<Material>(
    aba === 'meus'
      ? `SELECT a.id,a.nome,a.descricao,a.tamanho,a.publico,a.aula_slug,a.usuario_id,a.downloads,a.criado_em, u.nome AS autor
         FROM arquivos a JOIN usuarios u ON u.id=a.usuario_id WHERE a.usuario_id=$1 AND a.descricao<>'anexo do chat' ORDER BY a.id DESC`
      : `SELECT a.id,a.nome,a.descricao,a.tamanho,a.publico,a.aula_slug,a.usuario_id,a.downloads,a.criado_em, u.nome AS autor
         FROM arquivos a JOIN usuarios u ON u.id=a.usuario_id WHERE a.publico AND a.descricao<>'anexo do chat' ORDER BY a.id DESC`,
    aba === 'meus' ? [u.id] : [],
  )
  return Response.json({ materiais, euId: u.id })
}
