import { ErroNaoEncontrado } from '../../lib/erros'
import { normalizarTexto } from '../../lib/texto'
import { validarEndereco } from '../../lib/validadores'
import type { RepositorioEnderecos } from '../repositorios'
import type { DadosEndereco, Endereco } from '../tipos'
import type { BancoDeDados } from './bancoDeDados'
import { novoId } from './util'

/** Chave que identifica um endereço, ignorando acentos, maiúsculas e espaços extras. */
export function chaveEndereco(d: DadosEndereco): string {
  return [d.logradouro, d.quadra, d.lote, d.numero, d.setor].map(normalizarTexto).join('|')
}

export function criarRepositorioEnderecos(db: BancoDeDados): RepositorioEnderecos {
  async function removerSeSemMoradores(id: string): Promise<boolean> {
    return db.transaction('rw', db.enderecos, db.pessoas, async () => {
      const moradores = await db.pessoas.where('enderecoId').equals(id).count()
      if (moradores > 0) return false
      await db.enderecos.delete(id)
      return true
    })
  }

  return {
    async listar() {
      const todos = await db.enderecos.toArray()
      return todos.sort((a, b) => a.chaveNormalizada.localeCompare(b.chaveNormalizada, 'pt-BR'))
    },

    obter: (id) => db.enderecos.get(id),

    async buscar(texto) {
      const termo = normalizarTexto(texto)
      const todos = await db.enderecos.toArray()
      return todos
        .filter((e) => e.chaveNormalizada.includes(termo) || normalizarTexto(`${e.logradouro} ${e.setor}`).includes(termo))
        .sort((a, b) => a.chaveNormalizada.localeCompare(b.chaveNormalizada, 'pt-BR'))
    },

    async obterOuCriar(dados) {
      const limpo = validarEndereco(dados)
      const chave = chaveEndereco(limpo)
      return db.transaction('rw', db.enderecos, async () => {
        const existente = await db.enderecos.where('chaveNormalizada').equals(chave).first()
        if (existente) return existente
        const novo: Endereco = { ...limpo, id: novoId(), chaveNormalizada: chave }
        await db.enderecos.add(novo)
        return novo
      })
    },

    async atualizar(id, dados) {
      const limpo = validarEndereco(dados)
      const chave = chaveEndereco(limpo)
      return db.transaction('rw', db.enderecos, db.pessoas, async () => {
        const atual = await db.enderecos.get(id)
        if (!atual) throw new ErroNaoEncontrado('o endereço')
        const igual = await db.enderecos.where('chaveNormalizada').equals(chave).first()
        if (igual && igual.id !== id) {
          // O novo endereço já existe: juntamos os dois, levando os moradores para o que já existia.
          await db.pessoas.where('enderecoId').equals(id).modify({ enderecoId: igual.id })
          await db.enderecos.delete(id)
          return igual
        }
        const novo: Endereco = { ...limpo, id, chaveNormalizada: chave }
        await db.enderecos.put(novo)
        return novo
      })
    },

    removerSeSemMoradores,
  }
}
