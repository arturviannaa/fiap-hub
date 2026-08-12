'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { removerFoto, salvarFoto } from '@/lib/acoes'
import { Avatar } from './ui'

// Avatar grande do perfil com botao de trocar/remover a foto. O upload manda
// direto (sem botao "salvar"): escolheu, subiu.
export function FotoPerfil({
  usuarioId,
  nome,
  foto,
}: {
  usuarioId: number
  nome: string
  foto: string | null
}) {
  const input = useRef<HTMLInputElement>(null)
  const [enviando, iniciar] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function enviar(arquivo: File | undefined) {
    if (!arquivo) return
    if (arquivo.size > 5 * 1024 * 1024) return setErro('Imagem maior que 5 MB.')
    setErro(null)
    const dados = new FormData()
    dados.set('foto', arquivo)
    iniciar(async () => {
      const r = await salvarFoto(dados)
      if (r?.erro) setErro(r.erro)
    })
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar nome={nome} tamanho={72} usuarioId={usuarioId} foto={foto} />
        <button
          onClick={() => input.current?.click()}
          disabled={enviando}
          className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-[var(--painel)] bg-fiap-500 text-white transition-colors hover:bg-fiap-600 disabled:opacity-60"
          aria-label="Trocar foto"
          title="Trocar foto"
        >
          {enviando ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
        </button>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => enviar(e.target.files?.[0])}
        />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">Foto de perfil</p>
        <p className="text-xs suave">JPG, PNG, WebP ou GIF, até 5 MB.</p>
        {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
        {foto && (
          <button
            onClick={() => iniciar(() => removerFoto().then(() => {}))}
            disabled={enviando}
            className="mt-1 inline-flex items-center gap-1 text-xs suave hover:text-red-500 disabled:opacity-60"
          >
            <Trash2 size={12} /> Remover foto
          </button>
        )}
      </div>
    </div>
  )
}
