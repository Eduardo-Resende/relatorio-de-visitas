import { somenteDigitos } from './texto'

/**
 * Se o usuário digitou apenas 8 ou 9 dígitos (sem o DDD), acrescenta o DDD padrão.
 */
export function completarDdd(telefone: string | undefined, dddPadrao: string = '62'): string | undefined {
  const digitos = somenteDigitos(telefone ?? '')
  if (!digitos) return undefined
  if (digitos.length === 8 || digitos.length === 9) {
    return `${dddPadrao}${digitos}`
  }
  return digitos
}

/**
 * Formata um número de telefone com máscara visual (62) 99999-9999 ou (62) 3333-4444.
 */
export function formatarTelefone(telefone: string | undefined): string {
  const digitos = somenteDigitos(telefone ?? '')
  if (!digitos) return ''

  if (digitos.length === 11) {
    // (62) 99999-9999
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }
  if (digitos.length === 10) {
    // (62) 3333-4444
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  if (digitos.length === 9) {
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
  }
  if (digitos.length === 8) {
    return `${digitos.slice(0, 4)}-${digitos.slice(4)}`
  }

  return digitos
}

/**
 * Aplica máscara progressiva enquanto o usuário digita no campo de texto.
 */
export function mascararDigitacaoTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
