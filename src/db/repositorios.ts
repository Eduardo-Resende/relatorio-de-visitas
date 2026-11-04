import type {
  Configuracoes,
  DadosEndereco,
  DataIso,
  Diaconisa,
  Endereco,
  Id,
  PessoaComEndereco,
  PessoaVisitada,
  Rascunho,
  Visita,
} from './tipos'

/*
  Interfaces dos repositórios.
  As telas só conhecem ESTAS interfaces. Para trocar o armazenamento local por um servidor
  no futuro, basta escrever outra implementação (hoje: src/db/dexie/).
*/

export interface OpcoesListagem {
  /** Inclui as arquivadas (padrão: não). */
  incluirArquivadas?: boolean
}

export interface OpcoesDuplicado {
  /** Cria mesmo que já exista alguém com o mesmo nome (depois de a usuária confirmar). */
  permitirDuplicado?: boolean
}

export interface DadosPessoa {
  nome: string
  /** Aceita com ou sem máscara; é guardado só com números. Vazio apaga o telefone. */
  telefone?: string
}

/** "apagada" = removida de vez; "arquivada" = já aparece em visitas, então só foi escondida. */
export type ResultadoRemocao = 'apagada' | 'arquivada'

export interface RepositorioDiaconisas {
  listar(opcoes?: OpcoesListagem): Promise<Diaconisa[]>
  buscar(texto: string, opcoes?: OpcoesListagem): Promise<Diaconisa[]>
  obter(id: Id): Promise<Diaconisa | undefined>
  /** Procura por nome ignorando acentos e maiúsculas (inclui arquivadas). */
  encontrarPorNome(nome: string, ignorarId?: Id): Promise<Diaconisa | undefined>
  /** @throws ErroValidacao | ErroNomeDuplicado */
  criar(dados: DadosPessoa, opcoes?: OpcoesDuplicado): Promise<Diaconisa>
  atualizar(id: Id, dados: Partial<DadosPessoa>, opcoes?: OpcoesDuplicado): Promise<Diaconisa>
  arquivar(id: Id): Promise<void>
  reativar(id: Id): Promise<void>
  /** Apaga de verdade só se nunca apareceu em visitas; senão arquiva. */
  remover(id: Id): Promise<ResultadoRemocao>
}

export interface RepositorioEnderecos {
  listar(): Promise<Endereco[]>
  obter(id: Id): Promise<Endereco | undefined>
  /** Busca por rua, setor, QD, LT ou NUM. */
  buscar(texto: string): Promise<Endereco[]>
  /** Reaproveita o endereço se já existir um igual (ignorando acentos e maiúsculas). */
  obterOuCriar(dados: DadosEndereco): Promise<Endereco>
  /**
   * Corrige um endereço (vale para todos que moram nele).
   * Se o novo endereço ficar igual a outro já cadastrado, os dois são juntados.
   */
  atualizar(id: Id, dados: DadosEndereco): Promise<Endereco>
  /** Apaga o endereço se ninguém mais mora nele. */
  removerSeSemMoradores(id: Id): Promise<boolean>
}

export type DestinoEndereco = { enderecoId: Id } | { endereco: DadosEndereco }

export interface RepositorioPessoas {
  listar(opcoes?: OpcoesListagem): Promise<PessoaComEndereco[]>
  /** Busca pelo nome ou pelo endereço. */
  buscar(texto: string, opcoes?: OpcoesListagem): Promise<PessoaComEndereco[]>
  obter(id: Id): Promise<PessoaVisitada | undefined>
  obterComEndereco(id: Id): Promise<PessoaComEndereco | undefined>
  encontrarPorNome(nome: string, ignorarId?: Id): Promise<PessoaVisitada | undefined>
  /** Quem mais mora no mesmo endereço. */
  moradoresDoEndereco(enderecoId: Id, opcoes?: OpcoesListagem): Promise<PessoaVisitada[]>
  /** @throws ErroValidacao | ErroNomeDuplicado */
  criar(dados: DadosPessoa & DestinoEndereco, opcoes?: OpcoesDuplicado): Promise<PessoaVisitada>
  atualizar(id: Id, dados: Partial<DadosPessoa>, opcoes?: OpcoesDuplicado): Promise<PessoaVisitada>
  /**
   * Muda o endereço cadastrado de uma ou mais pessoas (reaproveita endereço igual).
   * Endereços que ficarem sem moradores são apagados.
   */
  mudarEndereco(ids: Id[], destino: DestinoEndereco): Promise<Endereco>
  arquivar(id: Id): Promise<void>
  reativar(id: Id): Promise<void>
  remover(id: Id): Promise<ResultadoRemocao>
}

export interface EntradaVisita {
  data: DataIso
  diaconisaIds: Id[]
  pessoaIds: Id[]
  endereco: DadosEndereco
  observacoes: string
}

export interface FiltroVisitas {
  /** Primeiro dia (inclusive), AAAA-MM-DD. */
  de?: DataIso
  /** Último dia (inclusive), AAAA-MM-DD. */
  ate?: DataIso
  /** Nome de diaconisa ou de pessoa visitada. */
  busca?: string
  /** "desc" = mais recente primeiro (padrão); "asc" = ordem cronológica (usada no PDF). */
  ordem?: 'asc' | 'desc'
}

export interface RepositorioVisitas {
  /**
   * Cria a visita guardando uma CÓPIA (snapshot) de nomes, telefones e endereço.
   * Mudanças futuras nos cadastros não alteram visitas já feitas.
   */
  criar(entrada: EntradaVisita): Promise<Visita>
  /** Ao editar, quem já estava na visita mantém a cópia antiga; quem entrou agora usa os dados atuais. */
  atualizar(id: Id, entrada: EntradaVisita): Promise<Visita>
  obter(id: Id): Promise<Visita | undefined>
  listar(filtro?: FiltroVisitas): Promise<Visita[]>
  contar(filtro?: FiltroVisitas): Promise<number>
  apagar(id: Id): Promise<void>
}

export interface RepositorioRascunho {
  obter(): Promise<Rascunho | undefined>
  salvar(estado: unknown): Promise<void>
  limpar(): Promise<void>
}

export interface RepositorioConfiguracoes {
  /** Sempre devolve valores completos (usa o padrão no que ainda não foi escolhido). */
  obter(): Promise<Configuracoes>
  salvar(alteracoes: Partial<Omit<Configuracoes, 'id'>>): Promise<Configuracoes>
}

export interface RepositorioDicionarioPessoal {
  listar(): Promise<string[]>
  adicionar(palavra: string): Promise<void>
  remover(palavra: string): Promise<void>
}

export interface Repositorios {
  diaconisas: RepositorioDiaconisas
  enderecos: RepositorioEnderecos
  pessoas: RepositorioPessoas
  visitas: RepositorioVisitas
  rascunho: RepositorioRascunho
  configuracoes: RepositorioConfiguracoes
  dicionarioPessoal: RepositorioDicionarioPessoal
}
