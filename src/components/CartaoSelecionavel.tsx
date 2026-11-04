import { Circle, CircleDot, Square, SquareCheckBig } from 'lucide-react'

interface Props {
  titulo: string
  subtitulo?: string
  selecionado: boolean
  onAlternar: () => void
  /** "caixa" = pode marcar várias; "opcao" = só uma. */
  tipo?: 'caixa' | 'opcao'
  desabilitado?: boolean
}

/** Cartão grande que se marca com um toque. O estado aparece por ícone e borda, não só por cor. */
export function CartaoSelecionavel({
  titulo,
  subtitulo,
  selecionado,
  onAlternar,
  tipo = 'caixa',
  desabilitado,
}: Props) {
  const Marca =
    tipo === 'caixa' ? (selecionado ? SquareCheckBig : Square) : selecionado ? CircleDot : Circle
  return (
    <button
      type="button"
      role={tipo === 'caixa' ? 'checkbox' : 'radio'}
      aria-checked={selecionado}
      disabled={desabilitado}
      onClick={onAlternar}
      className={
        'flex min-h-20 w-full items-center gap-4 rounded-2xl border-[3px] px-4 py-3 text-left transition ' +
        'motion-reduce:transition-none disabled:opacity-60 ' +
        (selecionado
          ? 'border-primaria bg-primaria-clara'
          : 'border-borda bg-papel hover:bg-primaria-clara')
      }
    >
      <Marca
        aria-hidden="true"
        strokeWidth={2.5}
        className={'size-9 shrink-0 ' + (selecionado ? 'text-primaria' : 'text-texto-suave')}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[1.1rem] font-bold">{titulo}</span>
        {subtitulo && <span className="block text-texto-suave">{subtitulo}</span>}
      </span>
    </button>
  )
}
