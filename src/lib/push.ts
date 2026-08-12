import { readFileSync, existsSync } from 'node:fs'
// API modular do firebase-admin, com import estático (não require dinâmico) para
// o Next incluir no build standalone. serverExternalPackages evita o bundling.
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'
import { sql } from './db'

// Envio de push via FCM. A credencial (service account) fica num arquivo fora
// do git, apontado por FIREBASE_CRED_PATH. Sem o arquivo, o push vira no-op.
const g = globalThis as typeof globalThis & { _fcm?: Messaging }

function messaging(): Messaging | null {
  const caminho = process.env.FIREBASE_CRED_PATH
  if (!caminho || !existsSync(caminho)) return null
  if (!g._fcm) {
    if (!getApps().length) initializeApp({ credential: cert(JSON.parse(readFileSync(caminho, 'utf8'))) })
    g._fcm = getMessaging()
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
