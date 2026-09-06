import Link from 'next/link'

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0e0f10] p-10 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute -left-20 top-1/4 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #ed145b, transparent 70%)' }}
        />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-fiap-400 to-fiap-500 font-bold shadow-lg shadow-fiap-500/40">
            F
          </span>
          <span className="font-semibold">FIAP Community</span>
        </Link>

        <div className="relative my-auto max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Todo o conteúdo da disciplina,
            <span className="text-fiap-500"> num lugar só.</span>
          </h1>
          <p className="mt-4 text-white/60">
            As aulas de Python organizadas por assunto, com os exemplos rodando na tela, anotações da turma,
            materiais compartilhados e chat ao vivo.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/70">
            {[
              'Conteúdo sincronizado do repositório da professora',
              'Anotações públicas e privadas em cada aula',
              'Materiais da turma com controle de acesso',
              'Chat em tempo real por canal',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-fiap-500" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/30">Feito por alunos da FIAP · projeto independente, não oficial</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="painel w-full max-w-sm p-6 sm:p-8">{children}</div>
      </div>
    </div>
  )
}
