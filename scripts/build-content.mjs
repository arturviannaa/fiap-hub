// Gera o conteúdo de CADA disciplina em <CONTENT_OUT>/<slug>.json e um índice
// <CONTENT_OUT>/disciplinas.json. Roda no build e no serviço de sync.
// - Python: notebooks (.ipynb) → blocos. Currículo curado abaixo; notebook novo
//   entra sozinho em "Aulas Novas".
// - Edge Computing: código Arduino/C++ (.ino/.cpp/.h) organizado por pastas de
//   aula; cada sketch vira um bloco de código.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { limparHtml } from './sanitiza.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const OUT = process.env.CONTENT_OUT || join(root, 'content')
const REPOS = process.env.REPOS_DIR || join(root, 'repos')
const IMG_DIR = join(OUT, 'aulas')

// Reatribuído por disciplina antes de montar cada aula (os helpers leem daqui).
let SRC = join(REPOS, 'python')

// --- currículo curado do Python ------------------------------------------
const CURRICULO_PYTHON = [
  { slug: 'fundamentos', titulo: 'Fundamentos', resumo: 'Como o Python guarda e transforma informação: os blocos de tudo que vem depois.', icone: 'terminal', aulas: [
    ['variaveis-e-tipos', 'Variáveis e Tipos de Dados', 'Variáveis e Tipos de Dados/aula2_variaveis_e_tipos_de_dados.ipynb', ['int', 'float', 'str', 'bool', 'type()', 'casting']],
    ['operadores', 'Operadores', 'Operadores/aula3_operadores.ipynb', ['aritméticos', 'comparação', 'lógicos', 'precedência']],
  ]},
  { slug: 'decisao', titulo: 'Estruturas de Decisão', resumo: 'Fazer o programa escolher caminhos: if, elif, else e match/case.', icone: 'branch', aulas: [
    ['condicionais', 'Condicionais (if / elif / else)', 'Condicionais/aula4_condicionais.ipynb', ['if', 'elif', 'else', 'and', 'or', 'aninhamento']],
    ['exercicios-condicionais', 'Exercícios de Condicionais', 'Condicionais/aula5_exercicios_condicionais.ipynb', ['rank up', 'prática']],
    ['match-case', 'Match / Case', 'Match Case/aula6_match_case.ipynb', ['match', 'case', 'wildcard', 'padrões']],
  ]},
  { slug: 'repeticao', titulo: 'Estruturas de Repetição', resumo: 'Repetir com controle: while para condição, for para percurso.', icone: 'repeat', aulas: [
    ['while', 'Laço While', 'Estruturas de Repetição For e While/aula7_estruturas_de_repetição_while.ipynb', ['while', 'break', 'continue', 'acumulador']],
    ['for', 'Laço For', 'Estruturas de Repetição For e While/aula8_estruturas_de_repetição_for.ipynb', ['for', 'range', 'iteração']],
  ]},
  { slug: 'colecoes', titulo: 'Coleções de Dados', resumo: 'Guardar muitos valores: listas, tuplas, conjuntos, dicionários e matrizes.', icone: 'layers', aulas: [
    ['listas', 'Listas', 'Listas/aula9_listas.ipynb', ['append', 'pop', 'slice', 'sort', 'index']],
    ['for-em-listas', 'Percorrendo Listas com For', 'Listas/aula10_for_listas.ipynb', ['for', 'enumerate', 'list comprehension']],
    ['tuplas', 'Tuplas', 'Tuplas/aula11_tuplas.ipynb', ['imutabilidade', 'unpacking', 'count', 'index']],
    ['conjuntos', 'Conjuntos (set)', 'Conjuntos (set)/Conjuntos.ipynb', ['set', 'union', 'intersection', 'difference']],
    ['dicionarios', 'Dicionários', 'Dicionários/aula_dicionarios.ipynb', ['chave-valor', 'keys', 'values', 'items', 'get']],
    ['matrizes', 'Matrizes', 'Matrizes/aula11_matrizes.ipynb', ['lista de listas', 'for aninhado', 'linha x coluna']],
  ]},
  { slug: 'funcoes', titulo: 'Funções e Exceções', resumo: 'Empacotar lógica em blocos reutilizáveis e lidar com o que dá errado.', icone: 'function', aulas: [
    ['funcoes', 'Funções, docstring, type hints e exceções', 'Funções, docstring, type hints e tratamento de exceções/aula_funções.ipynb', ['def', 'return', 'parâmetros', 'docstring', 'type hints', 'try/except']],
  ]},
  { slug: 'arquivos', titulo: 'Manipulação de Arquivos', resumo: 'Ler e escrever dados fora do programa: txt, csv, xlsx e parquet.', icone: 'file', aulas: [
    ['arquivos-texto', 'Arquivos de Texto', 'Manipulação de Arquivos/Arquivos de texto/Aula_Manipulação_de_Arquivos.ipynb', ['open', 'read', 'write', 'with', 'modos']],
    ['desafio-arquivos', 'Desafio Complementar de Arquivos', 'Manipulação de Arquivos/Arquivos de texto/Desafio_Complementar.ipynb', ['desafio', 'prática']],
    ['csv-xlsx-parquet', 'CSV, XLSX e Parquet', 'Manipulação de Arquivos/Outros arquivos (csv, xlsx, parquet)/Manipulação_de_arquivos_csv,_xlsx_e_parquet.ipynb', ['csv', 'excel', 'parquet', 'pandas']],
  ]},
  { slug: 'bibliotecas', titulo: 'Bibliotecas', resumo: 'Usar o que a comunidade já construiu — começando por pandas.', icone: 'package', aulas: [
    ['pandas', 'Entendendo Pandas', 'Bibliotecas/entendendo_pandas.ipynb', ['DataFrame', 'Series', 'groupby', 'merge', 'plot']],
  ]},
  { slug: 'exercicios', titulo: 'Exercícios Complementares', resumo: 'Prática extra por tema, para fixar antes das provas.', icone: 'dumbbell', aulas: [
    ['ex-listas', 'Exercícios de Listas', 'Exercícios Complementares/Listas/exercicios_complementares.ipynb', ['prática', 'listas']],
    ['ex-tuplas', 'Exercícios de Tuplas', 'Exercícios Complementares/Tuplas/exercicios_complementares.ipynb', ['prática', 'tuplas']],
    ['ex-matrizes', 'Exercícios de Matrizes', 'Exercícios Complementares/Matrizes/exercicios_complementares_matrizes.ipynb', ['prática', 'matrizes']],
    ['ex-funcoes', 'Exercícios de Funções e Exceções', 'Exercícios Complementares/Funções e tratamento de exceções/exercicio_complementar.ipynb', ['prática', 'funções', 'try/except']],
  ]},
]

// --- disciplinas ----------------------------------------------------------
const DISCIPLINAS = [
  {
    slug: 'python', tipo: 'notebook', repo: 'python',
    nome: 'Computational Thinking with Python', curto: 'Python',
    professor: 'Maria C. Martins', icone: 'terminal', cor: '#ed145b',
    fonte: 'https://github.com/mariacmartins/computational_thinking_with_python',
    curriculo: CURRICULO_PYTHON,
  },
  {
    slug: 'edge', tipo: 'arduino', repo: 'edge',
    nome: 'Edge Computing & Computer Systems', curto: 'Edge Computing',
    professor: 'Guilherme Salati', icone: 'cpu', cor: '#7c5cff',
    fonte: 'https://github.com/gsalati/Edge-Computing-Computer-Systems',
  },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

marked.setOptions({ gfm: true, breaks: false })
const slugHeading = (texto) =>
  texto.replace(/<[^>]*>/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

function realce(codigo, lang = 'python') {
  try {
    return hljs.highlight(codigo, { language: lang }).value
  } catch {
    return esc(codigo)
  }
}

function dataDoArquivo(caminho) {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', caminho], { cwd: SRC, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    if (iso) return iso
  } catch {}
  try {
    return statSync(join(SRC, caminho)).mtime.toISOString()
  } catch {
    return null
  }
}

const slugify = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ---- Python: notebooks ---------------------------------------------------
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
        out.push({ tipo: 'html', html: limparHtml([].concat(o.data['text/html']).join('')) })
      } else if (o.data['text/plain']) {
        const texto = [].concat(o.data['text/plain']).join('')
        if (texto.trim()) out.push({ tipo: 'texto', texto })
      }
    }
  }
  return out
}

function converteNotebook(caminho, aulaSlug) {
  const nb = JSON.parse(readFileSync(join(SRC, caminho), 'utf8'))
  const blocos = []
  let textoBusca = ''
  for (const [idx, cell] of (nb.cells || []).entries()) {
    const fonte = [].concat(cell.source || []).join('')
    if (cell.cell_type === 'markdown') {
      const md = limpaMarkdown(fonte)
      if (!md) continue
      blocos.push({ tipo: 'md', html: limparHtml(marked.parse(md)) })
      textoBusca += ' ' + md
    } else if (cell.cell_type === 'code') {
      if (!fonte.trim()) continue
      blocos.push({ tipo: 'codigo', codigo: fonte, html: realce(fonte, 'python'), saidas: saidas(cell, aulaSlug, idx) })
      textoBusca += ' ' + fonte
    }
  }
  return { blocos, textoBusca: textoBusca.replace(/\s+/g, ' ').trim() }
}

function montaAulaNotebook(slug, titulo, arquivo, tags, mod) {
  const { blocos, textoBusca } = converteNotebook(arquivo, slug)
  const nCodigo = blocos.filter((b) => b.tipo === 'codigo').length
  return {
    slug, titulo, tags, modulo: mod.slug, moduloTitulo: mod.titulo,
    arquivoOrigem: arquivo, atualizadoEm: dataDoArquivo(arquivo),
    blocos, textoBusca,
    minutos: Math.max(5, Math.round(textoBusca.length / 900 + nCodigo * 1.2)),
    exemplos: nCodigo,
  }
}

function todosNotebooks(dir = SRC, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) todosNotebooks(p, acc)
    else if (e.name.endsWith('.ipynb') && !e.name.startsWith('.')) acc.push(relative(SRC, p))
  }
  return acc
}

function buildPython(disc) {
  const mapeados = new Set()
  const modulos = []
  let totalAulas = 0
  for (const mod of disc.curriculo) {
    const aulas = []
    for (const [slug, titulo, arquivo, tags] of mod.aulas) {
      if (!existsSync(join(SRC, arquivo))) {
        console.warn(`  ! ${disc.slug}: notebook removido: ${arquivo}`)
        continue
      }
      mapeados.add(arquivo)
      aulas.push(montaAulaNotebook(slug, titulo, arquivo, tags, mod))
      totalAulas++
    }
    if (aulas.length) modulos.push({ ...mod, aulas })
  }
  const novos = todosNotebooks().filter((f) => !mapeados.has(f))
  if (novos.length) {
    const mod = { slug: 'novas', titulo: 'Aulas Novas', resumo: 'Publicadas pela professora e ainda não encaixadas em um módulo. O conteúdo já está completo aqui.', icone: 'sparkles' }
    const aulas = novos.map((arquivo) => {
      const nome = basename(arquivo, '.ipynb').replace(/[_]+/g, ' ')
      const titulo = nome.charAt(0).toUpperCase() + nome.slice(1)
      return montaAulaNotebook(slugify(arquivo) || slugify(nome), titulo, arquivo, [dirname(arquivo).split('/').pop()], mod)
    })
    modulos.push({ ...mod, aulas })
    totalAulas += aulas.length
    console.log(`  + ${disc.slug}: ${aulas.length} aula(s) nova(s)`)
  }
  return { modulos, totalAulas }
}

// ---- Edge: código Arduino/C++ -------------------------------------------
const CODIGO_EXT = { '.ino': 'arduino', '.cpp': 'cpp', '.hpp': 'cpp', '.h': 'cpp', '.c': 'c', '.py': 'python', '.json': 'json' }
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())

function tituloModulo(nome) {
  const m = nome.match(/^(\d+)[oª]?[_-]?semestre$/i)
  if (m) return `${m[1]}º Semestre`
  return titleCase(nome.replace(/[_-]+/g, ' '))
}

function tituloAula(nome) {
  const m = nome.match(/^aula[_-]?(\d+)[_-]?(.*)$/i)
  if (m) return `Aula ${m[1]}${m[2] ? ' · ' + titleCase(m[2].replace(/[_-]+/g, ' ')) : ''}`
  const cp = nome.match(/^cp(\d+)$/i)
  if (cp) return `Checkpoint ${cp[1]}`
  return titleCase(nome.replace(/[_-]+/g, ' '))
}

function codigosEm(absDir, acc = []) {
  for (const e of readdirSync(absDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.')) continue
    const p = join(absDir, e.name)
    if (e.isDirectory()) codigosEm(p, acc)
    else if (CODIGO_EXT[e.name.slice(e.name.lastIndexOf('.'))]) acc.push(p)
  }
  return acc
}

function montaAulaArduino(aulaDirRel, mod) {
  const absAula = join(SRC, aulaDirRel)
  const arquivos = codigosEm(absAula).sort((a, b) => (a.endsWith('.ino') ? -1 : 1) - (b.endsWith('.ino') ? -1 : 1))
  const blocos = []
  let textoBusca = ''
  for (const abs of arquivos) {
    const codigo = readFileSync(abs, 'utf8')
    if (!codigo.trim()) continue
    const nome = relative(absAula, abs)
    const ext = abs.slice(abs.lastIndexOf('.'))
    blocos.push({ tipo: 'md', html: `<h3 id="${slugHeading(nome)}">${esc(nome)}</h3>` })
    blocos.push({ tipo: 'codigo', codigo, html: realce(codigo, CODIGO_EXT[ext] || 'cpp'), saidas: [] })
    textoBusca += ' ' + nome + ' ' + codigo
  }
  const nCodigo = blocos.filter((b) => b.tipo === 'codigo').length
  return {
    slug: slugify(aulaDirRel), titulo: tituloAula(basename(aulaDirRel)), tags: [],
    modulo: mod.slug, moduloTitulo: mod.titulo, arquivoOrigem: aulaDirRel,
    atualizadoEm: dataDoArquivo(aulaDirRel), blocos,
    textoBusca: textoBusca.replace(/\s+/g, ' ').trim().slice(0, 8000),
    minutos: Math.max(4, Math.round(nCodigo * 2.5)), exemplos: nCodigo,
  }
}

function buildArduino() {
  const modulos = []
  let totalAulas = 0
  const topo = readdirSync(SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .sort((a, b) => a.name.localeCompare(b.name))
  for (const dir of topo) {
    const mod = { slug: slugify(dir.name), titulo: tituloModulo(dir.name), resumo: '', icone: 'cpu' }
    const subs = readdirSync(join(SRC, dir.name), { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt', { numeric: true }))
    const aulas = []
    for (const sub of subs) {
      const rel = join(dir.name, sub.name)
      if (codigosEm(join(SRC, rel)).length === 0) continue
      aulas.push(montaAulaArduino(rel, mod))
      totalAulas++
    }
    if (aulas.length) modulos.push({ ...mod, aulas })
  }
  return { modulos, totalAulas }
}

// --- build ----------------------------------------------------------------
if (existsSync(IMG_DIR)) rmSync(IMG_DIR, { recursive: true })
mkdirSync(IMG_DIR, { recursive: true })
mkdirSync(OUT, { recursive: true })

const APP = process.env.APP_INTERNO_URL
const SEGREDO = process.env.INTERNO_SECRET
const indice = []

for (const disc of DISCIPLINAS) {
  SRC = join(REPOS, disc.repo)
  if (!existsSync(SRC)) {
    console.warn(`  ! repo ausente para ${disc.slug}: ${SRC}`)
    continue
  }

  // slugs anteriores (pra detectar aula nova e avisar por push)
  const arquivoSaida = join(OUT, `${disc.slug}.json`)
  let slugsAntigos = new Set()
  if (existsSync(arquivoSaida)) {
    try {
      const antigo = JSON.parse(readFileSync(arquivoSaida, 'utf8'))
      slugsAntigos = new Set(antigo.modulos.flatMap((m) => m.aulas.map((a) => a.slug)))
    } catch {}
  }

  const { modulos, totalAulas } = disc.tipo === 'arduino' ? buildArduino() : buildPython(disc)
  const saida = {
    geradoEm: new Date().toISOString(),
    disciplina: { slug: disc.slug, nome: disc.nome, curto: disc.curto, professor: disc.professor, icone: disc.icone, cor: disc.cor, fonte: disc.fonte, totalAulas },
    modulos,
  }
  writeFileSync(arquivoSaida, JSON.stringify(saida))
  indice.push({ slug: disc.slug, nome: disc.nome, curto: disc.curto, professor: disc.professor, icone: disc.icone, cor: disc.cor, totalAulas })
  console.log(`${disc.slug}: ${modulos.length} módulos, ${totalAulas} aulas -> ${arquivoSaida}`)

  // push de aula nova (só quando já havia conteúdo e há slugs realmente novos)
  if (APP && SEGREDO && slugsAntigos.size > 0) {
    const novasAulas = modulos.flatMap((m) => m.aulas).filter((a) => !slugsAntigos.has(a.slug)).slice(0, 5)
    for (const a of novasAulas) {
      try {
        await fetch(`${APP}/api/interno/broadcast`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: SEGREDO, titulo: `Nova aula em ${disc.curto}: ${a.titulo}`, corpo: a.moduloTitulo, data: { disciplina: disc.slug, slug: a.slug } }),
        })
        console.log(`  push: aula nova ${disc.slug}/${a.slug}`)
      } catch (e) {
        console.warn(`  push falhou: ${e.message}`)
      }
    }
  }
}

writeFileSync(join(OUT, 'disciplinas.json'), JSON.stringify({ geradoEm: new Date().toISOString(), disciplinas: indice }))
console.log(`índice: ${indice.length} disciplinas -> ${join(OUT, 'disciplinas.json')}`)
