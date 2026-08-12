import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { Readable } from 'node:stream'
import { auth } from '@/lib/auth'
import { sql, um } from '@/lib/db'

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads')

// Tipos servidos inline. Qualquer outra coisa desce como download, para que um
// .html ou .svg enviado por aluno nunca execute script no domínio da turma.
const INLINE = /^(image\/(png|jpeg|gif|webp|avif)|application\/pdf|text\/plain)$/

// Um arquivo é acessível se for público, seu, ou anexo de uma conversa da qual
// você participa. Toda a regra vive neste SQL — sem checagem espalhada.
const CONSULTA = `
  SELECT a.nome, a.armazenado, a.mime
  FROM arquivos a
  WHERE a.id = $1 AND (
    a.publico
    OR a.usuario_id = $2
    OR EXISTS (
      SELECT 1 FROM mensagens m
      WHERE m.arquivo_id = a.id AND (
        m.canal !~ '^g:[0-9]+$'
        OR EXISTS (
          SELECT 1 FROM grupo_membros gm
          WHERE gm.usuario_id = $2
            AND gm.grupo_id = (CASE WHEN m.canal ~ '^g:[0-9]+$'
                               THEN substring(m.canal from 3)::int END)
        )
      )
    )
  )`

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const sessao = await auth()
  const usuarioId = (sessao?.user as any)?.id
  if (!usuarioId) return new Response('não autenticado', { status: 401 })

  const id = Number((await ctx.params).id)
  if (!Number.isInteger(id) || id < 1) return new Response('inválido', { status: 400 })

  const arq = await um<{ nome: string; armazenado: string; mime: string }>(CONSULTA, [id, usuarioId])
  if (!arq) return new Response('não encontrado', { status: 404 })

  // basename: o nome no disco é gerado por nós, mas nunca confie duas vezes.
  const caminho = join(UPLOAD_DIR, basename(arq.armazenado))
  const info = await stat(caminho).catch(() => null)
  if (!info?.isFile()) return new Response('não encontrado', { status: 404 })

  await sql('UPDATE arquivos SET downloads = downloads + 1 WHERE id = $1', [id])

  const inline = INLINE.test(arq.mime)
  return new Response(Readable.toWeb(createReadStream(caminho)) as ReadableStream, {
    headers: {
      'Content-Type': inline ? arq.mime : 'application/octet-stream',
      'Content-Length': String(info.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(arq.nome)}`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
