/**
 * Utilitários de data para o aplicativo.
 * As datas são mantidas em formato ISO simplificado: AAAA-MM-DD.
 * Usamos a data local do dispositivo para evitar discrepâncias de fuso horário.
 */

/** Devolve a data de hoje no formato AAAA-MM-DD considerando o fuso local. */
export function obterDataHojeIso(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Devolve a data de ontem no formato AAAA-MM-DD considerando o fuso local. */
export function obterDataOntemIso(): string {
  const data = new Date()
  data.setDate(data.getDate() - 1)
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/** Converte AAAA-MM-DD para DD/MM/AAAA para exibição legível. */
export function formatarDataParaExibicao(dataIso: string | undefined): string {
  if (!dataIso) return ''
  const partes = dataIso.split('-')
  if (partes.length !== 3) return dataIso
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

/** Converte DD/MM/AAAA para AAAA-MM-DD se válido. */
export function formatarDataBrParaIso(dataBr: string): string | undefined {
  const limpo = dataBr.trim()
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpo)
  if (!m) return undefined
  const [, dia, mes, ano] = m
  return `${ano}-${mes}-${dia}`
}

/** Confere se uma data AAAA-MM-DD está estritamente no futuro em relação a hoje. */
export function ehDataFutura(dataIso: string): boolean {
  const hoje = obterDataHojeIso()
  return dataIso > hoje
}

