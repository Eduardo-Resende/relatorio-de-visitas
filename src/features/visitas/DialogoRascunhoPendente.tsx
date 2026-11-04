import { useState } from 'react'
import { ClipboardPlus, Play, Trash2 } from 'lucide-react'
import { BotaoGrande } from '../../components/BotaoGrande'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import { Pagina } from '../../components/Pagina'
import { formatarDataParaExibicao } from '../../lib/data'
import type { EstadoAssistente } from './tipos'

interface Props {
  rascunho: EstadoAssistente
  aoContinuar: () => void
  aoDescartarEComecarOutra: () => void
}

/**
 * Tela apresentada ao clicar em "Nova Visita" quando já existe um rascunho salvo.
 * Pergunta com gentileza se a usuária quer continuar de onde parou ou começar do zero.
 */
export function DialogoRascunhoPendente({
  rascunho,
  aoContinuar,
  aoDescartarEComecarOutra,
}: Props) {
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)

  return (
    <Pagina titulo="Continuar visita em andamento?" icone={ClipboardPlus}>
      <div className="space-y-6">
        <div className="rounded-2xl border-3 border-primaria bg-papel p-5 shadow-sm">
          <p className="text-[1.25rem] font-bold text-primaria">
            Você parou uma visita no meio.
          </p>
          <p className="mt-2 text-[1.05rem] text-texto">
            Há dados guardados no <strong>Passo {rascunho.passo} de 6</strong>
            {rascunho.data && (
              <span> (data da visita: <strong>{formatarDataParaExibicao(rascunho.data)}</strong>)</span>
            )}.
          </p>
          <p className="mt-2 text-[1rem] text-texto-suave">
            Você pode continuar preenchendo exatamente de onde parou ou descartar e começar uma nova visita em branco.
          </p>
        </div>

        <div className="space-y-4">
          <BotaoGrande
            icone={Play}
            variante="primario"
            tamanho="enorme"
            onClick={aoContinuar}
          >
            Continuar de onde parei (Passo {rascunho.passo})
          </BotaoGrande>

          <BotaoGrande
            icone={Trash2}
            variante="secundario"
            tamanho="enorme"
            onClick={() => setConfirmandoDescarte(true)}
          >
            Começar outra visita do zero
          </BotaoGrande>
        </div>

        {/* Confirmação antes de descartar o rascunho */}
        <DialogoConfirmacao
          aberto={confirmandoDescarte}
          titulo="Descartar visita não finalizada?"
          mensagem="Tem certeza de que quer começar do zero? As informações que você já havia preenchido nesta visita serão apagadas."
          textoConfirmar="Sim, apagar e começar outra"
          textoCancelar="Não, quero continuar a anterior"
          onConfirmar={() => {
            setConfirmandoDescarte(false)
            aoDescartarEComecarOutra()
          }}
          onCancelar={() => {
            setConfirmandoDescarte(false)
            aoContinuar()
          }}
        />
      </div>
    </Pagina>
  )
}
