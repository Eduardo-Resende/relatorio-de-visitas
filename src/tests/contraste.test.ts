/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// O CSS é lido como texto, então o teste confere as cores que o app realmente usa.
const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

function cor(nome: string): string {
  const m = css.match(new RegExp(`--color-${nome}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`Cor não encontrada no tema: ${nome}`)
  return m[1]
}

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuro + 0.05)
}

const BRANCO = '#ffffff'

describe('contraste das cores (WCAG AA)', () => {
  // [texto, fundo]: texto normal precisa de pelo menos 4.5:1
  const pares: [string, string, string][] = [
    ['texto', cor('texto'), cor('fundo')],
    ['texto no papel', cor('texto'), cor('papel')],
    ['texto suave', cor('texto-suave'), cor('fundo')],
    ['texto suave no papel', cor('texto-suave'), cor('papel')],
    ['texto suave em caixa clara', cor('texto-suave'), cor('primaria-clara')],
    ['branco na primária', BRANCO, cor('primaria')],
    ['branco na primária escura', BRANCO, cor('primaria-escura')],
    ['branco no perigo', BRANCO, cor('perigo')],
    ['branco no perigo escuro', BRANCO, cor('perigo-escura')],
    ['branco no sucesso', BRANCO, cor('sucesso')],
    ['branco no sucesso escuro', BRANCO, cor('sucesso-escura')],
    ['primária no papel', cor('primaria'), cor('papel')],
    ['primária na primária clara', cor('primaria'), cor('primaria-clara')],
    ['perigo no fundo', cor('perigo'), cor('fundo')],
    ['perigo no papel', cor('perigo'), cor('papel')],
    ['perigo na caixa clara', cor('perigo'), cor('perigo-clara')],
    ['sucesso na caixa clara', cor('sucesso'), cor('sucesso-clara')],
    ['atenção na caixa clara', cor('atencao'), cor('atencao-clara')],
    ['texto na caixa de atenção', cor('texto'), cor('atencao-clara')],
  ]

  it.each(pares)('%s tem contraste de pelo menos 4.5:1', (_nome, texto, fundo) => {
    expect(contraste(texto, fundo)).toBeGreaterThanOrEqual(4.5)
  })

  it('a borda dos campos se destaca (pelo menos 3:1) do fundo e do papel', () => {
    expect(contraste(cor('borda'), cor('fundo'))).toBeGreaterThanOrEqual(3)
    expect(contraste(cor('borda'), cor('papel'))).toBeGreaterThanOrEqual(3)
  })
})
