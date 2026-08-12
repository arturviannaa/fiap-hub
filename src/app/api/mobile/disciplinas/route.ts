import { disciplinas } from '@/lib/conteudo'
import { naoAutorizado, usuarioDoToken } from '@/lib/mobile-auth'

// Lista de disciplinas para o app montar o seletor.
export async function GET(req: Request) {
  if (!(await usuarioDoToken(req))) return naoAutorizado()
  return Response.json({ disciplinas: disciplinas() })
}
