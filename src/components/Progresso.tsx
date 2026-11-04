interface Props {
  passo: number
  total: number
}

/** "Passo 2 de 5" + barra de progresso. */
export function Progresso({ passo, total }: Props) {
  const percentual = Math.min(100, Math.max(0, (passo / total) * 100))
  return (
    <div>
      <p className="mb-2 text-[1.1rem] font-bold">
        Passo {passo} de {total}
      </p>
      <div
        role="progressbar"
        aria-label={`Passo ${passo} de ${total}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={passo}
        className="h-4 w-full overflow-hidden rounded-full border-2 border-primaria bg-papel"
      >
        <div
          className="h-full rounded-full bg-primaria transition-[width] motion-reduce:transition-none"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}
