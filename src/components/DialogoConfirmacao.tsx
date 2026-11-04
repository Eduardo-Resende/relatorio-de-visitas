import { useEffect, useId, useRef } from 'react'
import { ArrowLeft, Check, type LucideIcon } from 'lucide-react'
import { BotaoGrande, type VarianteBotao } from './BotaoGrande'

interface Props {
  aberto: boolean
  titulo: string
  mensagem?: string
  textoConfirmar: string
  textoCancelar: string
  variante?: VarianteBotao
  iconeConfirmar?: LucideIcon
  onConfirmar: () => void
  onCancelar: () => void
}

/**
 * Pergunta de confirmação (ex.: "Tem certeza que quer apagar esta visita?").
 * Usa <dialog> nativo: o foco fica preso na caixa e Esc = "Não, voltar".
 * O botão "Não, voltar" vem primeiro e recebe o foco, para evitar toque sem querer.
 */
export function DialogoConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar,
  textoCancelar,
  variante = 'perigo',
  iconeConfirmar = Check,
  onConfirmar,
  onCancelar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-titulo`}
      aria-describedby={mensagem ? `${id}-msg` : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onCancelar()
      }}
      className="m-auto w-[min(92vw,34rem)] max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-borda bg-papel p-6 text-texto backdrop:bg-black/60"
    >
      <h2 id={`${id}-titulo`} className="text-2xl font-extrabold">
        {titulo}
      </h2>
      {mensagem && (
        <p id={`${id}-msg`} className="mt-3 text-[1.05rem]">
          {mensagem}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        <BotaoGrande icone={ArrowLeft} variante="secundario" onClick={onCancelar} autoFocus>
          {textoCancelar}
        </BotaoGrande>
        <BotaoGrande icone={iconeConfirmar} variante={variante} onClick={onConfirmar}>
          {textoConfirmar}
        </BotaoGrande>
      </div>
    </dialog>
  )
}
