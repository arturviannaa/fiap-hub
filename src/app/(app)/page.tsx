import Link from 'next/link'
import { ArrowRight, Files, MessageSquare, NotebookPen, Sparkles } from 'lucide-react'
import { usuarioAtual } from '@/lib/auth'
import { sql } from '@/lib/db'
import { conteudo, ehNova, todasAulas } from '@/lib/conteudo'
import { discAtiva } from '@/lib/disciplina'
import { redirect } from 'next/navigation'
import { Avatar, BotaoLink, Selo, quando } from '@/components/ui'
import { IconeModulo } from '@/components/icone-modulo'

export const dynamic = 'force-dynamic'

function saudacao() {
  const h = new Date().getHours()
  if (h < 6) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default async function Painel() {
  const u = await usuarioAtual()
  const disc = await discAtiva()
  if (!disc) redirect('/disciplinas')
  const dados = conteudo(disc)
  const aulas = todasAulas(disc)

  const [feitas, mensagens, arquivos, notas] = await Promise.all([
    sql<{ aula_slug: string }>('SELECT aula_slug FROM progresso WHERE usuario_id = $1', [u.id]),
    sql<{ corpo: string; canal: string; nome: string; criado_em: string; usuario_id: number; foto: string | null }>(
      `SELECT m.corpo, m.canal, u.nome, m.criado_em, m.usuario_id, u.foto FROM mensagens m
       JOIN usuarios u ON u.id = m.usuario_id WHERE m.canal LIKE $1 ORDER BY m.id DESC LIMIT 5`,
      [`${disc}:%`],
    ),
    sql<{ id: number; nome: string; criado_em: string; autor: string }>(
      `SELECT a.id, a.nome, a.criado_em, u.nome AS autor FROM arquivos a
       JOIN usuarios u ON u.id = a.usuario_id WHERE a.publico AND a.disciplina = $1 AND a.descricao <> 'anexo do chat'
       ORDER BY a.id DESC LIMIT 5`,
      [disc],
    ),
    sql<{ id: number; titulo: string; corpo: string; aula_slug: string | null; autor: string }>(
      `SELECT n.id, n.titulo, n.corpo, n.aula_slug, u.nome AS autor FROM notas n
       JOIN usuarios u ON u.id = n.usuario_id WHERE n.publica AND n.disciplina = $1 ORDER BY n.id DESC LIMIT 5`,
      [disc],
    ),
  ])

  const concluidas = new Set(feitas.map((f) => f.aula_slug))
  const pct = aulas.length ? Math.round((concluidas.size / aulas.length) * 100) : 0
  const continuar = aulas.find((a) => !concluidas.has(a.slug)) ?? aulas[0]
  const novas = aulas.filter(ehNova).slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="painel relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ed145b, transparent 70%)' }}
        />
        <p className="text-sm suave">{saudacao()},</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{u.nome.split(' ')[0]} 👋</h1>
        <p className="mt-2 max-w-lg text-sm suave">
          {dados.disciplina.nome} — {dados.disciplina.totalAulas} aulas organizadas por assunto, direto do
          material da prof. {dados.disciplina.professor}.
        </p>

        <div className="mt-6 max-w-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="suave">Seu progresso</span>
            <span className="font-semibold">
              {concluidas.size}/{aulas.length} aulas · {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--painel-2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fiap-500 to-fiap-400 transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {continuar && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BotaoLink href={`/aulas/${continuar.slug}`} tamanho="lg">
              {concluidas.size ? 'Continuar' : 'Começar'}: {continuar.titulo}
              <ArrowRight size={17} />
            </BotaoLink>
            <BotaoLink href="/aulas" variante="neutro" tamanho="lg">
              Ver todas as aulas
            </BotaoLink>
          </div>
        )}
      </section>

      {novas.length > 0 && (
        <section className="painel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles size={17} className="text-fiap-500" />
            Publicado recentemente pela professora
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {novas.map((a) => (
              <Link
                key={a.slug}
                href={`/aulas/${a.slug}`}
                className="rounded-xl border p-3 transition-colors hover:border-fiap-500/50 hover:bg-[var(--painel-2)]"
              >
                <p className="text-[11px] suave">{a.moduloTitulo}</p>
                <p className="mt-0.5 line-clamp-2 text-sm font-medium">{a.titulo}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Módulos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dados.modulos.map((m) => {
            const feitasMod = m.aulas.filter((a) => concluidas.has(a.slug)).length
            const p = Math.round((feitasMod / m.aulas.length) * 100)
            return (
              <Link
                key={m.slug}
                href={`/aulas#${m.slug}`}
                className="painel group flex flex-col gap-3 p-4 transition-colors hover:border-fiap-500/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-fiap-500/12 text-fiap-500">
                    <IconeModulo nome={m.icone} />
                  </span>
                  {p === 100 && <Selo tom="verde">completo</Selo>}
                </div>
                <div>
                  <p className="font-medium">{m.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-xs suave">{m.resumo}</p>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--painel-2)]">
                    <div className="h-full rounded-full bg-fiap-500" style={{ width: `${p}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] suave">
                    {feitasMod}/{m.aulas.length} aulas
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <div className="painel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MessageSquare size={16} className="text-fiap-500" /> No chat
          </h2>
          {mensagens.length === 0 && <p className="text-sm suave">Ninguém falou nada ainda.</p>}
          <ul className="space-y-3">
            {mensagens.map((m, i) => (
              <li key={i} className="flex gap-2.5">
                <Avatar nome={m.nome} tamanho={28} usuarioId={m.usuario_id} foto={m.foto} />
                <div className="min-w-0">
                  <p className="text-xs suave">
                    {m.nome.split(' ')[0]} · #{m.canal.split(':').pop()} · {quando(m.criado_em)}
                  </p>
                  <p className="line-clamp-2 text-sm">{m.corpo}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/chat" className="mt-4 inline-block text-xs font-medium text-fiap-500 hover:underline">
            Abrir chat →
          </Link>
        </div>

        <div className="painel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Files size={16} className="text-fiap-500" /> Materiais novos
          </h2>
          {arquivos.length === 0 && <p className="text-sm suave">Nenhum material compartilhado ainda.</p>}
          <ul className="space-y-2">
            {arquivos.map((a) => (
              <li key={a.id} className="text-sm">
                <a href={`/api/arquivos/${a.id}`} className="font-medium hover:text-fiap-500">
                  {a.nome}
                </a>
                <p className="text-xs suave">
                  {a.autor.split(' ')[0]} · {quando(a.criado_em)}
                </p>
              </li>
            ))}
          </ul>
          <Link href="/arquivos" className="mt-4 inline-block text-xs font-medium text-fiap-500 hover:underline">
            Ver materiais →
          </Link>
        </div>

        <div className="painel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <NotebookPen size={16} className="text-fiap-500" /> Anotações da turma
          </h2>
          {notas.length === 0 && <p className="text-sm suave">Nenhuma anotação pública ainda.</p>}
          <ul className="space-y-2">
            {notas.map((n) => (
              <li key={n.id} className="text-sm">
                <p className="font-medium">{n.titulo || n.corpo.slice(0, 40)}</p>
                <p className="line-clamp-2 text-xs suave">{n.corpo}</p>
              </li>
            ))}
          </ul>
          <Link href="/anotacoes" className="mt-4 inline-block text-xs font-medium text-fiap-500 hover:underline">
            Ver anotações →
          </Link>
        </div>
      </section>
    </div>
  )
}
