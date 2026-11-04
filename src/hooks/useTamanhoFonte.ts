import { createContext, useContext } from 'react'

export interface ContextoFonte {
  tamanho: number
  aumentar: () => void
  diminuir: () => void
  podeAumentar: boolean
  podeDiminuir: boolean
}

export const ContextoTamanhoFonte = createContext<ContextoFonte | null>(null)

export function useTamanhoFonte(): ContextoFonte {
  const ctx = useContext(ContextoTamanhoFonte)
  if (!ctx) throw new Error('useTamanhoFonte precisa estar dentro de TamanhoFonteProvider')
  return ctx
}
