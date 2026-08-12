import {
  Boxes,
  Dumbbell,
  FileText,
  FunctionSquare,
  Layers,
  Package,
  Repeat,
  Split,
  Sparkles,
  Terminal,
} from 'lucide-react'

const MAPA: Record<string, any> = {
  terminal: Terminal,
  branch: Split,
  repeat: Repeat,
  layers: Layers,
  function: FunctionSquare,
  file: FileText,
  package: Package,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
}

export function IconeModulo({ nome, size = 20 }: { nome: string; size?: number }) {
  const Icone = MAPA[nome] || Boxes
  return <Icone size={size} />
}
