// Defesas contra abuso. Tudo em memoria de propósito: e um container só, e um
// limitador em memoria que responde em nanossegundos vale mais que um Redis
// que ninguem mantem.
// ponytail: estado por processo — se um dia rodar em mais de uma réplica, os
// limites viram por-réplica; nesse dia troque o Map por Redis.

/** Intervalo minimo entre duas mensagens da mesma pessoa. */
export const COOLDOWN_CHAT_MS = 10_000

type Balde = { fichas: number; recarga: number }

const baldes = new Map<string, Balde>()

// Faxina preguicosa: so quando o Map cresce, sem timer rodando à toa.
function faxina(agora: number) {
  if (baldes.size < 5000) return
  for (const [k, b] of baldes) if (agora - b.recarga > 600_000) baldes.delete(k)
}

/**
 * Token bucket: `capacidade` requisicoes, recarregando `capacidade` a cada
 * `janelaMs`. Devolve false quando estourou.
 */
export function permitido(chave: string, capacidade: number, janelaMs: number) {
  const agora = Date.now()
  faxina(agora)
  const b = baldes.get(chave)
  if (!b) {
    baldes.set(chave, { fichas: capacidade - 1, recarga: agora })
    return true
  }
  const decorrido = agora - b.recarga
  b.fichas = Math.min(capacidade, b.fichas + (decorrido * capacidade) / janelaMs)
  b.recarga = agora
  if (b.fichas < 1) return false
  b.fichas -= 1
  return true
}

/** Segundos que ainda faltam para a proxima acao, ou 0 se pode agir. */
export function esperaRestante(chave: string, intervaloMs: number) {
  const agora = Date.now()
  const ultimo = ultimos.get(chave) ?? 0
  const falta = intervaloMs - (agora - ultimo)
  return falta > 0 ? Math.ceil(falta / 1000) : 0
}

export function marcarAcao(chave: string) {
  faxinaUltimos()
  ultimos.set(chave, Date.now())
}

const ultimos = new Map<string, number>()
function faxinaUltimos() {
  if (ultimos.size < 5000) return
  const corte = Date.now() - 600_000
  for (const [k, t] of ultimos) if (t < corte) ultimos.delete(k)
}

const MAX_CARACTERES = 1200
const MAX_LINHAS = 25

/**
 * Higieniza texto de mensagem/anotacao. Barra as tres formas de travar o
 * navegador de quem le: texto quilometrico, mil quebras de linha e "zalgo"
 * (pilha de acentos combinantes sobre a mesma letra).
 */
export function limparTexto(bruto: string, maxCaracteres = MAX_CARACTERES) {
  let t = bruto.normalize('NFC')

  // no maximo 2 diacriticos combinantes por caractere base (mata o "zalgo")
  t = t.replace(/(\p{M}{2})\p{M}+/gu, '$1')
  // controles, zero-width e marcas bidi usadas para inflar a mensagem
  t = t.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u206f\ufeff]/g, '')
  // sequencias absurdas do mesmo caractere ("aaaa..." com mil letras)
  t = t.replace(/(.)\1{29,}/gu, (_m, c) => String(c).repeat(30))
  // colapsa muros de linhas em branco
  t = t.replace(/\n{4,}/g, '\n\n\n')

  const linhas = t.split('\n')
  if (linhas.length > MAX_LINHAS) t = linhas.slice(0, MAX_LINHAS).join('\n')

  return t.trim().slice(0, maxCaracteres)
}

/** IP do cliente. O nginx sobrescreve X-Forwarded-For, então não é forjável. */
export function ipDe(req: Request) {
  const xff = req.headers.get('x-forwarded-for')
  return (xff?.split(',')[0] || req.headers.get('x-real-ip') || 'desconhecido').trim()
}
