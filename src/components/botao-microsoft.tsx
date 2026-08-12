import { signIn } from '@/lib/auth'

export function BotaoMicrosoft() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('microsoft-entra-id', { redirectTo: '/' })
      }}
    >
      <button className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border font-medium transition-colors hover:bg-[var(--painel-2)]">
        <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden>
          <path fill="#f35325" d="M1 1h10v10H1z" />
          <path fill="#81bc06" d="M12 1h10v10H12z" />
          <path fill="#05a6f0" d="M1 12h10v10H1z" />
          <path fill="#ffba08" d="M12 12h10v10H12z" />
        </svg>
        Entrar com Outlook FIAP
      </button>
    </form>
  )
}
