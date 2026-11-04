/** Erro de dado inválido, com mensagem já em linguagem simples para mostrar à usuária. */
export class ErroValidacao extends Error {
  /** Nome do campo com problema (ex.: "nome", "setor"), para mostrar a mensagem perto dele. */
  campo: string

  constructor(campo: string, mensagem: string) {
    super(mensagem)
    this.name = 'ErroValidacao'
    this.campo = campo
  }
}

/**
 * Já existe alguém com este nome (ignorando acentos e maiúsculas).
 * Leva a pessoa/diaconisa existente, para a tela perguntar "Quer usar a que já existe?".
 */
export class ErroNomeDuplicado<T> extends Error {
  existente: T

  constructor(nome: string, existente: T) {
    super(`Já existe uma ${nome}. Quer usar a que já existe?`)
    this.name = 'ErroNomeDuplicado'
    this.existente = existente
  }
}

/** Não encontramos o registro pedido (ex.: foi apagado por outra tela). */
export class ErroNaoEncontrado extends Error {
  constructor(o_que: string) {
    super(`Não encontrei ${o_que}.`)
    this.name = 'ErroNaoEncontrado'
  }
}
