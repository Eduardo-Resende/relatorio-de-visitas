import type { DadosEndereco } from '../db/tipos'

/**
 * Formata um endereço de forma amigável e legível.
 * Exemplo: "Rua das Flores, QD 10, LT 5, Nº 120 - Setor Central"
 */
export function formatarEndereco(e: Partial<DadosEndereco> | undefined): string {
  if (!e) return ''
  const partes: string[] = []

  if (e.logradouro) partes.push(e.logradouro)
  if (e.quadra) partes.push(`QD ${e.quadra}`)
  if (e.lote) partes.push(`LT ${e.lote}`)
  if (e.numero) partes.push(`Nº ${e.numero}`)
  if (e.complemento) partes.push(`(${e.complemento})`)

  const ruaEDetalhes = partes.join(', ')
  if (e.setor) {
    return ruaEDetalhes ? `${ruaEDetalhes} - ${e.setor}` : e.setor
  }
  return ruaEDetalhes
}

/**
 * Verifica se os três campos de localização interna (Quadra, Lote e Número) estão todos vazios.
 */
export function estaoQuadraLoteNumeroVazios(e: Partial<DadosEndereco> | undefined): boolean {
  if (!e) return true
  const qd = e.quadra?.trim() ?? ''
  const lt = e.lote?.trim() ?? ''
  const num = e.numero?.trim() ?? ''
  return !qd && !lt && !num
}
