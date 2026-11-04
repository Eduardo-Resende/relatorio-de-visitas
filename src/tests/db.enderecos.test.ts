import { describe, expect, it } from 'vitest'
import { ENDERECO, criarBancoDeTeste } from './ajudas/bancoDeTeste'

describe('endereços compartilhados', () => {
  it('duas pessoas no mesmo endereço (escrito de jeitos diferentes) usam um único cadastro', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    const b = await repos.pessoas.criar({
      nome: 'João Silva',
      endereco: { ...ENDERECO, logradouro: '  rua   DAS flores ', setor: 'SETOR CENTRAL' },
    })
    expect(a.enderecoId).toBe(b.enderecoId)
    expect(await repos.enderecos.listar()).toHaveLength(1)
    expect((await repos.pessoas.moradoresDoEndereco(a.enderecoId)).map((p) => p.nome)).toEqual([
      'João Silva',
      'Maria Silva',
    ])
  })

  it('número diferente é outro endereço', async () => {
    const { repos } = criarBancoDeTeste()
    await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    await repos.pessoas.criar({ nome: 'João Silva', endereco: { ...ENDERECO, numero: '121' } })
    expect(await repos.enderecos.listar()).toHaveLength(2)
  })

  it('pessoa pode usar um endereço já cadastrado pelo id', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    const b = await repos.pessoas.criar({ nome: 'João Silva', enderecoId: a.enderecoId })
    expect(b.enderecoId).toBe(a.enderecoId)
  })

  it('mudar o endereço de várias pessoas reaproveita endereço igual e apaga o que ficou vazio', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    const b = await repos.pessoas.criar({ nome: 'João Silva', endereco: ENDERECO })
    const novo = { ...ENDERECO, logradouro: 'Rua Nova', quadra: '2' }

    const e1 = await repos.pessoas.mudarEndereco([a.id, b.id], { endereco: novo })
    expect((await repos.pessoas.obter(a.id))?.enderecoId).toBe(e1.id)
    expect((await repos.pessoas.obter(b.id))?.enderecoId).toBe(e1.id)
    // o endereço antigo ficou sem moradores e foi removido
    expect(await repos.enderecos.listar()).toHaveLength(1)

    // outra pessoa indo para o mesmo "novo" endereço reaproveita o cadastro
    const c = await repos.pessoas.criar({ nome: 'Pedro Alves', endereco: ENDERECO })
    const e2 = await repos.pessoas.mudarEndereco([c.id], { endereco: { ...novo, logradouro: 'RUA NOVA' } })
    expect(e2.id).toBe(e1.id)
    expect(await repos.enderecos.listar()).toHaveLength(1)
  })

  it('mudar o endereço de só uma pessoa não apaga o endereço que outra ainda usa', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    const b = await repos.pessoas.criar({ nome: 'João Silva', endereco: ENDERECO })
    await repos.pessoas.mudarEndereco([a.id], { endereco: { ...ENDERECO, numero: '999' } })
    expect(await repos.enderecos.listar()).toHaveLength(2)
    expect((await repos.pessoas.obter(b.id))?.enderecoId).toBeDefined()
    expect(await repos.pessoas.moradoresDoEndereco((await repos.pessoas.obter(b.id))!.enderecoId)).toHaveLength(1)
  })

  it('corrigir um endereço vale para todos que moram nele', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    const b = await repos.pessoas.criar({ nome: 'João Silva', enderecoId: a.enderecoId })
    await repos.enderecos.atualizar(a.enderecoId, { ...ENDERECO, numero: '121' })
    expect((await repos.pessoas.obterComEndereco(a.id))?.endereco.numero).toBe('121')
    expect((await repos.pessoas.obterComEndereco(b.id))?.endereco.numero).toBe('121')
  })

  it('corrigir um endereço para ficar igual a outro junta os dois', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    const b = await repos.pessoas.criar({ nome: 'João Silva', endereco: { ...ENDERECO, numero: '121' } })
    await repos.enderecos.atualizar(b.enderecoId, ENDERECO)
    expect(await repos.enderecos.listar()).toHaveLength(1)
    expect((await repos.pessoas.obter(b.id))?.enderecoId).toBe(a.enderecoId)
  })

  it('apagar a última pessoa de um endereço apaga o endereço', async () => {
    const { repos } = criarBancoDeTeste()
    const a = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })
    expect(await repos.pessoas.remover(a.id)).toBe('apagada')
    expect(await repos.enderecos.listar()).toHaveLength(0)
  })

  it('exige rua e setor ao criar endereço', async () => {
    const { repos } = criarBancoDeTeste()
    await expect(repos.enderecos.obterOuCriar({ ...ENDERECO, logradouro: '' })).rejects.toMatchObject({
      campo: 'logradouro',
    })
    await expect(repos.enderecos.obterOuCriar({ ...ENDERECO, setor: ' ' })).rejects.toMatchObject({ campo: 'setor' })
  })
})
