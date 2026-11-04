import { useEffect, useRef, type ReactNode } from 'react'
import { House, type LucideIcon } from 'lucide-react'
import { LinkGrande } from './BotaoGrande'

interface Props {
  titulo: string
  icone: LucideIcon
  children: ReactNode
  /** Mostra o botão "Voltar ao início" no topo (padrão: sim). */
  mostrarInicio?: boolean
}

/** Moldura padrão de uma tela: botão de início, título grande e conteúdo. */
export function Pagina({ titulo, icone: Icone, children, mostrarInicio = true }: Props) {
  const tituloRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = `${titulo} - Relatório de Visitas`
    // Leva o foco ao título: leitores de tela anunciam a nova tela e o teclado começa do topo.
    tituloRef.current?.focus({ preventScroll: true })
  }, [titulo])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      {mostrarInicio && (
        <LinkGrande para="/" icone={House} variante="secundario" cheio={false}>
          Voltar ao início
        </LinkGrande>
      )}
      <h1
        ref={tituloRef}
        tabIndex={-1}
        className={`flex items-center gap-3 text-[1.75rem] font-extrabold leading-tight outline-none ${mostrarInicio ? 'mt-6' : ''}`}
      >
        <Icone aria-hidden="true" strokeWidth={2.5} className="size-10 shrink-0 text-primaria" />
        <span>{titulo}</span>
      </h1>
      <div className="mt-6">{children}</div>
    </div>
  )
}
