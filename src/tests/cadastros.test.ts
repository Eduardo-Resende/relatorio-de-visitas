import { describe, expect, it } from 'vitest'
import { estaoQuadraLoteNumeroVazios, formatarEndereco } from '../lib/endereco'
import { completarDdd, formatarTelefone, mascararDigitacaoTelefone } from '../lib/telefone'
import { ENDERECO, criarBancoDeTeste } from './ajudas/bancoDeTeste'

describe('regras da Fase 3 - cadastros e usabilidade', () => {
  it('telefone: completa DDD 62 se tiver 8 ou 9 dígitos', () => {
    expect(completarDdd('988887777', '62')).toBe('62988887777')
    expect(completarDdd('33334444', '62')).toBe('6233334444')
    expect(completarDdd('62988887777', '62')).toBe('62988887777')
    expect(completarDdd(undefined, '62')).toBeUndefined()
  })

  it('telefone: formatação e máscara de digitação', () => {
    expect(formatarTelefone('62988887777')).toBe('(62) 98888-7777')
    expect(formatarTelefone('6233334444')).toBe('(62) 3333-4444')
    expect(mascararDigitacaoTelefone('62988887777')).toBe('(62) 98888-7777')
  })

  it('endereço: aceita S/N e formata de modo legível', () => {
    const end = {
      logradouro: 'Rua das Flores',
      quadra: '10',
      lote: '5',
      numero: 'S/N',
      setor: 'Setor Central',
    }
    expect(formatarEndereco(end)).toBe('Rua das Flores, QD 10, LT 5, Nº S/N - Setor Central')
  })

  it('endereço: identifica quando QD, LT e NUM estão todos vazios', () => {
    expect(estaoQuadraLoteNumeroVazios({ logradouro: 'Rua 1', setor: 'Centro' })).toBe(true)
    expect(
      estaoQuadraLoteNumeroVazios({
        logradouro: 'Rua 1',
        setor: 'Centro',
        quadra: '',
        lote: ' ',
        numero: '',
      }),
    ).toBe(true)
    expect(
      estaoQuadraLoteNumeroVazios({
        logradouro: 'Rua 1',
        setor: 'Centro',
        numero: '12',
      }),
    ).toBe(false)
  })

  it('diaconisa arquivada: pode ser reativada para voltar a ser usada', async () => {
    const { repos } = criarBancoDeTeste()
    const d = await repos.diaconisas.criar({ nome: 'Irene Martins' })
    await repos.diaconisas.arquivar(d.id)

    expect(await repos.diaconisas.listar()).toHaveLength(0)
    expect(await repos.diaconisas.listar({ incluirArquivadas: true })).toHaveLength(1)

    await repos.diaconisas.reativar(d.id)
    const ativas = await repos.diaconisas.listar()
    expect(ativas).toHaveLength(1)
    expect(ativas[0].nome).toBe('Irene Martins')
  })

  it('pessoa visitada: endereço compartilhado lista coabitantes e permite atualização em grupo', async () => {
    const { repos } = criarBancoDeTeste()
    const donaMaria = await repos.pessoas.criar({
      nome: 'Maria da Silva',
      endereco: ENDERECO,
    })
    const seuJoao = await repos.pessoas.criar({
      nome: 'João da Silva',
      enderecoId: donaMaria.enderecoId,
    })

    const moradores = await repos.pessoas.moradoresDoEndereco(donaMaria.enderecoId)
    expect(moradores.map((m) => m.nome)).toEqual(['João da Silva', 'Maria da Silva'])

    // Atualiza endereço para todos
    await repos.enderecos.atualizar(donaMaria.enderecoId, {
      ...ENDERECO,
      logradouro: 'Avenida Brasil',
    })

    const mariaAtualizada = await repos.pessoas.obterComEndereco(donaMaria.id)
    const joaoAtualizado = await repos.pessoas.obterComEndereco(seuJoao.id)
    expect(mariaAtualizada?.endereco.logradouro).toBe('Avenida Brasil')
    expect(joaoAtualizado?.endereco.logradouro).toBe('Avenida Brasil')
  })

  it('pessoa visitada: desmembrar endereço compartilhado', async () => {
    const { repos } = criarBancoDeTeste()
    const p1 = await repos.pessoas.criar({ nome: 'Ana', endereco: ENDERECO })
    const p2 = await repos.pessoas.criar({ nome: 'Bruno', enderecoId: p1.enderecoId })

    // Bruno se muda sozinho
    await repos.pessoas.mudarEndereco([p2.id], {
      endereco: { ...ENDERECO, logradouro: 'Rua Nova', numero: '20' },
    })

    const p1Depois = await repos.pessoas.obterComEndereco(p1.id)
    const p2Depois = await repos.pessoas.obterComEndereco(p2.id)
    expect(p1Depois?.endereco.logradouro).toBe('Rua das Flores')
    expect(p2Depois?.endereco.logradouro).toBe('Rua Nova')
    expect(p1Depois?.enderecoId).not.toBe(p2Depois?.enderecoId)
  })
})
