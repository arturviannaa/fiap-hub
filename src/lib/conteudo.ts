import { readFileSync, statSync } from 'node:fs'
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

export type Modulo = {
  slug: string
  titulo: string
  resumo: string
  icone: string
  aulas: Aula[]
}

export type Conteudo = {
  geradoEm: string
  disciplina: { slug: string; nome: string; professora: string; fonte: string; totalAulas: number }
  modulos: Modulo[]
}

const DIR = process.env.CONTENT_DIR || join(process.cwd(), 'content')

// O servico de sync reescreve o JSON enquanto o app roda: cache invalidado por
// mtime, entao aula nova aparece sem reiniciar container.
const g = globalThis as typeof globalThis & { _conteudo?: { mtime: number; dados: Conteudo } }

export function conteudo(): Conteudo {
  const arquivo = join(DIR, 'python.json')
  const mtime = statSync(arquivo).mtimeMs
  if (!g._conteudo || g._conteudo.mtime !== mtime) {
    g._conteudo = { mtime, dados: JSON.parse(readFileSync(arquivo, 'utf8')) }
  }
  return g._conteudo.dados
}

export function todasAulas(): Aula[] {
  return conteudo().modulos.flatMap((m) => m.aulas)
}

export function acharAula(slug: string): Aula | undefined {
  return todasAulas().find((a) => a.slug === slug)
}

export function vizinhas(slug: string) {
  const lista = todasAulas()
  const i = lista.findIndex((a) => a.slug === slug)
  return { anterior: i > 0 ? lista[i - 1] : null, proxima: i >= 0 && i < lista.length - 1 ? lista[i + 1] : null }
}

const DIAS_NOVO = 14
export function ehNova(aula: Aula) {
  if (!aula.atualizadoEm) return false
  return Date.now() - new Date(aula.atualizadoEm).getTime() < DIAS_NOVO * 864e5
}
