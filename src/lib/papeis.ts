/** Tags de perfil. Fica fora de acoes.ts porque um arquivo 'use server'
 *  só pode exportar funções async. */
export const PAPEIS = ['aluno', 'professor', 'admin'] as const

export type Papel = (typeof PAPEIS)[number]
