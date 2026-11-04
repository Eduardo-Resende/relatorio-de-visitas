import { describe, expect, it } from 'vitest'
import {
  TAMANHOS_FONTE,
  TAMANHO_FONTE_PADRAO,
  proximoTamanho,
  tamanhoValido,
} from '../lib/fonte'

describe('tamanho da letra', () => {
  it('o tamanho padrão é pelo menos 20px', () => {
    expect(TAMANHO_FONTE_PADRAO).toBeGreaterThanOrEqual(20)
    expect(Math.min(...TAMANHOS_FONTE)).toBeGreaterThanOrEqual(20)
  })

  it('aceita só tamanhos permitidos e usa o padrão para lixo', () => {
    expect(tamanhoValido('28')).toBe(28)
    expect(tamanhoValido(null)).toBe(TAMANHO_FONTE_PADRAO)
    expect(tamanhoValido('abc')).toBe(TAMANHO_FONTE_PADRAO)
    expect(tamanhoValido(10)).toBe(20)
    expect(tamanhoValido(999)).toBe(32)
    expect(tamanhoValido(25)).toBe(24)
  })

  it('A+ e A- andam um degrau e param nos limites', () => {
    expect(proximoTamanho(20, 1)).toBe(24)
    expect(proximoTamanho(24, -1)).toBe(20)
    expect(proximoTamanho(20, -1)).toBe(20)
    expect(proximoTamanho(32, 1)).toBe(32)
  })
})
