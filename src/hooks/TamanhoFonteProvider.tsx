import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  TAMANHOS_FONTE,
  aplicarTamanho,
  lerTamanhoSalvo,
  proximoTamanho,
  salvarTamanho,
} from '../lib/fonte'
import { ContextoTamanhoFonte } from './useTamanhoFonte'

/** Guarda o tamanho da letra, aplica na página e salva a escolha no aparelho. */
export function TamanhoFonteProvider({ children }: { children: ReactNode }) {
  const [tamanho, setTamanho] = useState(lerTamanhoSalvo)

  useEffect(() => {
    aplicarTamanho(tamanho)
    salvarTamanho(tamanho)
  }, [tamanho])

  const aumentar = useCallback(() => setTamanho((t) => proximoTamanho(t, 1)), [])
  const diminuir = useCallback(() => setTamanho((t) => proximoTamanho(t, -1)), [])

  const valor = useMemo(
    () => ({
      tamanho,
      aumentar,
      diminuir,
      podeAumentar: tamanho < TAMANHOS_FONTE[TAMANHOS_FONTE.length - 1],
      podeDiminuir: tamanho > TAMANHOS_FONTE[0],
    }),
    [tamanho, aumentar, diminuir],
  )

  return <ContextoTamanhoFonte.Provider value={valor}>{children}</ContextoTamanhoFonte.Provider>
}
