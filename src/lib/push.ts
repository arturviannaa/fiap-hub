import { readFileSync, existsSync } from 'node:fs'
import { sql } from './db'

// Envio de push via FCM. A credencial (service account) fica num arquivo fora
// do git, apontado por FIREBASE_CRED_PATH. Sem o arquivo, o push vira no-op —
// o resto do app funciona igual.
const g = globalThis as typeof globalThis & { _fcm?: any }

function messaging() {
  const caminho = process.env.FIREBASE_CRED_PATH
  if (!caminho || !existsSync(caminho)) return null
  if (!g._fcm) {
    // require tardio: só carrega o firebase-admin se for realmente usar push.
    const admin = require('firebase-admin')
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(caminho, 'utf8'))) })
    }
    g._fcm = admin.messaging()
  }
  return g._fcm
}

export async function enviarPush(
  usuarioIds: number[],
  notif: { titulo: string; corpo: string; data?: Record<string, string> },
) {
  const m = messaging()
  if (!m || usuarioIds.length === 0) return
  const linhas = await sql<{ token: string }>(
    'SELECT token FROM push_tokens WHERE usuario_id = ANY($1::int[])',
    [usuarioIds],
  )
  const tokens = linhas.map((l) => l.token)
  if (tokens.length === 0) return

  const resp = await m
    .sendEachForMulticast({
      tokens,
      notification: { title: notif.titulo, body: notif.corpo },
      data: notif.data || {},
      android: { priority: 'high' },
    })
    .catch(() => null)

  // Limpa tokens que o FCM disse estarem inválidos (app desinstalado etc).
  if (resp?.responses) {
    const mortos: string[] = []
    resp.responses.forEach((r: any, i: number) => {
      const cod = r.error?.code
      if (cod === 'messaging/registration-token-not-registered' || cod === 'messaging/invalid-argument')
        mortos.push(tokens[i])
    })
    if (mortos.length) await sql('DELETE FROM push_tokens WHERE token = ANY($1::text[])', [mortos])
  }
}
