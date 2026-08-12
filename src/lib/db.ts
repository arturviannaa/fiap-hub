import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool } from 'pg'

// Pool unico por processo. globalThis porque o hot reload do dev recarrega o
// modulo e sem isso vazaria um pool por edicao.
const g = globalThis as typeof globalThis & { _pool?: Pool; _schema?: Promise<void> }

export const pool =
  g._pool ??
  (g._pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  }))

// Schema aplicado uma vez por processo, no primeiro acesso. O arquivo e
// idempotente, entao isso substitui uma ferramenta de migration inteira.
function schemaPronto() {
  return (g._schema ??= pool
    .query(readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8'))
    .then(() => undefined))
}

export async function sql<T = any>(texto: string, valores: unknown[] = []): Promise<T[]> {
  await schemaPronto()
  const r = await pool.query(texto, valores)
  return r.rows as T[]
}

export async function um<T = any>(texto: string, valores: unknown[] = []): Promise<T | null> {
  const linhas = await sql<T>(texto, valores)
  return linhas[0] ?? null
}
