import type {
  RepositorioConfiguracoes,
  RepositorioDicionarioPessoal,
  RepositorioRascunho,
} from '../repositorios'
import type { Configuracoes } from '../tipos'
import type { BancoDeDados } from './bancoDeDados'

export const CONFIGURACOES_PADRAO: Configuracoes = {
  id: 'config',
  tamanhoFonte: 20,
  dddPadrao: '62',
  primeiroDiaSemana: 0,
}

export function criarRepositorioRascunho(db: BancoDeDados): RepositorioRascunho {
  return {
    obter: () => db.rascunho.get('atual'),
    async salvar(estado) {
      await db.rascunho.put({ id: 'atual', estado, atualizadoEm: new Date().toISOString() })
    },
    async limpar() {
      await db.rascunho.delete('atual')
    },
  }
}

export function criarRepositorioConfiguracoes(db: BancoDeDados): RepositorioConfiguracoes {
  async function obter(): Promise<Configuracoes> {
    const salva = await db.configuracoes.get('config')
    return { ...CONFIGURACOES_PADRAO, ...salva }
  }
  return {
    obter,
    async salvar(alteracoes) {
      return db.transaction('rw', db.configuracoes, async () => {
        const nova: Configuracoes = { ...(await obter()), ...alteracoes, id: 'config' }
        await db.configuracoes.put(nova)
        return nova
      })
    },
  }
}

/** No dicionário pessoal guardamos a palavra em minúsculas (os acentos importam para o corretor). */
function formaDaPalavra(palavra: string): string {
  return palavra.trim().toLocaleLowerCase('pt-BR')
}

export function criarRepositorioDicionarioPessoal(db: BancoDeDados): RepositorioDicionarioPessoal {
  return {
    async listar() {
      const todas = await db.dicionarioPessoal.toArray()
      return todas.map((p) => p.palavra).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    async adicionar(palavra) {
      const forma = formaDaPalavra(palavra)
      if (forma) await db.dicionarioPessoal.put({ palavra: forma })
    },
    async remover(palavra) {
      await db.dicionarioPessoal.delete(formaDaPalavra(palavra))
    },
  }
}
