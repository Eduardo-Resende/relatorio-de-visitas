export type EstadoArmazenamento = 'protegido' | 'nao-protegido' | 'indisponivel'

/**
 * Pede ao navegador para NÃO apagar os dados do app quando o aparelho estiver com pouco espaço.
 * Quando o app está instalado na tela inicial, o navegador costuma aceitar.
 */
export async function pedirArmazenamentoPersistente(): Promise<EstadoArmazenamento> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return 'indisponivel'
    if (await navigator.storage.persisted()) return 'protegido'
    return (await navigator.storage.persist()) ? 'protegido' : 'nao-protegido'
  } catch {
    return 'indisponivel'
  }
}
