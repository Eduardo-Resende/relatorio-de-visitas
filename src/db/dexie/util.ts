/** Gera um identificador único (uuid). */
export function novoId(): string {
  return crypto.randomUUID()
}

/** Tira repetidos mantendo a ordem. */
export function semRepetidos<T>(itens: T[]): T[] {
  return [...new Set(itens)]
}
