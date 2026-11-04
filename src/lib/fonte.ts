/** Tamanhos de letra permitidos (em px), do normal ao enorme. */
export const TAMANHOS_FONTE = [20, 24, 28, 32] as const
export const TAMANHO_FONTE_PADRAO = 20
export const CHAVE_TAMANHO_FONTE = 'rv:tamanho-fonte'

/** Devolve um tamanho permitido: o mais próximo do valor recebido, ou o padrão se não for número. */
export function tamanhoValido(valor: unknown): number {
  const n = typeof valor === 'string' ? Number(valor) : valor
  if (typeof n !== 'number' || !Number.isFinite(n)) return TAMANHO_FONTE_PADRAO
  return TAMANHOS_FONTE.reduce((melhor, t) => (Math.abs(t - n) < Math.abs(melhor - n) ? t : melhor))
}

/** Passa para o tamanho seguinte (direcao = 1) ou anterior (direcao = -1), sem sair dos limites. */
export function proximoTamanho(atual: number, direcao: 1 | -1): number {
  const indice = TAMANHOS_FONTE.indexOf(tamanhoValido(atual) as (typeof TAMANHOS_FONTE)[number])
  const novo = Math.min(TAMANHOS_FONTE.length - 1, Math.max(0, indice + direcao))
  return TAMANHOS_FONTE[novo]
}

export function lerTamanhoSalvo(): number {
  try {
    return tamanhoValido(localStorage.getItem(CHAVE_TAMANHO_FONTE))
  } catch {
    return TAMANHO_FONTE_PADRAO
  }
}

export function salvarTamanho(tamanho: number): void {
  try {
    localStorage.setItem(CHAVE_TAMANHO_FONTE, String(tamanho))
  } catch {
    // Navegador bloqueou o armazenamento: o tamanho vale só até fechar o app.
  }
}

export function aplicarTamanho(tamanho: number): void {
  document.documentElement.style.setProperty('--tamanho-letra', `${tamanho}px`)
}
