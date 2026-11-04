import { ErroNaoEncontrado, ErroNomeDuplicado } from '../../lib/erros'
import { compararTexto, normalizarTexto } from '../../lib/texto'
import { validarNome, validarTelefone } from '../../lib/validadores'
import type { DestinoEndereco, RepositorioEnderecos, RepositorioPessoas } from '../repositorios'
import type { Endereco, PessoaComEndereco, PessoaVisitada } from '../tipos'
import type { BancoDeDados } from './bancoDeDados'
import { novoId, semRepetidos } from './util'

export function criarRepositorioPessoas(db: BancoDeDados, enderecos: RepositorioEnderecos): RepositorioPessoas {
  async function comEndereco(pessoas: PessoaVisitada[]): Promise<PessoaComEndereco[]> {
    const lista = await db.enderecos.bulkGet(semRepetidos(pessoas.map((p) => p.enderecoId)))
    const porId = new Map<string, Endereco>()
    for (const e of lista) if (e) porId.set(e.id, e)
    const resultado: PessoaComEndereco[] = []
    for (const p of pessoas) {
      const endereco = porId.get(p.enderecoId)
      if (endereco) resultado.push({ ...p, endereco })
    }
    return resultado
  }

  async function listarTodas(incluirArquivadas: boolean): Promise<PessoaComEndereco[]> {
    const todas = (await db.pessoas.toArray()).filter((p) => incluirArquivadas || p.ativa)
    const completas = await comEndereco(todas)
    return completas.sort((a, b) => compararTexto(a.nome, b.nome))
  }

  async function encontrarPorNome(nome: string, ignorarId?: string) {
    const achadas = await db.pessoas.where('nomeNormalizado').equals(normalizarTexto(nome)).toArray()
    return achadas.find((p) => p.id !== ignorarId)
  }

  async function obterOuFalhar(id: string): Promise<PessoaVisitada> {
    const p = await db.pessoas.get(id)
    if (!p) throw new ErroNaoEncontrado('a pessoa')
    return p
  }

  async function resolverDestino(destino: DestinoEndereco): Promise<Endereco> {
    if ('enderecoId' in destino) {
      const e = await db.enderecos.get(destino.enderecoId)
      if (!e) throw new ErroNaoEncontrado('o endereço')
      return e
    }
    return enderecos.obterOuCriar(destino.endereco)
  }

  return {
    listar: (opcoes) => listarTodas(opcoes?.incluirArquivadas ?? false),

    async buscar(texto, opcoes) {
      const termo = normalizarTexto(texto)
      const todas = await listarTodas(opcoes?.incluirArquivadas ?? false)
      return todas.filter(
        (p) =>
          p.nomeNormalizado.includes(termo) ||
          p.endereco.chaveNormalizada.includes(termo) ||
          normalizarTexto(`${p.endereco.logradouro} ${p.endereco.setor}`).includes(termo),
      )
    },

    obter: (id) => db.pessoas.get(id),

    async obterComEndereco(id) {
      const p = await db.pessoas.get(id)
      if (!p) return undefined
      return (await comEndereco([p]))[0]
    },

    encontrarPorNome,

    async moradoresDoEndereco(enderecoId, opcoes) {
      const moradores = await db.pessoas.where('enderecoId').equals(enderecoId).toArray()
      return moradores
        .filter((p) => opcoes?.incluirArquivadas || p.ativa)
        .sort((a, b) => compararTexto(a.nome, b.nome))
    },

    async criar(dados, opcoes) {
      const nome = validarNome(dados.nome)
      const telefone = validarTelefone(dados.telefone)
      return db.transaction('rw', db.pessoas, db.enderecos, async () => {
        const existente = await encontrarPorNome(nome)
        if (existente && !opcoes?.permitirDuplicado) throw new ErroNomeDuplicado(existente.nome, existente)
        const endereco = await resolverDestino(dados)
        const nova: PessoaVisitada = {
          id: novoId(),
          nome,
          nomeNormalizado: normalizarTexto(nome),
          ...(telefone ? { telefone } : {}),
          enderecoId: endereco.id,
          ativa: true,
          criadoEm: new Date().toISOString(),
        }
        await db.pessoas.add(nova)
        return nova
      })
    },

    async atualizar(id, dados, opcoes) {
      return db.transaction('rw', db.pessoas, async () => {
        const atual = await obterOuFalhar(id)
        const novo: PessoaVisitada = { ...atual }
        if (dados.nome !== undefined) {
          novo.nome = validarNome(dados.nome)
          novo.nomeNormalizado = normalizarTexto(novo.nome)
          const existente = await encontrarPorNome(novo.nome, id)
          if (existente && !opcoes?.permitirDuplicado) throw new ErroNomeDuplicado(existente.nome, existente)
        }
        if (dados.telefone !== undefined) {
          const telefone = validarTelefone(dados.telefone)
          if (telefone) novo.telefone = telefone
          else delete novo.telefone
        }
        await db.pessoas.put(novo)
        return novo
      })
    },

    async mudarEndereco(ids, destino) {
      return db.transaction('rw', db.pessoas, db.enderecos, async () => {
        const novoEndereco = await resolverDestino(destino)
        const antigos = new Set<string>()
        for (const id of semRepetidos(ids)) {
          const pessoa = await obterOuFalhar(id)
          if (pessoa.enderecoId !== novoEndereco.id) {
            antigos.add(pessoa.enderecoId)
            await db.pessoas.update(id, { enderecoId: novoEndereco.id })
          }
        }
        for (const antigo of antigos) await enderecos.removerSeSemMoradores(antigo)
        return novoEndereco
      })
    },

    async arquivar(id) {
      await db.pessoas.update(id, { ativa: false })
    },

    async reativar(id) {
      await db.pessoas.update(id, { ativa: true })
    },

    async remover(id) {
      return db.transaction('rw', db.pessoas, db.enderecos, db.visitas, async () => {
        const emVisitas = await db.visitas.where('pessoaIds').equals(id).count()
        if (emVisitas > 0) {
          await db.pessoas.update(id, { ativa: false })
          return 'arquivada'
        }
        const pessoa = await db.pessoas.get(id)
        await db.pessoas.delete(id)
        if (pessoa) await enderecos.removerSeSemMoradores(pessoa.enderecoId)
        return 'apagada'
      })
    },
  }
}
