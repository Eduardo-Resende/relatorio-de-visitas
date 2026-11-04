import { ErroNaoEncontrado, ErroNomeDuplicado } from '../../lib/erros'
import { compararTexto, normalizarTexto } from '../../lib/texto'
import { validarNome, validarTelefone } from '../../lib/validadores'
import type { RepositorioDiaconisas } from '../repositorios'
import type { Diaconisa } from '../tipos'
import type { BancoDeDados } from './bancoDeDados'
import { novoId } from './util'

export function criarRepositorioDiaconisas(db: BancoDeDados): RepositorioDiaconisas {
  async function listarTodas(incluirArquivadas: boolean): Promise<Diaconisa[]> {
    const todas = await db.diaconisas.toArray()
    return todas
      .filter((d) => incluirArquivadas || d.ativa)
      .sort((a, b) => compararTexto(a.nome, b.nome))
  }

  async function encontrarPorNome(nome: string, ignorarId?: string) {
    const achadas = await db.diaconisas.where('nomeNormalizado').equals(normalizarTexto(nome)).toArray()
    return achadas.find((d) => d.id !== ignorarId)
  }

  async function obterOuFalhar(id: string): Promise<Diaconisa> {
    const d = await db.diaconisas.get(id)
    if (!d) throw new ErroNaoEncontrado('a diaconisa')
    return d
  }

  return {
    listar: (opcoes) => listarTodas(opcoes?.incluirArquivadas ?? false),

    async buscar(texto, opcoes) {
      const termo = normalizarTexto(texto)
      const todas = await listarTodas(opcoes?.incluirArquivadas ?? false)
      return todas.filter((d) => d.nomeNormalizado.includes(termo))
    },

    obter: (id) => db.diaconisas.get(id),

    encontrarPorNome,

    async criar(dados, opcoes) {
      const nome = validarNome(dados.nome)
      const telefone = validarTelefone(dados.telefone)
      return db.transaction('rw', db.diaconisas, async () => {
        const existente = await encontrarPorNome(nome)
        if (existente && !opcoes?.permitirDuplicado) throw new ErroNomeDuplicado(existente.nome, existente)
        const nova: Diaconisa = {
          id: novoId(),
          nome,
          nomeNormalizado: normalizarTexto(nome),
          ...(telefone ? { telefone } : {}),
          ativa: true,
          criadoEm: new Date().toISOString(),
        }
        await db.diaconisas.add(nova)
        return nova
      })
    },

    async atualizar(id, dados, opcoes) {
      return db.transaction('rw', db.diaconisas, async () => {
        const atual = await obterOuFalhar(id)
        const novo: Diaconisa = { ...atual }
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
        await db.diaconisas.put(novo)
        return novo
      })
    },

    async arquivar(id) {
      await db.diaconisas.update(id, { ativa: false })
    },

    async reativar(id) {
      await db.diaconisas.update(id, { ativa: true })
    },

    async remover(id) {
      return db.transaction('rw', db.diaconisas, db.visitas, async () => {
        const emVisitas = await db.visitas.where('diaconisaIds').equals(id).count()
        if (emVisitas > 0) {
          await db.diaconisas.update(id, { ativa: false })
          return 'arquivada'
        }
        await db.diaconisas.delete(id)
        return 'apagada'
      })
    },
  }
}
