// Check do conversor de notebooks: `node scripts/test-content.mjs`.
// Roda depois de `npm run content`. Se o formato do ipynb mudar ou uma aula
// sumir do repo, isso falha antes de ir para o ar.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = process.env.CONTENT_OUT || join(process.cwd(), 'content')
const c = JSON.parse(readFileSync(join(OUT, 'python.json'), 'utf8'))

assert.ok(c.modulos.length >= 5, 'poucos módulos gerados')
assert.ok(c.disciplina.totalAulas >= 20, 'poucas aulas geradas')

const aulas = c.modulos.flatMap((m) => m.aulas)
const slugs = new Set()
for (const a of aulas) {
  assert.ok(!slugs.has(a.slug), `slug duplicado: ${a.slug}`)
  slugs.add(a.slug)
  assert.ok(a.blocos.length > 0, `aula sem conteúdo: ${a.slug}`)
  assert.ok(a.textoBusca.length > 50, `aula sem texto para busca: ${a.slug}`)
  assert.match(a.slug, /^[a-z0-9-]+$/, `slug inválido: ${a.slug}`)
  for (const b of a.blocos) {
    if (b.tipo === 'codigo') assert.ok(b.html && b.codigo, `bloco de código vazio em ${a.slug}`)
    else assert.ok(b.html, `bloco markdown vazio em ${a.slug}`)
  }
}

// O índice lateral da aula depende de heading com id.
const comHeading = aulas.filter((a) =>
  a.blocos.some((b) => b.tipo === 'md' && /<h[23] id="[^"]+"/.test(b.html)),
)
assert.ok(comHeading.length >= 5, 'headings sem id: o índice lateral não funcionaria')

// Realce de sintaxe aplicado (senão o código sai como texto cru).
const comRealce = aulas.filter((a) => a.blocos.some((b) => b.tipo === 'codigo' && b.html.includes('hljs-')))
assert.ok(comRealce.length >= 10, 'highlight.js não marcou o código')

console.log(`ok: ${aulas.length} aulas, ${c.modulos.length} módulos`)
