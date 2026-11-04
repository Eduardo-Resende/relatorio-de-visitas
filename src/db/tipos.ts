/** Identificador único (uuid). */
export type Id = string
/** Data sem hora, no formato AAAA-MM-DD (evita problemas de fuso horário). */
export type DataIso = string
/** Momento exato, no formato ISO completo (new Date().toISOString()). */
export type InstanteIso = string

export interface Diaconisa {
  id: Id
  nome: string
  /** Nome sem acentos e em minúsculas, para buscar e achar duplicados. */
  nomeNormalizado: string
  /** Só números (ex.: "62999999999"). A máscara é aplicada só na hora de mostrar. */
  telefone?: string
  /** false = arquivada (some das listas de seleção, mas o histórico permanece). */
  ativa: boolean
  criadoEm: InstanteIso
}

export interface DadosEndereco {
  /** Rua ou avenida. */
  logradouro: string
  /** QD */
  quadra: string
  /** LT */
  lote: string
  /** NUM (aceita "S/N") */
  numero: string
  setor: string
  complemento?: string
}

/** Endereço reaproveitável: várias pessoas podem apontar para o mesmo. */
export interface Endereco extends DadosEndereco {
  id: Id
  /** logradouro+QD+LT+NUM+setor sem acentos e em minúsculas (impede duplicados). */
  chaveNormalizada: string
}

export interface PessoaVisitada {
  id: Id
  nome: string
  nomeNormalizado: string
  telefone?: string
  enderecoId: Id
  ativa: boolean
  criadoEm: InstanteIso
}

export type PessoaComEndereco = PessoaVisitada & { endereco: Endereco }

/** Cópia (snapshot) de uma pessoa/diaconisa no momento da visita. */
export interface PessoaNaVisita {
  id: Id
  nome: string
  telefone?: string
}

/** Cópia (snapshot) do endereço no momento da visita. */
export type EnderecoVisita = Pick<DadosEndereco, 'logradouro' | 'quadra' | 'lote' | 'numero' | 'setor'>

export interface Visita {
  id: Id
  data: DataIso
  diaconisas: PessoaNaVisita[]
  pessoas: PessoaNaVisita[]
  endereco: EnderecoVisita
  /** Sem limite de tamanho. */
  observacoes: string
  /** Derivado de diaconisas/pessoas (índices para achar "esta pessoa já aparece em visitas?"). */
  diaconisaIds: Id[]
  pessoaIds: Id[]
  criadoEm: InstanteIso
  atualizadoEm: InstanteIso
}

/** Estado do assistente de nova visita guardado enquanto ela não termina (formato definido na Fase 4). */
export interface Rascunho {
  id: 'atual'
  estado: unknown
  atualizadoEm: InstanteIso
}

export type DiaDaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Configuracoes {
  id: 'config'
  tamanhoFonte: number
  /** DDD usado quando só digitam 8 ou 9 números. */
  dddPadrao: string
  /** 0 = domingo (padrão) ... 6 = sábado */
  primeiroDiaSemana: DiaDaSemana
  /** Quando foi feita a última cópia de segurança. */
  ultimaCopiaEm?: InstanteIso
}

/** Palavra que a usuária mandou "sempre aceitar" no corretor (nomes de pessoas e bairros). */
export interface PalavraPessoal {
  palavra: string
}
