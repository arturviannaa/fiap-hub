import { readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export type Saida =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'erro'; texto: string }
  | { tipo: 'html'; html: string }
  | { tipo: 'imagem'; src: string }

export type Bloco =
  | { tipo: 'md'; html: string }
  | { tipo: 'codigo'; codigo: string; html: string; saidas: Saida[] }

export type Aula = {
  slug: string
  titulo: string
  tags: string[]
  modulo: string
  moduloTitulo: string
  arquivoOrigem: string
  atualizadoEm: string | null
  blocos: Bloco[]
  textoBusca: string
  minutos: number
  exemplos: number
}

export type Modulo = { slug: string; titulo: string; resumo: string; icone: string; aulas: Aula[] }

export type DisciplinaMeta = {
  slug: string
  nome: string
  curto: string
  professor: string
  icone: string
  cor: string
  fonte: string
  totalAulas: number
}

export type Conteudo = { geradoEm: string; disciplina: DisciplinaMeta; modulos: Modulo[] }

const DIR = process.env.CONTENT_DIR || join(process.cwd(), 'content')
export const DISCIPLINA_PADRAO = 'python'

const g = globalThis as typeof globalThis & {
  _conteudo?: Record<string, { mtime: number; dados: Conteudo }>
  _disc?: { mtime: number; lista: Omit<DisciplinaMeta, 'fonte'>[] }
}

// Lista de disciplinas (índice gerado pelo build). Cacheada por mtime.
export function disciplinas(): Omit<DisciplinaMeta, 'fonte'>[] {
  const arquivo = join(DIR, 'disciplinas.json')
  if (!existsSync(arquivo)) return []
  const mtime = statSync(arquivo).mtimeMs
  if (!g._disc || g._disc.mtime !== mtime) {
    g._disc = { mtime, lista: JSON.parse(readFileSync(arquivo, 'utf8')).disciplinas }
  }
  return g._disc.lista
}

export function ehDisciplina(slug: string): boolean {
  return slug === DISCIPLINA_PADRAO || disciplinas().some((d) => d.slug === slug)
}

// Conteúdo de uma disciplina (default: python). Cache invalidado por mtime, então
// o sync pode reescrever o JSON com o app rodando.
export function conteudo(disc: string = DISCIPLINA_PADRAO): Conteudo {
  const arquivo = join(DIR, `${disc}.json`)
  const mtime = statSync(arquivo).mtimeMs
  g._conteudo ??= {}
  if (!g._conteudo[disc] || g._conteudo[disc].mtime !== mtime) {
    g._conteudo[disc] = { mtime, dados: JSON.parse(readFileSync(arquivo, 'utf8')) }
  }
  return g._conteudo[disc].dados
}

export function todasAulas(disc: string = DISCIPLINA_PADRAO): Aula[] {
  return conteudo(disc).modulos.flatMap((m) => m.aulas)
}

// Acha a aula pela slug. Se a disciplina não for dada, procura em todas — as
// slugs não colidem entre disciplinas (curadas no Python, por pasta no Edge).
export function acharAula(slug: string, disc?: string): Aula | undefined {
  if (disc) return todasAulas(disc).find((a) => a.slug === slug)
  for (const d of listaSlugs()) {
    const a = todasAulas(d).find((x) => x.slug === slug)
    if (a) return a
  }
  return undefined
}

// Disciplina a que uma aula pertence.
export function disciplinaDaAula(slug: string): string | undefined {
  for (const d of listaSlugs()) if (todasAulas(d).some((a) => a.slug === slug)) return d
  return undefined
}

export function vizinhas(slug: string, disc?: string) {
  const d = disc || disciplinaDaAula(slug) || DISCIPLINA_PADRAO
  const lista = todasAulas(d)
  const i = lista.findIndex((a) => a.slug === slug)
  return { anterior: i > 0 ? lista[i - 1] : null, proxima: i >= 0 && i < lista.length - 1 ? lista[i + 1] : null }
}

function listaSlugs(): string[] {
  const ds = disciplinas().map((d) => d.slug)
  return ds.length ? ds : [DISCIPLINA_PADRAO]
}

const DIAS_NOVO = 14
export function ehNova(aula: Aula) {
  if (!aula.atualizadoEm) return false
  return Date.now() - new Date(aula.atualizadoEm).getTime() < DIAS_NOVO * 864e5
}
