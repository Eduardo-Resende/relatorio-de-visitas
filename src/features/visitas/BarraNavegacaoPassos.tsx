import { ArrowLeft, ArrowRight, Check, House } from 'lucide-react'
import { BotaoGrande } from '../../components/BotaoGrande'

interface Props {
  passo: number
  totalPassos?: number
  aoVoltar: () => void
  aoAvancar: () => void
  avancarDesabilitado?: boolean
  salvando?: boolean
  textoAvancar?: string
  modoEdicao?: boolean
}

/**
 * Barra fixa inferior com botões "Voltar" e "Continuar / Salvar".
 * Fica fixa no rodapé para facilidade de toque no celular com uma só mão.
 */
export function BarraNavegacaoPassos({
  passo,
  totalPassos = 6,
  aoVoltar,
  aoAvancar,
  avancarDesabilitado = false,
  salvando = false,
  textoAvancar,
  modoEdicao = false,
}: Props) {
  const ehUltimoPasso = passo === totalPassos

  return (
    <footer
      role="region"
      aria-label="Controles do assistente"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-borda bg-papel/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="w-1/2">
          {passo > 1 ? (
            <BotaoGrande
              icone={ArrowLeft}
              variante="secundario"
              onClick={aoVoltar}
              disabled={salvando}
              aria-label="Voltar para o passo anterior"
            >
              Voltar
            </BotaoGrande>
          ) : (
            <BotaoGrande
              icone={House}
              variante="secundario"
              onClick={aoVoltar}
              disabled={salvando}
              aria-label="Sair e voltar ao início"
            >
              Início
            </BotaoGrande>
          )}
        </div>

        <div className="w-1/2">
          <BotaoGrande
            icone={ehUltimoPasso ? Check : ArrowRight}
            variante={ehUltimoPasso ? 'sucesso' : 'primario'}
            onClick={aoAvancar}
            disabled={avancarDesabilitado || salvando}
            aria-label={
              ehUltimoPasso
                ? modoEdicao
                  ? 'Salvar alterações da visita'
                  : 'Salvar visita'
                : `Avançar para o passo ${passo + 1}`
            }
          >
            {textoAvancar ??
              (ehUltimoPasso
                ? salvando
                  ? 'Salvando...'
                  : modoEdicao
                    ? 'Salvar visita'
                    : 'Salvar visita'
                : 'Continuar')}
          </BotaoGrande>
        </div>
      </div>
    </footer>
  )
}

