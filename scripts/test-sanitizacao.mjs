// Check do sanitizador: `node scripts/test-sanitizacao.mjs`.
// O HTML das aulas vem de notebooks de terceiros e e injetado com
// dangerouslySetInnerHTML. Se algum destes casos passar, tem XSS no ar.
import assert from 'node:assert/strict'
import { limparHtml } from './sanitiza.mjs'

const naoPassa = (html, oQue) => {
  const limpo = limparHtml(html)
  assert.ok(!/<script/i.test(limpo), `${oQue}: sobrou <script> -> ${limpo}`)
  assert.ok(!/<iframe/i.test(limpo), `${oQue}: sobrou <iframe> -> ${limpo}`)
  assert.ok(!/on\w+\s*=/i.test(limpo), `${oQue}: sobrou handler inline -> ${limpo}`)
  assert.ok(!/javascript:/i.test(limpo), `${oQue}: sobrou javascript: -> ${limpo}`)
  return limpo
}

// --- o que NAO pode passar ---
naoPassa('<script>alert(1)</script>', 'script direto')
naoPassa('<img src=x onerror="alert(1)">', 'onerror em img')
naoPassa('<a href="javascript:alert(1)">x</a>', 'href javascript:')
naoPassa('<div onclick="alert(1)">x</div>', 'onclick')
naoPassa('<iframe src="//evil.tld"></iframe>', 'iframe')
naoPassa('<svg/onload=alert(1)>', 'svg onload')
naoPassa('<body onload=alert(1)>', 'body onload')
naoPassa('<form action="//evil.tld"><input name=senha></form>', 'form de phishing')
naoPassa('<a href="vbscript:msgbox(1)">x</a>', 'vbscript:')
naoPassa('<style>body{display:none}</style>', 'style tag')
naoPassa('<object data="//evil.tld"></object>', 'object')
naoPassa('<img src="javascript:alert(1)">', 'src javascript:')

// script dentro de tabela (o caso realista: notebook com output HTML montado a mao)
const tabelaSuja = naoPassa(
  '<table class="dataframe"><tr><td>ok<script>alert(1)</script></td></tr></table>',
  'script dentro de tabela',
)
assert.match(tabelaSuja, /<td>ok<\/td>/, 'a celula da tabela deveria sobreviver')

// --- o que PRECISA continuar passando (senao quebra as aulas) ---
const pandas = limparHtml(
  '<div><style scoped>.dataframe{}</style><table border="1" class="dataframe">' +
    '<thead><tr style="text-align: right;"><th></th><th>nome</th></tr></thead>' +
    '<tbody><tr><th>0</th><td>Ana</td></tr></tbody></table></div>',
)
assert.match(pandas, /<table[^>]*class="dataframe"/, 'pandas: tabela sumiu')
assert.match(pandas, /<thead>/, 'pandas: thead sumiu')
assert.match(pandas, /<th>nome<\/th>/, 'pandas: cabecalho sumiu')
assert.match(pandas, /<td>Ana<\/td>/, 'pandas: celula sumiu')
assert.match(pandas, /text-align:\s*right/, 'pandas: alinhamento inline sumiu')

// matplotlib inline vira <img src="data:image/png;base64,...">
const plot = limparHtml('<img src="data:image/png;base64,iVBORw0KGgo=" alt="grafico">')
assert.match(plot, /src="data:image\/png;base64,/, 'matplotlib: img data: sumiu')

// markdown normal da aula
const md = limparHtml(
  '<h2 id="intro">Intro</h2><p>texto <strong>forte</strong> e <code>codigo</code></p>' +
    '<ul><li>um</li></ul><a href="https://docs.python.org">docs</a>',
)
assert.match(md, /<h2 id="intro">/, 'markdown: heading com id sumiu (quebra o indice lateral)')
assert.match(md, /<strong>forte<\/strong>/, 'markdown: strong sumiu')
assert.match(md, /<code>codigo<\/code>/, 'markdown: code sumiu')
assert.match(md, /<li>um<\/li>/, 'markdown: lista sumiu')
assert.match(md, /href="https:\/\/docs\.python\.org"/, 'markdown: link legitimo sumiu')
assert.match(md, /rel="noopener noreferrer nofollow"/, 'markdown: link externo sem rel de seguranca')

console.log('ok: sanitizacao (12 vetores bloqueados, pandas/matplotlib/markdown preservados)')
