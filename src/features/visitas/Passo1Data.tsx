import { useState } from 'react'
import { Calendar, CalendarCheck, CalendarDays } from 'lucide-react'
import { BotaoGrande } from '../../components/BotaoGrande'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import {
  ehDataFutura,
  formatarDataParaExibicao,
  obterDataHojeIso,
  obterDataOntemIso,
} from '../../lib/data'

interface Props {
  data: string
  aoMudarData: (novaData: string) => void
  erro?: string
  aoLimparErro: () => void
}

/** Passo 1: Escolha da data da visita (padrão Hoje, com atalhos Hoje e Ontem). */
export function Passo1Data({ data, aoMudarData, erro, aoLimparErro }: Props) {
  const [dataParaConfirmarFutura, setDataParaConfirmarFutura] = useState<string | null>(null)

  function selecionar(novaData: string) {
    aoLimparErro()
    aoMudarData(novaData)
  }

  const hoje = obterDataHojeIso()
  const ontem = obterDataOntemIso()
  const ehHoje = data === hoje
  const ehOntem = data === ontem

  return (
    <section aria-labelledby="titulo-passo-data" className="space-y-6">
      <div>
        <h2 id="titulo-passo-data" className="text-[1.3rem] font-bold text-primaria">
          Quando foi realizada a visita?
        </h2>
        <p className="mt-1 text-texto-suave">
          Você pode usar os botões rápidos ou escolher qualquer outro dia no calendário.
        </p>
      </div>

      {/* Botões rápidos: Hoje e Ontem */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <BotaoGrande
          icone={CalendarCheck}
          variante={ehHoje ? 'primario' : 'secundario'}
          onClick={() => selecionar(hoje)}
          aria-pressed={ehHoje}
        >
          Hoje ({formatarDataParaExibicao(hoje)})
        </BotaoGrande>

        <BotaoGrande
          icone={CalendarDays}
          variante={ehOntem ? 'primario' : 'secundario'}
          onClick={() => selecionar(ontem)}
          aria-pressed={ehOntem}
        >
          Ontem ({formatarDataParaExibicao(ontem)})
        </BotaoGrande>
      </div>

      {/* Seletor manual de data com campo grande */}
      <div className="rounded-2xl border-2 border-borda bg-papel p-5 shadow-xs">
        <label htmlFor="campo-data-visita" className="block text-[1.1rem] font-bold text-primaria">
          Escolher outra data:
        </label>
        <div className="mt-2 flex items-center gap-3">
          <Calendar aria-hidden="true" className="size-8 text-primaria" />
          <input
            id="campo-data-visita"
            type="date"
            value={data}
            onChange={(e) => selecionar(e.target.value)}
            className="w-full rounded-xl border-2 border-primaria bg-white px-4 py-3 text-[1.2rem] font-bold text-primaria outline-none focus:ring-4 focus:ring-primaria/30"
          />
        </div>

        {data && (
          <p className="mt-3 text-[1.1rem] font-medium text-texto">
            Data selecionada:{' '}
            <strong className="text-primaria">{formatarDataParaExibicao(data)}</strong>
            {ehDataFutura(data) && (
              <span className="ml-2 inline-block rounded-md bg-alerta/20 px-2 py-0.5 text-[0.95rem] font-bold text-alerta">
                (Data no futuro)
              </span>
            )}
          </p>
        )}

        {erro && (
          <p role="alert" className="mt-3 text-[1rem] font-bold text-perigo">
            {erro}
          </p>
        )}
      </div>

      {/* Confirmação caso o usuário tenha escolhido data futura */}
      {dataParaConfirmarFutura && (
        <DialogoConfirmacao
          aberto={Boolean(dataParaConfirmarFutura)}
          titulo="Essa data é no futuro. Está certo?"
          mensagem={`A data selecionada é ${formatarDataParaExibicao(dataParaConfirmarFutura)}, que ainda não chegou. Deseja manter esta data?`}
          textoConfirmar="Sim, a data é essa"
          textoCancelar="Não, quero mudar"
          onConfirmar={() => {
            aoMudarData(dataParaConfirmarFutura)
            setDataParaConfirmarFutura(null)
          }}
          onCancelar={() => setDataParaConfirmarFutura(null)}
        />
      )}
    </section>
  )
}
