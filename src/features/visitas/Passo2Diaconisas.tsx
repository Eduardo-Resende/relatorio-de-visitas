import { useEffect, useState } from 'react'
import { RotateCcw, UserPlus } from 'lucide-react'
import { Aviso } from '../../components/Aviso'
import { BotaoGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { CartaoSelecionavel } from '../../components/CartaoSelecionavel'
import { repositorios, type Diaconisa, type Visita } from '../../db'
import { formatarDataParaExibicao } from '../../lib/data'
import { formatarTelefone } from '../../lib/telefone'
import { normalizarTexto } from '../../lib/texto'
import { ModalNovaDiaconisaRapida } from './ModalNovaDiaconisaRapida'

interface Props {
  diaconisaIds: string[]
  aoMudarSelecao: (novosIds: string[]) => void
  erro?: string
  aoLimparErro: () => void
}

/** Passo 2: Seleção das diaconisas que participaram da visita. */
export function Passo2Diaconisas({
  diaconisaIds,
  aoMudarSelecao,
  erro,
  aoLimparErro,
}: Props) {
  const [diaconisas, setDiaconisas] = useState<Diaconisa[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [dddPadrao, setDddPadrao] = useState('62')
  const [modalNovaAberta, setModalNovaAberta] = useState(false)
  const [ultimaVisita, setUltimaVisita] = useState<Visita | null>(null)
  const [mensagemSucessoRapida, setMensagemSucessoRapida] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const todas = await repositorios.diaconisas.listar()
      setDiaconisas(todas)

      const config = await repositorios.configuracoes.obter()
      setDddPadrao(config.dddPadrao)

      // Busca a última visita para o botão "Mesmas diaconisas da última visita"
      const visitas = await repositorios.visitas.listar({ ordem: 'desc' })
      if (visitas.length > 0 && visitas[0].diaconisaIds.length > 0) {
        setUltimaVisita(visitas[0])
      }
      setCarregando(false)
    }
    void carregar()
  }, [])

  function alternar(id: string) {
    aoLimparErro()
    if (diaconisaIds.includes(id)) {
      aoMudarSelecao(diaconisaIds.filter((item) => item !== id))
    } else {
      aoMudarSelecao([...diaconisaIds, id])
    }
  }

  function aplicarDiaconisasUltimaVisita() {
    if (!ultimaVisita) return
    aoLimparErro()
    // Filtra apenas as que continuam ativas no cadastro
    const ativasIds = diaconisas.map((d) => d.id)
    const selecionaveis = ultimaVisita.diaconisaIds.filter((id) => ativasIds.includes(id))
    aoMudarSelecao(selecionaveis)
    setMensagemSucessoRapida('Diaconisas da última visita foram marcadas!')
    setTimeout(() => setMensagemSucessoRapida(null), 4000)
  }

  function handleDiaconisaCriada(nova: Diaconisa) {
    setDiaconisas((anteriores) => {
      const semEla = anteriores.filter((d) => d.id !== nova.id)
      return [...semEla, nova].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    })
    aoLimparErro()
    // Já deixa a nova marcada automaticamente
    if (!diaconisaIds.includes(nova.id)) {
      aoMudarSelecao([...diaconisaIds, nova.id])
    }
    setModalNovaAberta(false)
  }

  const termo = normalizarTexto(busca)
  const filtradas = termo
    ? diaconisas.filter((d) => d.nomeNormalizado.includes(termo))
    : diaconisas

  return (
    <section aria-labelledby="titulo-passo-diaconisas" className="space-y-6">
      <div>
        <h2 id="titulo-passo-diaconisas" className="text-[1.3rem] font-bold text-primaria">
          Quem realizou a visita? (Diaconisas)
        </h2>
        <p className="mt-1 text-texto-suave">
          Marque todas as irmãs que participaram. Escolha pelo menos uma.
        </p>
      </div>

      {mensagemSucessoRapida && (
        <Aviso tipo="sucesso">
          {mensagemSucessoRapida}
        </Aviso>
      )}

      {/* Botão para reaproveitar diaconisas da última visita (não marca sozinho) */}
      {ultimaVisita && (
        <div className="rounded-2xl border-2 border-primaria/40 bg-primaria-clara/50 p-4">
          <BotaoGrande
            icone={RotateCcw}
            variante="secundario"
            onClick={aplicarDiaconisasUltimaVisita}
          >
            Mesmas diaconisas da última visita
          </BotaoGrande>
          <p className="mt-2 text-center text-[0.95rem] text-texto-suave">
            Última visita em {formatarDataParaExibicao(ultimaVisita.data)} ({ultimaVisita.diaconisas.map((d) => d.nome).join(', ')})
          </p>
        </div>
      )}

      {/* Botão de adicionar nova diaconisa rápida */}
      <BotaoGrande
        icone={UserPlus}
        variante="primario"
        onClick={() => setModalNovaAberta(true)}
      >
        + Adicionar nova diaconisa
      </BotaoGrande>

      {/* Campo de busca */}
      <div className="relative">
        <CampoTexto
          rotulo="Buscar diaconisa pelo nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome da irmã..."
          dica={diaconisas.length > 0 ? `${diaconisas.length} diaconisas cadastradas` : undefined}
        />
      </div>

      {erro && (
        <p role="alert" className="text-[1.1rem] font-bold text-perigo">
          {erro}
        </p>
      )}

      {/* Contagem de selecionadas */}
      <div className="flex items-center justify-between border-b-2 border-borda pb-2">
        <span className="text-[1.1rem] font-bold text-primaria">
          {diaconisaIds.length === 0
            ? 'Nenhuma selecionada'
            : diaconisaIds.length === 1
              ? '1 diaconisa selecionada'
              : `${diaconisaIds.length} diaconisas selecionadas`}
        </span>
      </div>

      {/* Lista de cartões */}
      {carregando ? (
        <p className="text-center text-texto-suave">Carregando diaconisas...</p>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-borda p-6 text-center">
          <p className="text-texto-suave">
            {diaconisas.length === 0
              ? 'Nenhuma diaconisa cadastrada ainda. Toque no botão acima para adicionar a primeira.'
              : 'Nenhuma diaconisa encontrada com esse nome.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="group" aria-label="Lista de diaconisas">
          {filtradas.map((d) => {
            const selecionada = diaconisaIds.includes(d.id)
            return (
              <CartaoSelecionavel
                key={d.id}
                titulo={d.nome}
                subtitulo={d.telefone ? formatarTelefone(d.telefone) : undefined}
                selecionado={selecionada}
                onAlternar={() => alternar(d.id)}
              />
            )
          })}
        </div>
      )}

      {/* Modal para cadastrar nova diaconisa na hora */}
      <ModalNovaDiaconisaRapida
        aberto={modalNovaAberta}
        aoFechar={() => setModalNovaAberta(false)}
        aoCriada={handleDiaconisaCriada}
        dddPadrao={dddPadrao}
      />
    </section>
  )
}
