import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'FIAP Community · Plataforma de Estudos', template: '%s · FIAP Community' },
  description: 'Plataforma de estudos feita por alunos: aulas, anotações, materiais e chat.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f0ee' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f10' },
  ],
}

// Aplica o tema antes da primeira pintura: sem isso a tela pisca branco para
// quem usa escuro.
const TEMA = `try{var t=localStorage.getItem('tema')||'sistema';
if(t==='escuro'||(t==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches))
document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
