import type { DadosEndereco } from '../../db/tipos'

export type ModoEndereco = 'mesmo' | 'escolhido' | 'outro'

export interface EstadoAssistente {
  /** Passo atual (1 a 6). */
  passo: number
  /** Data no formato AAAA-MM-DD. */
  data: string
  /** IDs das diaconisas que participaram da visita. */
  diaconisaIds: string[]
  /** IDs das pessoas que foram visitadas. */
  pessoaIds: string[]
  /** Como o endereço foi definido no passo 4. */
  modoEndereco: ModoEndereco
  /** Quando escolheu um dos endereços das pessoas (caso tenham endereços diferentes). */
  enderecoIdEscolhido?: string
  /** Quando escolheu "Não/Outro endereço" e digitou um endereço manual. */
  enderecoManual?: DadosEndereco
  /** Se digitou outro endereço, se quer atualizar o cadastro das pessoas para ele. */
  atualizarCadastroPessoas: boolean
  /** Observações da visita (sem limite de caracteres). */
  observacoes: string
  /** Presente apenas quando o assistente está editando uma visita já existente (Fase 6). */
  visitaOrigemId?: string
}

export const ESTADO_INICIAL_ASSISTENTE: EstadoAssistente = {
  passo: 1,
  data: '',
  diaconisaIds: [],
  pessoaIds: [],
  modoEndereco: 'mesmo',
  atualizarCadastroPessoas: false,
  observacoes: '',
}

