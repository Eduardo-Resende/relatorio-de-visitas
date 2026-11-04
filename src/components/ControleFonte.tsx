import { useTamanhoFonte } from '../hooks/useTamanhoFonte'

/** Botões "A-" e "A+" para mudar o tamanho da letra. A escolha fica salva. */
export function ControleFonte() {
  const { aumentar, diminuir, podeAumentar, podeDiminuir } = useTamanhoFonte()
  const classe =
    'flex min-h-14 min-w-14 items-center justify-center rounded-xl border-2 border-white bg-primaria-escura ' +
    'px-3 text-[1.25rem] font-extrabold text-white hover:bg-black disabled:opacity-50'
  return (
    <div role="group" aria-label="Tamanho da letra" className="flex gap-2">
      <button
        type="button"
        onClick={diminuir}
        disabled={!podeDiminuir}
        aria-label="Diminuir a letra"
        title="Diminuir a letra"
        className={classe}
      >
        A-
      </button>
      <button
        type="button"
        onClick={aumentar}
        disabled={!podeAumentar}
        aria-label="Aumentar a letra"
        title="Aumentar a letra"
        className={classe}
      >
        A+
      </button>
    </div>
  )
}
