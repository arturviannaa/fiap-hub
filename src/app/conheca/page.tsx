import { BotaoCopiar } from '@/components/botao-copiar'

// Página pública de divulgação: feita pra ser projetada na sala ou aberta no
// celular de quem ainda não tem conta. Fica fora do (app) de propósito — quem
// chega aqui ainda não está logado. Ver PUBLICAS no middleware.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Conheça' }

// O QR e um SVG estatico em public/ (nenhuma dependencia nova em producao).
// Se o dominio mudar, regenere com:
//   npx qrcode -t svg -o public/qr-conheca.svg -e H -m 0 "https://novo.dominio"
const SITE = 'https://fiap.pervian.tech'

export default function Conheca() {
  // Mesma fonte de verdade do cadastro (acoes-auth.ts), incluindo o fallback.
  const codigo = process.env.CODIGO_TURMA || 'fiap'

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #ed145b, transparent 70%)' }}
      />

      <div className="painel relative w-full max-w-md p-6 text-center sm:p-8">
        <div className="flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-fiap-400 to-fiap-500 font-bold text-white shadow-lg shadow-fiap-500/40">
            F
          </span>
          <span className="font-semibold">FIAP Community</span>
        </div>

        <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Aponte a câmera e
          <span className="text-fiap-500"> entre na turma.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm suave">
          As aulas de Python organizadas por assunto, anotações da turma, materiais e chat ao vivo.
        </p>

        {/* Fundo branco fixo nos dois temas: QR escuro sobre claro é o que a
            câmera lê bem — inverter derruba a leitura em alguns celulares. */}
        <div className="mx-auto mt-7 w-full max-w-[17rem] rounded-3xl bg-white p-4 shadow-lg shadow-black/5 sm:p-5">
          <img
            src="/qr-conheca.svg"
            alt={`QR code para ${SITE}`}
            className="block h-auto w-full"
            width={272}
            height={272}
          />
        </div>
        <a
          href={SITE}
          className="mt-3 inline-block font-mono text-xs suave underline underline-offset-4 transition-colors hover:text-fiap-500"
        >
          fiap.pervian.tech
        </a>

        <div className="mt-7 border-t pt-6">
          <p className="text-xs font-medium uppercase tracking-wider suave">Código da turma</p>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border bg-[var(--painel-2)] px-4 py-3">
            <span className="font-mono text-2xl font-semibold tracking-[0.3em] sm:text-3xl">{codigo}</span>
            <BotaoCopiar valor={codigo} />
          </div>
          <p className="mt-2.5 text-xs suave">
            Peça esse código no cadastro, junto do seu e-mail <span className="whitespace-nowrap">@fiap.com.br</span> ou{' '}
            <span className="whitespace-nowrap">@alunos.fiap.com.br</span>.
          </p>
        </div>
      </div>

      <p className="relative mt-6 text-center text-xs suave">
        Feito por alunos da FIAP · projeto independente, não oficial
      </p>
    </main>
  )
}
