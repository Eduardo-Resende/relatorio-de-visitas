import { describe, expect, it } from 'vitest'
import { completarDdd, formatarTelefone, mascararDigitacaoTelefone } from '../lib/telefone'

describe('utilitários de telefone', () => {
  it('acrescenta DDD padrão se tiver 8 ou 9 dígitos', () => {
    expect(completarDdd('988887777', '62')).toBe('62988887777')
    expect(completarDdd('33334444', '62')).toBe('6233334444')
    expect(completarDdd('62988887777', '62')).toBe('62988887777')
    expect(completarDdd('', '62')).toBeUndefined()
  })

  it('formata telefones com DDD', () => {
    expect(formatarTelefone('62988887777')).toBe('(62) 98888-7777')
    expect(formatarTelefone('6233334444')).toBe('(62) 3333-4444')
  })

  it('aplica máscara progressiva durante digitação', () => {
    expect(mascararDigitacaoTelefone('6')).toBe('(6')
    expect(mascararDigitacaoTelefone('62')).toBe('(62')
    expect(mascararDigitacaoTelefone('629')).toBe('(62) 9')
    expect(mascararDigitacaoTelefone('62988887777')).toBe('(62) 98888-7777')
  })
})
