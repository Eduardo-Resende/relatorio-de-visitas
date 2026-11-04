import { useEffect, useRef } from 'react'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'

interface Props {
  observacoes: string
  aoMudarObservacoes: (novoTexto: string) => void
  confirmarVaziaAberto: boolean
  aoConfirmarVazia: () => void
  aoCancelarVazia: () => void
}

/** Passo 5: Campo de texto livre para as anotações e pedidos de oração da visita. */
export function Passo5Observacoes({
  observacoes,
  aoMudarObservacoes,
  confirmarVaziaAberto,
  aoConfirmarVazia,
  aoCancelarVazia,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ajusta a altura da caixa automaticamente conforme o texto cresce
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(220, el.scrollHeight + 10)}px`
  }, [observacoes])

  const caracteres = observacoes.length

  return (
    <section aria-labelledby="titulo-passo-observacoes" className="space-y-6">
      <div>
        <h2 id="titulo-passo-observacoes" className="text-[1.3rem] font-bold text-primaria">
          Observações da visita
        </h2>
        <p className="mt-1 text-texto-suave">
          Escreva o que foi conversado, pedidos de oração, necessidades ou informações importantes.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="campo-observacoes" className="sr-only">
          Observações da visita
        </label>
        <textarea
          ref={textareaRef}
          id="campo-observacoes"
          value={observacoes}
          onChange={(e) => aoMudarObservacoes(e.target.value)}
          placeholder="Escreva aqui as anotações da visita pastoral..."
          spellCheck
          lang="pt-BR"
          autoCapitalize="sentences"
          className="w-full rounded-2xl border-3 border-primaria bg-white p-4 text-[1.15rem] leading-relaxed text-texto outline-none transition focus:border-primaria-escura focus:ring-4 focus:ring-primaria/30 scroll-mb-32"
          style={{ minHeight: '14rem' }}
          onFocus={(e) => {
            // Garante que o campo role para ficar bem visível acima do teclado e barra fixa
            setTimeout(() => {
              e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })
            }, 100)
          }}
        />

        <div className="flex items-center justify-between px-2 text-[0.95rem] text-texto-suave">
          <span>Sem limite de tamanho</span>
          <span>{caracteres.toLocaleString('pt-BR')} caracteres</span>
        </div>
      </div>

      {/* Confirmação caso o campo esteja vazio */}
      {confirmarVaziaAberto && (
        <DialogoConfirmacao
          aberto={confirmarVaziaAberto}
          titulo="Quer salvar sem observações?"
          mensagem="Você não escreveu nenhuma anotação sobre esta visita. Deseja continuar mesmo assim?"
          textoConfirmar="Sim, continuar sem observações"
          textoCancelar="Não, voltar para escrever"
          onConfirmar={aoConfirmarVazia}
          onCancelar={aoCancelarVazia}
        />
      )}
    </section>
  )
}
