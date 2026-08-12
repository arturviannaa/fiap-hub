// Converte os notebooks do repo da disciplina em <CONTENT_OUT>/python.json.
// Roda no build e tambem no servico de sync (a cada N horas), porque o repo da
// professora ganha aulas novas toda semana. Notebook que ainda nao esta no
// CURRICULO abaixo entra automaticamente no modulo "Aulas Novas" — a plataforma
// nunca fica sem um conteudo so porque ninguem atualizou este arquivo.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { marked } from 'marked'
import hljs from 'highlight.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = process.env.CONTENT_SRC || join(root, 'repo')
const OUT = process.env.CONTENT_OUT || join(root, 'content')
const IMG_DIR = join(OUT, 'aulas')

// Ordem pedagogica das aulas — o nome dos arquivos nao da essa informacao.
const CURRICULO = [
  {
    slug: 'fundamentos',
    titulo: 'Fundamentos',
    resumo: 'Como o Python guarda e transforma informação: os blocos de tudo que vem depois.',
    icone: 'terminal',
    aulas: [
      ['variaveis-e-tipos', 'Variáveis e Tipos de Dados', 'Variáveis e Tipos de Dados/aula2_variaveis_e_tipos_de_dados.ipynb', ['int', 'float', 'str', 'bool', 'type()', 'casting']],
      ['operadores', 'Operadores', 'Operadores/aula3_operadores.ipynb', ['aritméticos', 'comparação', 'lógicos', 'precedência']],
    ],
  },
  {
    slug: 'decisao',
    titulo: 'Estruturas de Decisão',
    resumo: 'Fazer o programa escolher caminhos: if, elif, else e match/case.',
    icone: 'branch',
    aulas: [
      ['condicionais', 'Condicionais (if / elif / else)', 'Condicionais/aula4_condicionais.ipynb', ['if', 'elif', 'else', 'and', 'or', 'aninhamento']],
      ['exercicios-condicionais', 'Exercícios de Condicionais', 'Condicionais/aula5_exercicios_condicionais.ipynb', ['rank up', 'prática']],
      ['match-case', 'Match / Case', 'Match Case/aula6_match_case.ipynb', ['match', 'case', 'wildcard', 'padrões']],
    ],
  },
  {
    slug: 'repeticao',
    titulo: 'Estruturas de Repetição',
    resumo: 'Repetir com controle: while para condição, for para percurso.',
    icone: 'repeat',
    aulas: [
      ['while', 'Laço While', 'Estruturas de Repetição For e While/aula7_estruturas_de_repetição_while.ipynb', ['while', 'break', 'continue', 'acumulador']],
      ['for', 'Laço For', 'Estruturas de Repetição For e While/aula8_estruturas_de_repetição_for.ipynb', ['for', 'range', 'iteração']],
    ],
  },
  {
    slug: 'colecoes',
    titulo: 'Coleções de Dados',
    resumo: 'Guardar muitos valores: listas, tuplas, conjuntos, dicionários e matrizes.',
    icone: 'layers',
    aulas: [
      ['listas', 'Listas', 'Listas/aula9_listas.ipynb', ['append', 'pop', 'slice', 'sort', 'index']],
      ['for-em-listas', 'Percorrendo Listas com For', 'Listas/aula10_for_listas.ipynb', ['for', 'enumerate', 'list comprehension']],
      ['tuplas', 'Tuplas', 'Tuplas/aula11_tuplas.ipynb', ['imutabilidade', 'unpacking', 'count', 'index']],
      ['conjuntos', 'Conjuntos (set)', 'Conjuntos (set)/Conjuntos.ipynb', ['set', 'union', 'intersection', 'difference']],
      ['dicionarios', 'Dicionários', 'Dicionários/aula_dicionarios.ipynb', ['chave-valor', 'keys', 'values', 'items', 'get']],
      ['matrizes', 'Matrizes', 'Matrizes/aula11_matrizes.ipynb', ['lista de listas', 'for aninhado', 'linha x coluna']],
    ],
  },
  {
    slug: 'funcoes',
    titulo: 'Funções e Exceções',
    resumo: 'Empacotar lógica em blocos reutilizáveis e lidar com o que dá errado.',
    icone: 'function',
    aulas: [
      ['funcoes', 'Funções, docstring, type hints e exceções', 'Funções, docstring, type hints e tratamento de exceções/aula_funções.ipynb', ['def', 'return', 'parâmetros', 'docstring', 'type hints', 'try/except']],
    ],
  },
  {
    slug: 'arquivos',
    titulo: 'Manipulação de Arquivos',
    resumo: 'Ler e escrever dados fora do programa: txt, csv, xlsx e parquet.',
    icone: 'file',
    aulas: [
      ['arquivos-texto', 'Arquivos de Texto', 'Manipulação de Arquivos/Arquivos de texto/Aula_Manipulação_de_Arquivos.ipynb', ['open', 'read', 'write', 'with', 'modos']],
      ['desafio-arquivos', 'Desafio Complementar de Arquivos', 'Manipulação de Arquivos/Arquivos de texto/Desafio_Complementar.ipynb', ['desafio', 'prática']],
      ['csv-xlsx-parquet', 'CSV, XLSX e Parquet', 'Manipulação de Arquivos/Outros arquivos (csv, xlsx, parquet)/Manipulação_de_arquivos_csv,_xlsx_e_parquet.ipynb', ['csv', 'excel', 'parquet', 'pandas']],
    ],
  },
  {
    slug: 'bibliotecas',
    titulo: 'Bibliotecas',
    resumo: 'Usar o que a comunidade já construiu — começando por pandas.',
    icone: 'package',
    aulas: [
      ['pandas', 'Entendendo Pandas', 'Bibliotecas/entendendo_pandas.ipynb', ['DataFrame', 'Series', 'groupby', 'merge', 'plot']],
    ],
  },
  {
    slug: 'exercicios',
    titulo: 'Exercícios Complementares',
    resumo: 'Prática extra por tema, para fixar antes das provas.',
    icone: 'dumbbell',
    aulas: [
      ['ex-listas', 'Exercícios de Listas', 'Exercícios Complementares/Listas/exercicios_complementares.ipynb', ['prática', 'listas']],
      ['ex-tuplas', 'Exercícios de Tuplas', 'Exercícios Complementares/Tuplas/exercicios_complementares.ipynb', ['prática', 'tuplas']],
      ['ex-matrizes', 'Exercícios de Matrizes', 'Exercícios Complementares/Matrizes/exercicios_complementares_matrizes.ipynb', ['prática', 'matrizes']],
      ['ex-funcoes', 'Exercícios de Funções e Exceções', 'Exercícios Complementares/Funções e tratamento de exceções/exercicio_complementar.ipynb', ['prática', 'funções', 'try/except']],
    ],
  },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

marked.setOptions({ gfm: true, breaks: false })

// marked v15 nao gera id em heading; o indice lateral da aula precisa deles.
const slugHeading = (texto) =>
  texto
    .replace(/<[^>]*>/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const texto = this.parser.parseInline(tokens)
      return `<h${depth} id="${slugHeading(texto)}">${texto}</h${depth}>\n`
    },
  },
})

const limpaMarkdown = (md) =>
  md.replace(/<a\s+href="https:\/\/colab\.research\.google\.com[^>]*>[\s\S]*?<\/a>/gi, '').trim()

function realce(codigo) {
  try {
    return hljs.highlight(codigo, { language: 'python' }).value
  } catch {
    return esc(codigo)
  }
}

// Data do ultimo commit que tocou o arquivo — vira "atualizado em" e o selo NOVO.
function dataDoArquivo(caminho) {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', caminho], {
      cwd: SRC,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (iso) return iso
  } catch {}
  try {
    return statSync(join(SRC, caminho)).mtime.toISOString()
  } catch {
    return null
  }
}

function saidas(cell, aulaSlug, idx) {
  const out = []
  for (const [i, o] of (cell.outputs || []).entries()) {
    if (o.output_type === 'stream') {
      const texto = [].concat(o.text || []).join('')
      if (texto.trim()) out.push({ tipo: 'texto', texto })
    } else if (o.output_type === 'error') {
      out.push({ tipo: 'erro', texto: `${o.ename}: ${o.evalue}` })
    } else if (o.data) {
      if (o.data['image/png']) {
        const nome = `${aulaSlug}-${idx}-${i}.png`
        writeFileSync(join(IMG_DIR, nome), Buffer.from([].concat(o.data['image/png']).join(''), 'base64'))
        out.push({ tipo: 'imagem', src: `/conteudo/aulas/${nome}` })
      } else if (o.data['text/html']) {
        out.push({ tipo: 'html', html: [].concat(o.data['text/html']).join('') })
      } else if (o.data['text/plain']) {
        const texto = [].concat(o.data['text/plain']).join('')
        if (texto.trim()) out.push({ tipo: 'texto', texto })
      }
    }
  }
  return out
}

function converte(caminho, aulaSlug) {
  const nb = JSON.parse(readFileSync(join(SRC, caminho), 'utf8'))
  const blocos = []
  let textoBusca = ''
  for (const [idx, cell] of (nb.cells || []).entries()) {
    const fonte = [].concat(cell.source || []).join('')
    if (cell.cell_type === 'markdown') {
      const md = limpaMarkdown(fonte)
      if (!md) continue
      blocos.push({ tipo: 'md', html: marked.parse(md) })
      textoBusca += ' ' + md
    } else if (cell.cell_type === 'code') {
      if (!fonte.trim()) continue
      blocos.push({ tipo: 'codigo', codigo: fonte, html: realce(fonte), saidas: saidas(cell, aulaSlug, idx) })
      textoBusca += ' ' + fonte
    }
  }
  return { blocos, textoBusca: textoBusca.replace(/\s+/g, ' ').trim() }
}

function montaAula(slug, titulo, arquivo, tags, mod) {
  const { blocos, textoBusca } = converte(arquivo, slug)
  const nCodigo = blocos.filter((b) => b.tipo === 'codigo').length
  return {
    slug,
    titulo,
    tags,
    modulo: mod.slug,
    moduloTitulo: mod.titulo,
    arquivoOrigem: arquivo,
    atualizadoEm: dataDoArquivo(arquivo),
    blocos,
    textoBusca,
    minutos: Math.max(5, Math.round(textoBusca.length / 900 + nCodigo * 1.2)),
    exemplos: nCodigo,
  }
}

const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function todosNotebooks(dir = SRC, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) todosNotebooks(p, acc)
    else if (e.name.endsWith('.ipynb') && !e.name.startsWith('.')) acc.push(relative(SRC, p))
  }
  return acc
}

// --- build ---------------------------------------------------------------
if (existsSync(IMG_DIR)) rmSync(IMG_DIR, { recursive: true })
mkdirSync(IMG_DIR, { recursive: true })

const mapeados = new Set()
const modulos = []
let totalAulas = 0

for (const mod of CURRICULO) {
  const aulas = []
  for (const [slug, titulo, arquivo, tags] of mod.aulas) {
    if (!existsSync(join(SRC, arquivo))) {
      console.warn(`  ! notebook removido do repo de origem: ${arquivo}`)
      continue
    }
    mapeados.add(arquivo)
    aulas.push(montaAula(slug, titulo, arquivo, tags, mod))
    totalAulas++
  }
  if (aulas.length) modulos.push({ ...mod, aulas })
}

// Notebooks que apareceram no repo depois da ultima curadoria.
const novos = todosNotebooks().filter((f) => !mapeados.has(f))
if (novos.length) {
  const mod = {
    slug: 'novas',
    titulo: 'Aulas Novas',
    resumo: 'Publicadas pela professora e ainda não encaixadas em um módulo. O conteúdo já está completo aqui.',
    icone: 'sparkles',
  }
  const aulas = novos.map((arquivo) => {
    const nome = basename(arquivo, '.ipynb').replace(/[_]+/g, ' ')
    const titulo = nome.charAt(0).toUpperCase() + nome.slice(1)
    return montaAula(slugify(arquivo) || slugify(nome), titulo, arquivo, [dirname(arquivo).split('/').pop()], mod)
  })
  modulos.push({ ...mod, aulas })
  totalAulas += aulas.length
  console.log(`  + ${aulas.length} aula(s) nova(s) detectada(s): ${novos.join(', ')}`)
}

const saida = {
  geradoEm: new Date().toISOString(),
  disciplina: {
    slug: 'python',
    nome: 'Computational Thinking with Python',
    professora: 'Maria C. Martins',
    fonte: 'https://github.com/mariacmartins/computational_thinking_with_python',
    totalAulas,
  },
  modulos,
}

// Slugs anteriores (se ja existia um python.json) — pra detectar aula nova.
let slugsAntigos = new Set()
const arquivoSaida = join(OUT, 'python.json')
if (existsSync(arquivoSaida)) {
  try {
    const antigo = JSON.parse(readFileSync(arquivoSaida, 'utf8'))
    slugsAntigos = new Set(antigo.modulos.flatMap((m) => m.aulas.map((a) => a.slug)))
  } catch {}
}

mkdirSync(OUT, { recursive: true })
writeFileSync(arquivoSaida, JSON.stringify(saida))
console.log(`conteudo: ${modulos.length} modulos, ${totalAulas} aulas -> ${arquivoSaida}`)

// Push de "aula nova": so quando ja havia um conteudo anterior (evita disparar
// pra todas as 22 na primeira geracao) e so pras aulas realmente novas.
const APP = process.env.APP_INTERNO_URL
const SEGREDO = process.env.INTERNO_SECRET
if (APP && SEGREDO && slugsAntigos.size > 0) {
  const novasAulas = saida.modulos
    .flatMap((m) => m.aulas)
    .filter((a) => !slugsAntigos.has(a.slug))
    .slice(0, 5) // no maximo 5 avisos por ciclo
  for (const a of novasAulas) {
    try {
      await fetch(`${APP}/api/interno/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: SEGREDO,
          titulo: `Nova aula: ${a.titulo}`,
          corpo: a.moduloTitulo,
          data: { slug: a.slug },
        }),
      })
      console.log(`  push enviado: aula nova ${a.slug}`)
    } catch (e) {
      console.warn(`  push falhou (${a.slug}): ${e.message}`)
    }
  }
}
