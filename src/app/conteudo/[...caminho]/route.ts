import { readFile } from 'node:fs/promises'
import { join, normalize } from 'node:path'

const DIR = process.env.CONTENT_DIR || join(process.cwd(), 'content')

const TIPOS: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
}

// As imagens geradas dos notebooks vivem no volume de conteudo (reescrito pelo
// sync), nao em /public — entao precisam de uma rota para sair.
export async function GET(_req: Request, ctx: { params: Promise<{ caminho: string[] }> }) {
  const partes = (await ctx.params).caminho
  const relativo = normalize(partes.join('/'))
  if (relativo.startsWith('..') || relativo.includes('\0')) return new Response('inválido', { status: 400 })

  const ext = relativo.slice(relativo.lastIndexOf('.')).toLowerCase()
  const tipo = TIPOS[ext]
  if (!tipo) return new Response('não encontrado', { status: 404 })

  const dados = await readFile(join(DIR, relativo)).catch(() => null)
  if (!dados) return new Response('não encontrado', { status: 404 })

  return new Response(new Uint8Array(dados), {
    headers: { 'Content-Type': tipo, 'Cache-Control': 'public, max-age=86400' },
  })
}
