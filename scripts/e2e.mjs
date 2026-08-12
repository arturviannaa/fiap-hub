// Smoke test do fluxo real, ponta a ponta, num navegador de verdade:
//   npm i --no-save playwright && node scripts/e2e.mjs https://fiap.pervian.tech <codigo-da-turma>
// Cria uma conta descartavel, passa por todas as telas e tira screenshots.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] || 'http://localhost:8082'
const CODIGO = process.argv[3] || 'teste123'
const SAIDA = process.env.SCREENSHOTS || '/tmp/fiap-hub-e2e'
const email = `e2e.${Date.now()}@fiap.com.br`

mkdirSync(SAIDA, { recursive: true })

const navegador = await chromium.launch()
const ctx = await navegador.newContext({ viewport: { width: 1440, height: 950 } })
const p = await ctx.newPage()
const erros = []
p.on('pageerror', (e) => erros.push(String(e)))
p.on('console', (m) => m.type() === 'error' && erros.push(m.text()))

const passo = async (nome, fn) => {
  await fn()
  await p.screenshot({ path: `${SAIDA}/${nome}.png`, fullPage: true })
  console.log(`ok  ${nome}`)
}

await passo('01-entrar', async () => {
  await p.goto(`${BASE}/entrar`, { waitUntil: 'networkidle' })
})

await passo('02-cadastro', async () => {
  await p.goto(`${BASE}/cadastro`)
  await p.fill('input[name=nome]', 'Aluno E2E')
  await p.fill('input[name=email]', email)
  await p.fill('input[name=senha]', 'senha-forte-123')
  await p.fill('input[name=convite]', CODIGO)
})

await passo('03-painel', async () => {
  await p.click('button[type=submit]')
  await p.waitForURL(`${BASE}/`, { timeout: 20000 })
  await p.waitForLoadState('networkidle')
})

await passo('04-aulas', async () => {
  await p.click('a[href="/aulas"]')
  await p.waitForLoadState('networkidle')
})

await passo('05-aula', async () => {
  await p.goto(`${BASE}/aulas/dicionarios`, { waitUntil: 'networkidle' })
  if (!(await p.locator('pre code .hljs-keyword').first().isVisible())) throw new Error('código sem realce')
})

await passo('06-aula-concluida', async () => {
  await p.click('text=Marcar como concluída')
  await p.waitForSelector('text=Aula concluída', { timeout: 10000 })
})

await passo('07-anotacao', async () => {
  await p.fill('textarea[name=corpo]', 'Anotação criada pelo teste automatizado.')
  await p.click('section:has-text("Anotações") button[type=submit]')
  await p.waitForSelector('text=Anotação criada pelo teste automatizado.', { timeout: 10000 })
})

await passo('08-chat', async () => {
  await p.goto(`${BASE}/chat`, { waitUntil: 'networkidle' })
  await p.waitForSelector('text=ao vivo', { timeout: 15000 })
  await p.fill('textarea', 'mensagem do teste automatizado')
  await p.keyboard.press('Enter')
  // Se aparecer sem recarregar, o SSE entregou.
  await p.waitForSelector('text=mensagem do teste automatizado', { timeout: 15000 })
})

await passo('09-busca', async () => {
  await p.goto(`${BASE}/busca?q=dicionario`, { waitUntil: 'networkidle' })
})

await passo('10-anotacoes', async () => {
  await p.goto(`${BASE}/anotacoes`, { waitUntil: 'networkidle' })
})

await passo('11-materiais', async () => {
  await p.goto(`${BASE}/arquivos`, { waitUntil: 'networkidle' })
})

await passo('12-turma', async () => {
  await p.goto(`${BASE}/turma`, { waitUntil: 'networkidle' })
})

await passo('13-perfil', async () => {
  await p.goto(`${BASE}/perfil`, { waitUntil: 'networkidle' })
})

await passo('14-mobile', async () => {
  await p.setViewportSize({ width: 390, height: 844 })
  await p.goto(`${BASE}/aulas/listas`, { waitUntil: 'networkidle' })
})

await passo('15-tema-escuro', async () => {
  await p.setViewportSize({ width: 1440, height: 950 })
  await p.goto(`${BASE}/`)
  await p.evaluate(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('tema', 'escuro')
  })
  await p.waitForTimeout(400)
})

await navegador.close()

if (erros.length) {
  console.error('\nerros de console/página:')
  for (const e of [...new Set(erros)]) console.error('  -', e)
  process.exit(1)
}
console.log(`\ntudo ok — screenshots em ${SAIDA} (conta de teste: ${email})`)
