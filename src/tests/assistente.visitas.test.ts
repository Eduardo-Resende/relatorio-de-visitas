import { describe, expect, it } from 'vitest'
import type { DadosEndereco, EntradaVisita } from '../db'
import { criarBancoDeTeste, ENDERECO } from './ajudas/bancoDeTeste'

const OUTRO_ENDERECO: DadosEndereco = {
  logradouro: 'Avenida Tocantins',
  quadra: '25',
  lote: '12',
  numero: '350',
  setor: 'Setor Sul',
}

describe('Fase 4 - Assistente de Nova Visita e Regras de Negócio', () => {
  it('caso de endereço 1: mesmo endereço para todas as pessoas da visita', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Marta Ferreira' })
    const p1 = await repos.pessoas.criar({ nome: 'Lucas Silva', endereco: ENDERECO })
    const p2 = await repos.pessoas.criar({ nome: 'Marcos Silva', enderecoId: p1.enderecoId })

    // Ambas as pessoas compartilham o mesmo endereço
    const pessoasVisita = [await repos.pessoas.obterComEndereco(p1.id), await repos.pessoas.obterComEndereco(p2.id)]
    const enderecosIds = new Set(pessoasVisita.map((p) => p?.enderecoId))
    expect(enderecosIds.size).toBe(1)

    // Ao confirmar que a visita foi no endereço cadastrado
    const visita = await repos.visitas.criar({
      data: '2026-11-03',
      diaconisaIds: [d1.id],
      pessoaIds: [p1.id, p2.id],
      endereco: ENDERECO,
      observacoes: 'Visita na casa da família Silva.',
    })

    expect(visita.endereco.logradouro).toBe('Rua das Flores')
    expect(visita.endereco.quadra).toBe('10')
    expect(visita.endereco.setor).toBe('Setor Central')
  })

  it('caso de endereço 2: pessoas com endereços diferentes, escolhe um deles para a visita', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Marta Ferreira' })
    const p1 = await repos.pessoas.criar({ nome: 'Lucas Silva', endereco: ENDERECO })
    const p2 = await repos.pessoas.criar({ nome: 'Ana Paula', endereco: OUTRO_ENDERECO })

    // Pessoas moram em locais distintos
    expect(p1.enderecoId).not.toBe(p2.enderecoId)

    // A visita foi realizada na casa de Ana Paula
    const visita = await repos.visitas.criar({
      data: '2026-11-03',
      diaconisaIds: [d1.id],
      pessoaIds: [p1.id, p2.id],
      endereco: OUTRO_ENDERECO,
      observacoes: 'Reunião de oração na casa de Ana Paula.',
    })

    expect(visita.endereco.logradouro).toBe('Avenida Tocantins')
    expect(visita.endereco.numero).toBe('350')
    expect(visita.pessoaIds).toEqual([p1.id, p2.id])
  })

  it('caso de endereço 3: outro endereço com atualizar cadastro = SIM', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Marta Ferreira' })
    const p1 = await repos.pessoas.criar({ nome: 'Lucas Silva', endereco: ENDERECO })
    const p2 = await repos.pessoas.criar({ nome: 'Marcos Silva', enderecoId: p1.enderecoId })

    const NOVO_ENDERECO: DadosEndereco = {
      logradouro: 'Rua das Palmeiras',
      quadra: '99',
      lote: '1',
      numero: '50',
      setor: 'Novo Horizonte',
    }

    // Usuária escolheu "Outro endereço" e marcou "Sim, atualizar o cadastro delas"
    await repos.pessoas.mudarEndereco([p1.id, p2.id], { endereco: NOVO_ENDERECO })

    const visita = await repos.visitas.criar({
      data: '2026-11-03',
      diaconisaIds: [d1.id],
      pessoaIds: [p1.id, p2.id],
      endereco: NOVO_ENDERECO,
      observacoes: 'Mudaram para casa nova.',
    })

    // Confere visita
    expect(visita.endereco.logradouro).toBe('Rua das Palmeiras')

    // Confere se o cadastro das pessoas foi de fato atualizado no banco
    const p1Atualizado = await repos.pessoas.obterComEndereco(p1.id)
    const p2Atualizado = await repos.pessoas.obterComEndereco(p2.id)
    expect(p1Atualizado?.endereco.logradouro).toBe('Rua das Palmeiras')
    expect(p2Atualizado?.endereco.logradouro).toBe('Rua das Palmeiras')
    expect(p1Atualizado?.enderecoId).toBe(p2Atualizado?.enderecoId)
  })

  it('caso de endereço 4: outro endereço com atualizar cadastro = NÃO', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Marta Ferreira' })
    const p1 = await repos.pessoas.criar({ nome: 'Lucas Silva', endereco: ENDERECO })

    const ENDERECO_HOSPITAL: DadosEndereco = {
      logradouro: 'Avenida Goiás (Hospital)',
      quadra: '',
      lote: '',
      numero: '1000',
      setor: 'Centro Médico',
    }

    // Visita ocorreu no hospital, SEM atualizar o endereço residencial cadastrado
    const visita = await repos.visitas.criar({
      data: '2026-11-03',
      diaconisaIds: [d1.id],
      pessoaIds: [p1.id],
      endereco: ENDERECO_HOSPITAL,
      observacoes: 'Visita hospitalar.',
    })

    // A visita tem o snapshot do hospital
    expect(visita.endereco.logradouro).toBe('Avenida Goiás (Hospital)')

    // O cadastro residencial de Lucas continua intacto (Rua das Flores)
    const p1Depois = await repos.pessoas.obterComEndereco(p1.id)
    expect(p1Depois?.endereco.logradouro).toBe('Rua das Flores')
  })

  it('pessoa nova criada no passo 3 é salva no cadastro na hora', async () => {
    const { repos } = criarBancoDeTeste()

    // Cadastra pessoa diretamente com endereço de outra pessoa já existente
    const pExistente = await repos.pessoas.criar({ nome: 'Maria Silva', endereco: ENDERECO })

    // Cria nova pessoa no mesmo endereço
    const pNova = await repos.pessoas.criar({
      nome: 'Pedro Silva',
      telefone: '62988881111',
      enderecoId: pExistente.enderecoId,
    })

    expect(pNova.id).toBeDefined()
    expect(pNova.nome).toBe('Pedro Silva')

    // Já existe no banco e pode ser listada
    const lista = await repos.pessoas.listar()
    expect(lista.map((p) => p.nome)).toContain('Pedro Silva')
  })

  it('pessoa nova no passo 3 reaproveita duplicados e arquivados da Fase 3', async () => {
    const { repos } = criarBancoDeTeste()

    // 1. Pessoa arquivada
    const pArquivada = await repos.pessoas.criar({ nome: 'Joana Prado', endereco: ENDERECO })
    await repos.pessoas.arquivar(pArquivada.id)

    // Se tentar achar por nome, encontra a arquivada para oferecer reativação
    const achada = await repos.pessoas.encontrarPorNome('Joana Prado')
    expect(achada?.ativa).toBe(false)

    // Reativa
    await repos.pessoas.reativar(achada!.id)
    const ativas = await repos.pessoas.listar()
    expect(ativas.map((p) => p.nome)).toContain('Joana Prado')
  })

  it('botão "Mesmas diaconisas da última visita" seleciona diaconisas da visita anterior', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Ana Costa' })
    const d2 = await repos.diaconisas.criar({ nome: 'Bete Ramos' })
    const d3 = await repos.diaconisas.criar({ nome: 'Carla Nogueira' })
    const p1 = await repos.pessoas.criar({ nome: 'Família Souza', endereco: ENDERECO })

    // Cria visita anterior feita por Ana e Bete
    await repos.visitas.criar({
      data: '2026-11-01',
      diaconisaIds: [d1.id, d2.id],
      pessoaIds: [p1.id],
      endereco: ENDERECO,
      observacoes: 'Visita anterior',
    })

    // Para a nova visita: busca a última visita registrada
    const visitas = await repos.visitas.listar({ ordem: 'desc' })
    expect(visitas.length).toBeGreaterThan(0)
    const ultima = visitas[0]

    // As diaconisas sugeridas são Ana e Bete (não Carla)
    expect(ultima.diaconisaIds).toEqual([d1.id, d2.id])
    expect(ultima.diaconisaIds).not.toContain(d3.id)
  })

  it('rascunho: salva e recupera observação com 20.000 caracteres sem perda ou truncamento', async () => {
    const { repos } = criarBancoDeTeste()

    const texto20k = 'A'.repeat(20000)

    const estadoRascunho = {
      passo: 5,
      data: '2026-11-03',
      diaconisaIds: ['id-1'],
      pessoaIds: ['id-2'],
      modoEndereco: 'mesmo' as const,
      atualizarCadastroPessoas: false,
      observacoes: texto20k,
    }

    // Salva rascunho
    await repos.rascunho.salvar(estadoRascunho)

    // Recupera rascunho
    const recuperado = await repos.rascunho.obter()
    expect(recuperado).toBeDefined()
    const est = recuperado!.estado as typeof estadoRascunho
    expect(est.observacoes.length).toBe(20000)
    expect(est.observacoes).toBe(texto20k)
    expect(est.passo).toBe(5)

    // Ao limpar rascunho
    await repos.rascunho.limpar()
    expect(await repos.rascunho.obter()).toBeUndefined()
  })

  it('rascunho: trata com gentileza quando participante foi arquivado ou removido', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Diaconisa Ativa' })
    const d2 = await repos.diaconisas.criar({ nome: 'Diaconisa Que Sera Arquivada' })
    const p1 = await repos.pessoas.criar({ nome: 'Pessoa Visitada', endereco: ENDERECO })

    // Rascunho guardou d1 e d2
    await repos.rascunho.salvar({
      passo: 2,
      data: '2026-11-03',
      diaconisaIds: [d1.id, d2.id],
      pessoaIds: [p1.id],
      modoEndereco: 'mesmo',
      atualizarCadastroPessoas: false,
      observacoes: '',
    })

    // Mais tarde, a diaconisa d2 é arquivada
    await repos.diaconisas.arquivar(d2.id)

    // Quando o assistente reabre o rascunho e valida participantes:
    const rascunho = await repos.rascunho.obter()
    const est = rascunho!.estado as { diaconisaIds: string[] }

    const ativas: string[] = []
    const desativadas: string[] = []
    for (const id of est.diaconisaIds) {
      const d = await repos.diaconisas.obter(id)
      if (d && d.ativa) ativas.push(id)
      else desativadas.push(d?.nome ?? 'Desconhecida')
    }

    expect(ativas).toEqual([d1.id])
    expect(desativadas).toEqual(['Diaconisa Que Sera Arquivada'])
  })

  it('assistente e prévia aceitam visita existente como ponto de partida para edição (Fase 6)', async () => {
    const { repos } = criarBancoDeTeste()

    const d1 = await repos.diaconisas.criar({ nome: 'Ana Costa' })
    const p1 = await repos.pessoas.criar({ nome: 'Família Souza', endereco: ENDERECO })

    const visita = await repos.visitas.criar({
      data: '2026-11-02',
      diaconisaIds: [d1.id],
      pessoaIds: [p1.id],
      endereco: ENDERECO,
      observacoes: 'Anotações iniciais.',
    })

    // Edição reaproveita dados da visita existente
    const entradaAtualizacao: EntradaVisita = {
      data: '2026-11-02',
      diaconisaIds: [d1.id],
      pessoaIds: [p1.id],
      endereco: ENDERECO,
      observacoes: 'Anotações atualizadas com pedido de oração.',
    }

    const visitaAtualizada = await repos.visitas.atualizar(visita.id, entradaAtualizacao)
    expect(visitaAtualizada.id).toBe(visita.id)
    expect(visitaAtualizada.observacoes).toBe('Anotações atualizadas com pedido de oração.')
  })
})

