import { describe, expect, it } from 'vitest'
import { ErroNomeDuplicado, ErroValidacao } from '../lib/erros'
import type { Diaconisa, PessoaVisitada } from '../db/tipos'
import { ENDERECO, criarBancoDeTeste } from './ajudas/bancoDeTeste'

describe('duplicados de nome', () => {
  it('diaconisa: acha duplicado ignorando acentos, maiúsculas e espaços', async () => {
    const { repos } = criarBancoDeTeste()
    const maria = await repos.diaconisas.criar({ nome: 'Maria Silva' })

    for (const variante of ['maria silva', '  MARIA   SILVA ', 'María Silva']) {
      const erro = await repos.diaconisas.criar({ nome: variante }).catch((e: unknown) => e)
      expect(erro).toBeInstanceOf(ErroNomeDuplicado)
      expect((erro as ErroNomeDuplicado<Diaconisa>).existente.id).toBe(maria.id)
      expect((erro as Error).message).toBe('Já existe uma Maria Silva. Quer usar a que já existe?')
    }
    expect(await repos.diaconisas.listar()).toHaveLength(1)
  })

  it('diaconisa: permite duplicado só quando a usuária confirma', async () => {
    const { repos } = criarBancoDeTeste()
    await repos.diaconisas.criar({ nome: 'Ana Paula' })
    await repos.diaconisas.criar({ nome: 'Ana Paula' }, { permitirDuplicado: true })
    expect(await repos.diaconisas.listar()).toHaveLength(2)
  })

  it('diaconisa: duplicado também vale contra uma arquivada', async () => {
    const { repos } = criarBancoDeTeste()
    const d = await repos.diaconisas.criar({ nome: 'Rita Souza' })
    await repos.diaconisas.arquivar(d.id)
    const erro = await repos.diaconisas.criar({ nome: 'Rita Souza' }).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNomeDuplicado)
    expect((erro as ErroNomeDuplicado<Diaconisa>).existente.ativa).toBe(false)
  })

  it('diaconisa: ao editar, pode manter o próprio nome mas não pegar o de outra', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.diaconisas.criar({ nome: 'Ana Lima' })
    await repos.diaconisas.criar({ nome: 'Bia Costa' })
    await expect(repos.diaconisas.atualizar(a.id, { nome: 'ANA LIMA' })).resolves.toMatchObject({ nome: 'ANA LIMA' })
    await expect(repos.diaconisas.atualizar(a.id, { nome: 'bia costa' })).rejects.toBeInstanceOf(ErroNomeDuplicado)
  })

  it('pessoa visitada: mesmas regras de duplicado', async () => {
    const { repos } = criarBancoDeTeste()
    const p = await repos.pessoas.criar({ nome: 'José Antônio', endereco: ENDERECO })
    const erro = await repos.pessoas
      .criar({ nome: 'jose antonio', endereco: ENDERECO })
      .catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroNomeDuplicado)
    expect((erro as ErroNomeDuplicado<PessoaVisitada>).existente.id).toBe(p.id)
  })

  it('valida nome e telefone ao criar', async () => {
    const { repos } = criarBancoDeTeste()
    await expect(repos.diaconisas.criar({ nome: '' })).rejects.toBeInstanceOf(ErroValidacao)
    await expect(repos.diaconisas.criar({ nome: 'Ana', telefone: '123' })).rejects.toMatchObject({
      campo: 'telefone',
    })
    const ok = await repos.diaconisas.criar({ nome: 'Ana Maria', telefone: '(62) 98888-7777' })
    expect(ok.telefone).toBe('62988887777')
  })

  it('apagar o telefone com texto vazio', async () => {
    const { repos } = criarBancoDeTeste()
    const d = await repos.diaconisas.criar({ nome: 'Lúcia Rocha', telefone: '6233334444' })
    const atualizada = await repos.diaconisas.atualizar(d.id, { telefone: '' })
    expect(atualizada.telefone).toBeUndefined()
    expect('telefone' in atualizada).toBe(false)
  })
})

describe('buscar e listar', () => {
  it('lista em ordem alfabética e busca ignorando acentos', async () => {
    const { repos } = criarBancoDeTeste()
    await repos.diaconisas.criar({ nome: 'Zélia Prado' })
    await repos.diaconisas.criar({ nome: 'Ângela Reis' })
    await repos.diaconisas.criar({ nome: 'Bruna Alves' })
    expect((await repos.diaconisas.listar()).map((d) => d.nome)).toEqual(['Ângela Reis', 'Bruna Alves', 'Zélia Prado'])
    expect((await repos.diaconisas.buscar('angela')).map((d) => d.nome)).toEqual(['Ângela Reis'])
  })

  it('pessoas: busca pelo nome ou pelo endereço', async () => {
    const { repos } = criarBancoDeTeste()
    await repos.pessoas.criar({ nome: 'Carlos Dias', endereco: ENDERECO })
    await repos.pessoas.criar({
      nome: 'Dona Nair',
      endereco: { ...ENDERECO, logradouro: 'Avenida Goiás', setor: 'Vila Nova' },
    })
    expect((await repos.pessoas.buscar('carlos')).map((p) => p.nome)).toEqual(['Carlos Dias'])
    expect((await repos.pessoas.buscar('goias')).map((p) => p.nome)).toEqual(['Dona Nair'])
    expect((await repos.pessoas.buscar('vila nova')).map((p) => p.nome)).toEqual(['Dona Nair'])
  })
})
