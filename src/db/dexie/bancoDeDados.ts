import Dexie, { type DexieOptions, type EntityTable, type Transaction } from 'dexie'
import type {
  Configuracoes,
  Diaconisa,
  Endereco,
  PalavraPessoal,
  PessoaVisitada,
  Rascunho,
  Visita,
} from '../tipos'

export const NOME_DO_BANCO = 'relatorio-de-visitas'

interface VersaoDoBanco {
  versao: number
  /** Tabelas e índices desta versão (sintaxe do Dexie). Repita as tabelas que continuam existindo. */
  tabelas: Record<string, string>
  /** Transforma os dados já guardados quando o aparelho está numa versão anterior. */
  migrar?: (transacao: Transaction) => Promise<void> | void
}

/**
 * HISTÓRICO DE VERSÕES DO BANCO.
 * Para mudar o formato dos dados no futuro: NÃO edite a versão antiga.
 * Acrescente uma nova versão no fim da lista (com `migrar`, se precisar converter dados).
 *
 * Observação: valores booleanos (ex.: "ativa") não podem ser índices no IndexedDB;
 * por isso o filtro de arquivadas é feito na hora de listar (o volume de dados é pequeno).
 */
export const VERSOES: VersaoDoBanco[] = [
  {
    versao: 1,
    tabelas: {
      diaconisas: 'id, nomeNormalizado',
      enderecos: 'id, &chaveNormalizada',
      pessoas: 'id, nomeNormalizado, enderecoId',
      // *diaconisaIds e *pessoaIds: índices "multi-valor" para saber se alguém já aparece em visitas
      visitas: 'id, data, *diaconisaIds, *pessoaIds',
      rascunho: 'id',
      configuracoes: 'id',
      dicionarioPessoal: 'palavra',
    },
  },
]

export const VERSAO_ATUAL = VERSOES[VERSOES.length - 1].versao

export class BancoDeDados extends Dexie {
  declare diaconisas: EntityTable<Diaconisa, 'id'>
  declare enderecos: EntityTable<Endereco, 'id'>
  declare pessoas: EntityTable<PessoaVisitada, 'id'>
  declare visitas: EntityTable<Visita, 'id'>
  declare rascunho: EntityTable<Rascunho, 'id'>
  declare configuracoes: EntityTable<Configuracoes, 'id'>
  declare dicionarioPessoal: EntityTable<PalavraPessoal, 'palavra'>

  constructor(nome: string = NOME_DO_BANCO, opcoes?: DexieOptions) {
    super(nome, opcoes)
    for (const v of VERSOES) {
      const versao = this.version(v.versao).stores(v.tabelas)
      if (v.migrar) versao.upgrade(v.migrar)
    }
  }
}
