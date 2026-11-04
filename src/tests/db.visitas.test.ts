import { describe, expect, it } from 'vitest'
import { ErroNaoEncontrado, ErroValidacao } from '../lib/erros'
import { VERSAO_ATUAL } from '../db/dexie/bancoDeDados'
import { ENDERECO, criarBancoDeTeste } from './ajudas/bancoDeTeste'

async function cenario() {
  const { db, repos } = criarBancoDeTeste()
  const diaconisa = await repos.diaconisas.criar({ nome: 'Ana Paula', telefone: '62911112222' })
  const outraDiaconisa = await repos.diaconisas.criar({ nome: 'Bia Costa' })
  const maria = await repos.pessoas.criar({ nome: 'Maria Silva', telefone: '6233334444', endereco: ENDERECO })
  const joao = await repos.pessoas.criar({ nome: 'João Silva', enderecoId: maria.enderecoId })
  return { db, repos, diaconisa, outraDiaconisa, maria, joao }
}

describe('visita guarda cópia (snapshot)', () => {
  it('mudar o cadastro depois NÃO altera a visita já feita', async () => {
    const { repos, diaconisa, maria, joao } = await cenario()
    const visita = await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id, joao.id],
      endereco: ENDERECO,
      observacoes: 'Visita boa.',
    })

    // depois alguém edita os cadastros
    await repos.diaconisas.atualizar(diaconisa.id, { nome: 'Ana Paula Souza', telefone: '62900000000' })
    await repos.pessoas.atualizar(maria.id, { nome: 'Maria da Silva', telefone: '' })
    await repos.pessoas.mudarEndereco([maria.id, joao.id], { endereco: { ...ENDERECO, logradouro: 'Rua Nova' } })

    const guardada = await repos.visitas.obter(visita.id)
    expect(guardada?.diaconisas).toEqual([{ id: diaconisa.id, nome: 'Ana Paula', telefone: '62911112222' }])
    expect(guardada?.pessoas).toEqual([
      { id: maria.id, nome: 'Maria Silva', telefone: '6233334444' },
      { id: joao.id, nome: 'João Silva' },
    ])
    expect(guardada?.endereco).toEqual(ENDERECO)
  })

  it('a cópia do endereço é só da visita (pode ser diferente do cadastro das pessoas)', async () => {
    const { repos, diaconisa, maria } = await cenario()
    const outro = { ...ENDERECO, logradouro: 'Rua da Igreja', numero: 'S/N' }
    const v = await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id],
      endereco: outro,
      observacoes: '',
    })
    expect(v.endereco.logradouro).toBe('Rua da Igreja')
    expect((await repos.pessoas.obterComEndereco(maria.id))?.endereco.logradouro).toBe('Rua das Flores')
  })

  it('ao editar, quem já estava mantém a cópia antiga e quem entrou usa os dados atuais', async () => {
    const { repos, diaconisa, outraDiaconisa, maria, joao } = await cenario()
    const v = await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id],
      endereco: ENDERECO,
      observacoes: 'Primeira versão',
    })
    await repos.diaconisas.atualizar(diaconisa.id, { nome: 'Ana Paula Souza' })
    await repos.pessoas.atualizar(joao.id, { nome: 'João Pedro Silva' })

    const editada = await repos.visitas.atualizar(v.id, {
      data: '2026-10-19',
      diaconisaIds: [diaconisa.id, outraDiaconisa.id],
      pessoaIds: [maria.id, joao.id],
      endereco: ENDERECO,
      observacoes: 'Segunda versão',
    })
    expect(editada.diaconisas.map((d) => d.nome)).toEqual(['Ana Paula', 'Bia Costa'])
    expect(editada.pessoas.map((p) => p.nome)).toEqual(['Maria Silva', 'João Pedro Silva'])
    expect(editada.criadoEm).toBe(v.criadoEm)
    expect(editada.data).toBe('2026-10-19')
    expect(editada.observacoes).toBe('Segunda versão')
    expect(editada.diaconisaIds).toEqual(editada.diaconisas.map((d) => d.id))
  })

  it('exige data, 1 diaconisa e 1 pessoa', async () => {
    const { repos, diaconisa, maria } = await cenario()
    const base = { data: '2026-10-18', diaconisaIds: [diaconisa.id], pessoaIds: [maria.id], endereco: ENDERECO, observacoes: '' }
    await expect(repos.visitas.criar({ ...base, data: '' })).rejects.toMatchObject({ campo: 'data' })
    await expect(repos.visitas.criar({ ...base, diaconisaIds: [] })).rejects.toBeInstanceOf(ErroValidacao)
    await expect(repos.visitas.criar({ ...base, pessoaIds: [] })).rejects.toBeInstanceOf(ErroValidacao)
    await expect(repos.visitas.criar({ ...base, pessoaIds: ['nao-existe'] })).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })

  it('guarda observação de 20.000+ caracteres sem cortar, com quebras de linha', async () => {
    const { repos, diaconisa, maria } = await cenario()
    const texto = Array.from({ length: 400 }, (_, i) => `Linha ${i}: ${'a'.repeat(45)}`).join('\n')
    expect(texto.length).toBeGreaterThan(20000)
    const v = await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id],
      endereco: ENDERECO,
      observacoes: texto,
    })
    expect((await repos.visitas.obter(v.id))?.observacoes).toBe(texto)
  })
})

describe('arquivar em vez de apagar', () => {
  it('pessoa que já aparece em visita só é arquivada e o histórico permanece', async () => {
    const { repos, diaconisa, maria, joao } = await cenario()
    const v = await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id],
      endereco: ENDERECO,
      observacoes: '',
    })
    expect(await repos.pessoas.remover(maria.id)).toBe('arquivada')
    expect(await repos.pessoas.obter(maria.id)).toMatchObject({ ativa: false })
    expect((await repos.pessoas.listar()).map((p) => p.nome)).toEqual(['João Silva'])
    expect(await repos.pessoas.listar({ incluirArquivadas: true })).toHaveLength(2)
    expect((await repos.visitas.obter(v.id))?.pessoas[0].nome).toBe('Maria Silva')
    // o endereço continua existindo (a pessoa arquivada ainda aponta para ele)
    expect(await repos.enderecos.obter(maria.enderecoId)).toBeDefined()

    await repos.pessoas.reativar(maria.id)
    expect(await repos.pessoas.listar()).toHaveLength(2)

    // quem nunca apareceu em visita é apagado de verdade
    expect(await repos.pessoas.remover(joao.id)).toBe('apagada')
    expect(await repos.pessoas.obter(joao.id)).toBeUndefined()
  })

  it('diaconisa que já aparece em visita só é arquivada', async () => {
    const { repos, diaconisa, outraDiaconisa, maria } = await cenario()
    await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id],
      endereco: ENDERECO,
      observacoes: '',
    })
    expect(await repos.diaconisas.remover(diaconisa.id)).toBe('arquivada')
    expect((await repos.diaconisas.listar()).map((d) => d.nome)).toEqual(['Bia Costa'])
    expect(await repos.diaconisas.obter(diaconisa.id)).toBeDefined()
    expect(await repos.diaconisas.remover(outraDiaconisa.id)).toBe('apagada')
    expect(await repos.diaconisas.obter(outraDiaconisa.id)).toBeUndefined()
  })

  it('apagar uma visita libera quem só aparecia nela para ser apagado de vez', async () => {
    const { repos, diaconisa, maria } = await cenario()
    const v = await repos.visitas.criar({
      data: '2026-10-18',
      diaconisaIds: [diaconisa.id],
      pessoaIds: [maria.id],
      endereco: ENDERECO,
      observacoes: '',
    })
    await repos.visitas.apagar(v.id)
    expect(await repos.pessoas.remover(maria.id)).toBe('apagada')
  })
})

describe('listar visitas', () => {
  async function criarVarias() {
    const c = await cenario()
    const nova = (data: string) =>
      c.repos.visitas.criar({
        data,
        diaconisaIds: [c.diaconisa.id],
        pessoaIds: [c.maria.id],
        endereco: ENDERECO,
        observacoes: data,
      })
    await nova('2026-10-05')
    await nova('2026-10-12')
    await nova('2026-10-12')
    await nova('2026-11-01')
    return c
  }

  it('ordem: mais recente primeiro (padrão) ou cronológica', async () => {
    const { repos } = await criarVarias()
    expect((await repos.visitas.listar()).map((v) => v.data)).toEqual([
      '2026-11-01',
      '2026-10-12',
      '2026-10-12',
      '2026-10-05',
    ])
    expect((await repos.visitas.listar({ ordem: 'asc' })).map((v) => v.data)).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-12',
      '2026-11-01',
    ])
  })

  it('filtra por período (inclusive nas pontas) e conta', async () => {
    const { repos } = await criarVarias()
    expect(await repos.visitas.contar({ de: '2026-10-05', ate: '2026-10-12' })).toBe(3)
    expect(await repos.visitas.contar({ de: '2026-10-06', ate: '2026-10-11' })).toBe(0)
    expect(await repos.visitas.contar({ de: '2026-10-12' })).toBe(3)
    expect(await repos.visitas.contar({ ate: '2026-10-05' })).toBe(1)
  })

  it('busca por nome de diaconisa ou de pessoa, sem ligar para acento', async () => {
    const { repos } = await criarVarias()
    expect(await repos.visitas.contar({ busca: 'MARIA' })).toBe(4)
    expect(await repos.visitas.contar({ busca: 'ana paula' })).toBe(4)
    expect(await repos.visitas.contar({ busca: 'joao' })).toBe(0)
  })
})

describe('rascunho, configurações e dicionário pessoal', () => {
  it('rascunho: salva, lê e limpa', async () => {
    const { repos } = criarBancoDeTeste()
    expect(await repos.rascunho.obter()).toBeUndefined()
    await repos.rascunho.salvar({ passo: 3, data: '2026-10-18' })
    expect((await repos.rascunho.obter())?.estado).toEqual({ passo: 3, data: '2026-10-18' })
    await repos.rascunho.salvar({ passo: 4 })
    expect((await repos.rascunho.obter())?.estado).toEqual({ passo: 4 })
    await repos.rascunho.limpar()
    expect(await repos.rascunho.obter()).toBeUndefined()
  })

  it('configurações: padrão (letra 20, DDD 62, domingo) e alterações parciais', async () => {
    const { repos } = criarBancoDeTeste()
    expect(await repos.configuracoes.obter()).toEqual({
      id: 'config',
      tamanhoFonte: 20,
      dddPadrao: '62',
      primeiroDiaSemana: 0,
    })
    await repos.configuracoes.salvar({ primeiroDiaSemana: 1 })
    await repos.configuracoes.salvar({ dddPadrao: '11' })
    expect(await repos.configuracoes.obter()).toMatchObject({ dddPadrao: '11', primeiroDiaSemana: 1, tamanhoFonte: 20 })
  })

  it('dicionário pessoal: guarda em minúsculas, sem repetir', async () => {
    const { repos } = criarBancoDeTeste()
    await repos.dicionarioPessoal.adicionar('Jaçanã')
    await repos.dicionarioPessoal.adicionar(' jaçanã ')
    await repos.dicionarioPessoal.adicionar('Anápolis')
    await repos.dicionarioPessoal.adicionar('   ')
    expect(await repos.dicionarioPessoal.listar()).toEqual(['anápolis', 'jaçanã'])
    await repos.dicionarioPessoal.remover('JAÇANÃ')
    expect(await repos.dicionarioPessoal.listar()).toEqual(['anápolis'])
  })
})

describe('banco', () => {
  it('abre na versão atual do schema e persiste entre aberturas', async () => {
    const { db, repos } = criarBancoDeTeste()
    await db.open()
    expect(db.verno).toBe(VERSAO_ATUAL)
    await repos.diaconisas.criar({ nome: 'Ana Paula' })
    db.close()
    await db.open()
    expect(await repos.diaconisas.listar()).toHaveLength(1)
  })
})
