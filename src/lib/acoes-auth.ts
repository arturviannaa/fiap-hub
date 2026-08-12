'use server'

import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { sql, um } from './db'
import { acharOuCriar, dominioPermitido, dominiosTexto, signIn } from './auth'

export type EstadoForm = { erro?: string } | null

export async function entrar(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const email = String(dados.get('email') || '').trim()
  const senha = String(dados.get('senha') || '')
  if (!dominioPermitido(email)) return { erro: `Use seu e-mail institucional (${dominiosTexto}).` }
  try {
    await signIn('credentials', { email, senha, redirectTo: '/' })
  } catch (e) {
    if (e instanceof AuthError) return { erro: 'E-mail ou senha incorretos.' }
    throw e // redirect do Next passa por aqui: nao pode ser engolido
  }
  return null
}

export async function cadastrar(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const email = String(dados.get('email') || '').trim().toLowerCase()
  const nome = String(dados.get('nome') || '').trim()
  const senha = String(dados.get('senha') || '')
  const convite = String(dados.get('convite') || '').trim()

  if (!nome || nome.length < 2) return { erro: 'Escreva seu nome completo.' }
  if (!dominioPermitido(email)) return { erro: `Só e-mail institucional (${dominiosTexto}).` }
  if (senha.length < 8) return { erro: 'A senha precisa de pelo menos 8 caracteres.' }
  if (convite !== (process.env.CODIGO_TURMA || 'fiap')) return { erro: 'Código da turma inválido.' }

  const jaExiste = await um('SELECT 1 FROM usuarios WHERE email = $1', [email])
  if (jaExiste) return { erro: 'Esse e-mail já tem conta. Faça login.' }

  const conta = await acharOuCriar(email, nome, 'senha')
  await sql('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [await bcrypt.hash(senha, 12), conta!.id])

  try {
    await signIn('credentials', { email, senha, redirectTo: '/' })
  } catch (e) {
    if (e instanceof AuthError) return { erro: 'Conta criada, mas o login falhou. Tente entrar.' }
    throw e
  }
  return null
}
