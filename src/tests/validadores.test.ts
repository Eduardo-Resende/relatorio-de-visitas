import { describe, expect, it } from 'vitest'
import { ErroValidacao } from '../lib/erros'
import { compararTexto, normalizarTexto, somenteDigitos } from '../lib/texto'
import {
  enderecoDaVisita,
  validarDataIso,
  validarEndereco,
  validarNome,
  validarTelefone,
} from '../lib/validadores'

function mensagemDoErro(fn: () => unknown): string {
  try {
    fn()
  } catch (e) {
    if (e instanceof ErroValidacao) return e.message
    throw e
  }
  return ''
}

describe('texto', () => {
  it('normaliza ignorando acentos, maiúsculas e espaços extras', () => {
    expect(normalizarTexto('  María   da CONCEIÇÃO ')).toBe('maria da conceicao')
    expect(normalizarTexto('Jaçanã')).toBe('jacana')
  })

  it('extrai só os dígitos do telefone', () => {
    expect(somenteDigitos('(62) 99999-9999')).toBe('62999999999')
  })

  it('ordena em ordem alfabética sem ligar para acento', () => {
    const nomes = ['Érica', 'Ana', 'Zilda', 'beatriz']
    expect(nomes.sort(compararTexto)).toEqual(['Ana', 'beatriz', 'Érica', 'Zilda'])
  })
})

describe('validar nome', () => {
  it('limpa espaços extras', () => {
    expect(validarNome('  Maria    Silva ')).toBe('Maria Silva')
  })
  it('pede o nome quando está vazio', () => {
    expect(mensagemDoErro(() => validarNome('   '))).toBe('Faltou escrever o nome.')
    expect(mensagemDoErro(() => validarNome(undefined))).toBe('Faltou escrever o nome.')
  })
  it('recusa nome curto', () => {
    expect(mensagemDoErro(() => validarNome('Ma'))).toMatch(/muito curto/)
  })
  it('recusa nome só com números', () => {
    expect(mensagemDoErro(() => validarNome('12345'))).toMatch(/só números/)
  })
})

describe('validar telefone', () => {
  it('aceita vazio (opcional)', () => {
    expect(validarTelefone('')).toBeUndefined()
    expect(validarTelefone(undefined)).toBeUndefined()
  })
  it('aceita 10 ou 11 dígitos, com ou sem máscara', () => {
    expect(validarTelefone('(62) 99999-9999')).toBe('62999999999')
    expect(validarTelefone('6233334444')).toBe('6233334444')
  })
  it('recusa quantidade errada de dígitos', () => {
    expect(mensagemDoErro(() => validarTelefone('99999-9999'))).toMatch(/DDD/)
    expect(mensagemDoErro(() => validarTelefone('629999999999'))).toMatch(/DDD/)
  })
})

describe('validar endereço', () => {
  it('exige rua e setor', () => {
    expect(mensagemDoErro(() => validarEndereco({ setor: 'Centro' }))).toBe('Faltou escrever a rua.')
    expect(mensagemDoErro(() => validarEndereco({ logradouro: 'Rua 1' }))).toBe('Faltou escrever o setor.')
  })
  it('QD, LT e NUM são opcionais e NUM aceita S/N', () => {
    const e = validarEndereco({ logradouro: ' Rua  1 ', setor: 'Centro', numero: 'S/N' })
    expect(e).toEqual({ logradouro: 'Rua 1', quadra: '', lote: '', numero: 'S/N', setor: 'Centro' })
  })
  it('a cópia para a visita não leva o complemento', () => {
    const e = enderecoDaVisita({ logradouro: 'Rua 1', setor: 'Centro', complemento: 'Casa azul' })
    expect('complemento' in e).toBe(false)
  })
})

describe('validar data', () => {
  it('aceita datas reais', () => {
    expect(validarDataIso('2026-02-28')).toBe('2026-02-28')
    expect(validarDataIso('2028-02-29')).toBe('2028-02-29')
  })
  it('recusa datas que não existem ou mal formatadas', () => {
    expect(() => validarDataIso('2026-02-30')).toThrow(ErroValidacao)
    expect(() => validarDataIso('26-02-2026')).toThrow(ErroValidacao)
    expect(() => validarDataIso('')).toThrow(ErroValidacao)
  })
})
