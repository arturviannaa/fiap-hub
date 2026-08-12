import { cookies } from 'next/headers'
import { DISCIPLINA_PADRAO, ehDisciplina } from './conteudo'

export const COOKIE_DISC = 'disc'

// Disciplina ativa (cookie). null = ainda não escolheu → mostrar seletor.
export async function discAtiva(): Promise<string | null> {
  const slug = (await cookies()).get(COOKIE_DISC)?.value
  return slug && ehDisciplina(slug) ? slug : null
}

// Igual, mas cai no padrão (python) em vez de null — pra contextos que não
// devem redirecionar (ex.: painel inicial antes de escolher).
export async function discOuPadrao(): Promise<string> {
  return (await discAtiva()) ?? DISCIPLINA_PADRAO
}
