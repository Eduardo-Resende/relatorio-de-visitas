import type { LucideIcon } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { Pagina } from '../components/Pagina'

/** Tela provisória das partes que serão feitas nas próximas fases. */
export function PaginaEmBreve({ titulo, icone }: { titulo: string; icone: LucideIcon }) {
  return (
    <Pagina titulo={titulo} icone={icone}>
      <Aviso tipo="info" titulo="Em preparação">
        Esta parte do aplicativo ainda está sendo construída.
      </Aviso>
    </Pagina>
  )
}
