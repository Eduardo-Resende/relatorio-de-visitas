import type { DadosEndereco, DataIso, EnderecoVisita } from '../db/tipos'
import { ErroValidacao } from './erros'
import { limparEspacos, somenteDigitos } from './texto'

/** Confere o nome e devolve ele limpo (sem espaços extras). */
export function validarNome(nome: string | undefined): string {
  const limpo = limparEspacos(nome ?? '')
  if (!limpo) throw new ErroValidacao('nome', 'Faltou escrever o nome.')
  if (!/\p{L}/u.test(limpo)) {
    throw new ErroValidacao('nome', 'O nome precisa ter letras. Não pode ser só números.')
  }
  if (limpo.length < 3) {
    throw new ErroValidacao('nome', 'O nome está muito curto. Escreva pelo menos 3 letras.')
  }
  return limpo
}

/**
 * Telefone é opcional. Se preenchido, precisa ter 10 ou 11 números (DDD + número).
 * Devolve só os números, ou undefined se estiver vazio.
 */
export function validarTelefone(telefone: string | undefined): string | undefined {
  const digitos = somenteDigitos(telefone ?? '')
  if (!digitos) return undefined
  if (digitos.length !== 10 && digitos.length !== 11) {
    throw new ErroValidacao(
      'telefone',
      'O telefone precisa ter o DDD e mais 8 ou 9 números. Exemplo: (62) 99999-9999.',
    )
  }
  return digitos
}

/** Rua e Setor são obrigatórios. QD, LT e NUM são opcionais (NUM aceita "S/N"). */
export function validarEndereco(dados: Partial<DadosEndereco>): DadosEndereco {
  const logradouro = limparEspacos(dados.logradouro ?? '')
  const setor = limparEspacos(dados.setor ?? '')
  if (!logradouro) throw new ErroValidacao('logradouro', 'Faltou escrever a rua.')
  if (!setor) throw new ErroValidacao('setor', 'Faltou escrever o setor.')
  const complemento = limparEspacos(dados.complemento ?? '')
  return {
    logradouro,
    quadra: limparEspacos(dados.quadra ?? ''),
    lote: limparEspacos(dados.lote ?? ''),
    numero: limparEspacos(dados.numero ?? ''),
    setor,
    ...(complemento ? { complemento } : {}),
  }
}

/** Parte do endereço que fica guardada dentro da visita (sem complemento). */
export function enderecoDaVisita(dados: Partial<DadosEndereco>): EnderecoVisita {
  const { logradouro, quadra, lote, numero, setor } = validarEndereco(dados)
  return { logradouro, quadra, lote, numero, setor }
}

/** A data da visita precisa existir de verdade (AAAA-MM-DD). */
export function validarDataIso(data: string | undefined): DataIso {
  if (!data) throw new ErroValidacao('data', 'Faltou escolher a data.')
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data)
  if (!m) throw new ErroValidacao('data', 'Essa data não está certa. Use dia, mês e ano.')
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(ano, mes - 1, dia))
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    throw new ErroValidacao('data', 'Essa data não existe no calendário.')
  }
  return data
}
