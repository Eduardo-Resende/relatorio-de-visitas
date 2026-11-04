import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export type VarianteBotao = 'primario' | 'secundario' | 'sucesso' | 'perigo'
export type TamanhoBotao = 'normal' | 'enorme'

interface PropsComuns {
  /** Ícone obrigatório: nunca mostramos botão só com ícone. */
  icone: LucideIcon
  children: ReactNode
  variante?: VarianteBotao
  tamanho?: TamanhoBotao
  /** Ocupa a largura toda (padrão: sim). */
  cheio?: boolean
  className?: string
}

const BASE =
  'inline-flex items-center gap-3 rounded-2xl border-2 font-bold no-underline select-none ' +
  'transition active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTES: Record<VarianteBotao, string> = {
  primario: 'border-primaria-escura bg-primaria text-white hover:bg-primaria-escura',
  secundario: 'border-primaria bg-papel text-primaria hover:bg-primaria-clara',
  sucesso: 'border-sucesso-escura bg-sucesso text-white hover:bg-sucesso-escura',
  perigo: 'border-perigo-escura bg-perigo text-white hover:bg-perigo-escura',
}

const TAMANHOS: Record<TamanhoBotao, string> = {
  // 3.5rem = 70px com a letra normal (mínimo pedido: 56px).
  normal: 'min-h-14 justify-center px-6 py-3 text-center text-[1rem]',
  enorme: 'min-h-24 justify-start gap-5 px-6 py-4 text-left text-[1.3rem]',
}

function classes({ variante = 'primario', tamanho = 'normal', cheio = true, className = '' }: PropsComuns) {
  return [BASE, VARIANTES[variante], TAMANHOS[tamanho], cheio ? 'w-full' : '', className].join(' ')
}

function Conteudo({ icone: Icone, tamanho = 'normal', children }: PropsComuns) {
  return (
    <>
      <Icone
        aria-hidden="true"
        strokeWidth={2.5}
        className={tamanho === 'enorme' ? 'size-10 shrink-0' : 'size-[1.4em] shrink-0'}
      />
      <span>{children}</span>
    </>
  )
}

type PropsBotao = PropsComuns & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

/** Botão grande com ícone + texto. */
export function BotaoGrande(props: PropsBotao) {
  const { icone, children, variante, tamanho, cheio, className, type = 'button', ...resto } = props
  const comuns = { icone, children, variante, tamanho, cheio, className }
  return (
    <button type={type} className={classes(comuns)} {...resto}>
      <Conteudo {...comuns} />
    </button>
  )
}

/** Link (troca de tela) com a mesma aparência do botão grande. */
export function LinkGrande(props: PropsComuns & { para: string }) {
  const { para, ...comuns } = props
  return (
    <Link to={para} className={classes(comuns)}>
      <Conteudo {...comuns} />
    </Link>
  )
}
