import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react'

export type TipoAviso = 'info' | 'sucesso' | 'atencao' | 'erro'

interface Props {
  tipo?: TipoAviso
  titulo?: string
  children: ReactNode
  /** Versão grande, para mensagens de sucesso após salvar. */
  grande?: boolean
}

const ESTILOS: Record<TipoAviso, { classe: string; icone: LucideIcon; cor: string }> = {
  info: { classe: 'border-primaria bg-primaria-clara', icone: Info, cor: 'text-primaria' },
  sucesso: { classe: 'border-sucesso bg-sucesso-clara', icone: CircleCheck, cor: 'text-sucesso' },
  atencao: { classe: 'border-atencao bg-atencao-clara', icone: TriangleAlert, cor: 'text-atencao' },
  erro: { classe: 'border-perigo bg-perigo-clara', icone: CircleAlert, cor: 'text-perigo' },
}

/** Mensagem destacada (ícone + texto, nunca só cor). */
export function Aviso({ tipo = 'info', titulo, children, grande }: Props) {
  const { classe, icone: Icone, cor } = ESTILOS[tipo]
  return (
    <div
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`flex items-start gap-4 rounded-2xl border-[3px] p-4 ${classe} ${grande ? 'p-6' : ''}`}
    >
      <Icone
        aria-hidden="true"
        strokeWidth={2.5}
        className={`shrink-0 ${cor} ${grande ? 'size-14' : 'size-9'}`}
      />
      <div className="min-w-0">
        {titulo && (
          <p className={`font-extrabold ${grande ? 'text-2xl' : 'text-[1.15rem]'}`}>{titulo}</p>
        )}
        <div className={grande ? 'mt-1 text-[1.1rem]' : ''}>{children}</div>
      </div>
    </div>
  )
}
