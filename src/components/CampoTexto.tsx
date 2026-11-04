import { useId, type InputHTMLAttributes, type Ref } from 'react'
import { CircleAlert } from 'lucide-react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  rotulo: string
  /** Mensagem amigável de erro, mostrada perto do campo. */
  erro?: string
  dica?: string
  ref?: Ref<HTMLInputElement>
}

/** Campo de texto grande com rótulo sempre visível e erro ao lado, sem bloquear a tela. */
export function CampoTexto({ rotulo, erro, dica, className = '', ref, ...resto }: Props) {
  const id = useId()
  const idErro = `${id}-erro`
  const idDica = `${id}-dica`
  const descricao = [dica ? idDica : '', erro ? idErro : ''].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[1.1rem] font-bold">
        {rotulo}
      </label>
      {dica && (
        <p id={idDica} className="mb-2 text-texto-suave">
          {dica}
        </p>
      )}
      <input
        id={id}
        ref={ref}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao}
        className={
          'min-h-14 w-full rounded-xl border-2 bg-papel px-4 py-2 text-[1rem] ' +
          (erro ? 'border-perigo ' : 'border-borda ') +
          className
        }
        {...resto}
      />
      {erro && (
        <p id={idErro} role="alert" className="mt-2 flex items-start gap-2 font-bold text-perigo">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-[1.3em] shrink-0" strokeWidth={2.5} />
          <span>{erro}</span>
        </p>
      )}
    </div>
  )
}
