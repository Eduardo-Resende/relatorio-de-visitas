/** Tira os acentos: "Conceição" vira "Conceicao". */
export function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '')
}

/** Tira espaços do começo e do fim e troca sequências de espaços por um só. */
export function limparEspacos(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

/** Forma usada para comparar textos: sem acentos, sem espaços extras e em minúsculas. */
export function normalizarTexto(texto: string): string {
  return limparEspacos(removerAcentos(texto)).toLowerCase()
}

/** Deixa só os números: "(62) 99999-9999" vira "62999999999". */
export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

/** Compara nomes em ordem alfabética do português, ignorando acentos e maiúsculas. */
export function compararTexto(a: string, b: string): number {
  return normalizarTexto(a).localeCompare(normalizarTexto(b), 'pt-BR')
}
