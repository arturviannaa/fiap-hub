'use client'

import { useEffect } from 'react'

// Bate no /api/presenca ao montar e a cada 45s enquanto a aba está aberta,
// mantendo "ativo agora" real. visibilitychange evita pings de aba escondida.
export function Presenca() {
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === 'visible')
        fetch('/api/presenca', { method: 'POST', keepalive: true }).catch(() => {})
    }
    ping()
    const t = setInterval(ping, 45000)
    document.addEventListener('visibilitychange', ping)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', ping)
    }
  }, [])
  return null
}
