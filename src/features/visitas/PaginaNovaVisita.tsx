import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CheckCircle,
  ClipboardPlus,
  House,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { BotaoGrande } from '../../components/BotaoGrande'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import { Pagina } from '../../components/Pagina'
import { Progresso } from '../../components/Progresso'
import {
  repositorios,
  type DadosEndereco,
  type Diaconisa,
  type EntradaVisita,
  type PessoaComEndereco,
} from '../../db'
import { ehDataFutura, obterDataHojeIso } from '../../lib/data'
import { estaoQuadraLoteNumeroVazios } from '../../lib/endereco'
import { BarraNavegacaoPassos } from './BarraNavegacaoPassos'
import { DialogoRascunhoPendente } from './DialogoRascunhoPendente'
import { Passo1Data } from './Passo1Data'
import { Passo2Diaconisas } from './Passo2Diaconisas'
import { Passo3Pessoas } from './Passo3Pessoas'
import { Passo4Endereco } from './Passo4Endereco'
import { Passo5Observacoes } from './Passo5Observacoes'
import { Passo6Previa } from './Passo6Previa'
import {
  ESTADO_INICIAL_ASSISTENTE,
  type EstadoAssistente,
} from './tipos'

interface Props {
  modoEdicao?: boolean
}

export function PaginaNovaVisita({ modoEdicao = false }: Props) {
  const { passo: passoParam, id: visitaIdParam } = useParams<{ passo?: string; id?: string }>()
  const navigate = useNavigate()

  // Passo atual de 1 a 6
  const passo = Math.min(6, Math.max(1, parseInt(passoParam || '1', 10)))

  // Estado completo do assistente
  const [estado, setEstado] = useState<EstadoAssistente>(() => ({
    ...ESTADO_INICIAL_ASSISTENTE,
    data: obterDataHojeIso(),
  }))

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucessoSalvo, setSucessoSalvo] = useState(false)
  const [rascunhoPendente, setRascunhoPendente] = useState<EstadoAssistente | null>(null)
  const [avisoRascunhoAjustado, setAvisoRascunhoAjustado] = useState<string | null>(null)

  // Erros e confirmações por passo
  const [erroPasso1, setErroPasso1] = useState<string | undefined>()
  const [confirmarDataFutura, setConfirmarDataFutura] = useState(false)
  const [erroPasso2, setErroPasso2] = useState<string | undefined>()
  const [erroPasso3, setErroPasso3] = useState<string | undefined>()
  const [erroPasso4, setErroPasso4] = useState<string | undefined>()
  const [confirmarQdLteNumVazios, setConfirmarQdLteNumVazios] = useState(false)
  const [confirmarObservacaoVazia, setConfirmarObservacaoVazia] = useState(false)

  // Cache para a prévia (Passo 6)
  const [diaconisasPrevia, setDiaconisasPrevia] = useState<Diaconisa[]>([])
  const [pessoasPrevia, setPessoasPrevia] = useState<PessoaComEndereco[]>([])
  const [enderecoPrevia, setEnderecoPrevia] = useState<DadosEndereco | null>(null)

  // Referência para salvar o rascunho com debounce (~500ms)
  const estadoRef = useRef(estado)
  useEffect(() => {
    estadoRef.current = estado
  }, [estado])
  const timerSalvarRascunho = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visitaSalvaRef = useRef(false)

  const salvarRascunhoNoBanco = useCallback(async (dados: EstadoAssistente) => {
    if (modoEdicao || visitaSalvaRef.current) return // Visita em edição ou já salva não mexe no rascunho
    try {
      await repositorios.rascunho.salvar({ ...dados, passo })
    } catch (e) {
      console.error('Erro ao salvar rascunho:', e)
    }
  }, [modoEdicao, passo])

  // Salva imediatamente cancelando timers pendentes
  const flushSalvarRascunho = useCallback(() => {
    if (timerSalvarRascunho.current) {
      clearTimeout(timerSalvarRascunho.current)
      timerSalvarRascunho.current = null
    }
    void salvarRascunhoNoBanco(estadoRef.current)
  }, [salvarRascunhoNoBanco])

  // Agenda salvar rascunho com 500ms de debounce após digitação
  const agendarSalvarRascunho = useCallback(() => {
    if (modoEdicao) return
    if (timerSalvarRascunho.current) clearTimeout(timerSalvarRascunho.current)
    timerSalvarRascunho.current = setTimeout(() => {
      void salvarRascunhoNoBanco(estadoRef.current)
    }, 500)
  }, [modoEdicao, salvarRascunhoNoBanco])

  // Salva ao sair da tela ou fechar navegador
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSalvarRascunho()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      flushSalvarRascunho()
    }
  }, [flushSalvarRascunho])

  // Inicialização (carrega rascunho ou visita para edição)
  useEffect(() => {
    async function inicializar() {
      if (modoEdicao && visitaIdParam) {
        // Carrega visita existente para edição
        const visitaExistente = await repositorios.visitas.obter(visitaIdParam)
        if (visitaExistente) {
          setEstado({
            passo,
            data: visitaExistente.data,
            diaconisaIds: visitaExistente.diaconisaIds,
            pessoaIds: visitaExistente.pessoaIds,
            modoEndereco: 'outro',
            enderecoManual: {
              logradouro: visitaExistente.endereco.logradouro,
              quadra: visitaExistente.endereco.quadra,
              lote: visitaExistente.endereco.lote,
              numero: visitaExistente.endereco.numero,
              setor: visitaExistente.endereco.setor,
            },
            atualizarCadastroPessoas: false,
            observacoes: visitaExistente.observacoes,
            visitaOrigemId: visitaExistente.id,
          })
        }
        setCarregando(false)
        return
      }

      // Se for /nova-visita sem número de passo, confere rascunho
      const rascunhoSalvo = await repositorios.rascunho.obter()
      if (rascunhoSalvo && rascunhoSalvo.estado) {
        const est = rascunhoSalvo.estado as EstadoAssistente

        // Se abriu a raiz /nova-visita, mostra pergunta de continuar rascunho
        if (!passoParam) {
          setRascunhoPendente(est)
          setCarregando(false)
          return
        }

        // Validação gentil se alguma diaconisa ou pessoa foi arquivada/removida
        const diaconisasValidas: string[] = []
        const avisos: string[] = []

        for (const id of est.diaconisaIds || []) {
          const d = await repositorios.diaconisas.obter(id)
          if (d && d.ativa) {
            diaconisasValidas.push(id)
          } else {
            avisos.push(`A diaconisa "${d?.nome || 'anterior'}" foi arquivada ou removida`)
          }
        }

        const pessoasValidas: string[] = []
        for (const id of est.pessoaIds || []) {
          const p = await repositorios.pessoas.obter(id)
          if (p && p.ativa) {
            pessoasValidas.push(id)
          } else {
            avisos.push(`A pessoa "${p?.nome || 'anterior'}" foi arquivada ou removida`)
          }
        }

        if (avisos.length > 0) {
          setAvisoRascunhoAjustado(
            `${avisos.join(' e ')} desde que o rascunho foi salvo. Por favor, confira os participantes.`,
          )
        }

        setEstado({
          ...est,
          passo,
          diaconisaIds: diaconisasValidas,
          pessoaIds: pessoasValidas,
        })
      } else {
        // Sem rascunho prévio: se abriu a raiz, redireciona para passo 1
        if (!passoParam) {
          navigate('/nova-visita/1', { replace: true })
          return
        }
        setEstado((prev) => ({
          ...prev,
          passo,
          data: prev.data || obterDataHojeIso(),
        }))
      }

      setCarregando(false)
    }

    void inicializar()
  }, [modoEdicao, visitaIdParam, passoParam, passo, navigate])

  // Carrega dados da prévia quando estiver no passo 6
  useEffect(() => {
    if (passo === 6) {
      async function carregarPrevia() {
        const dLista = await repositorios.diaconisas.listar({ incluirArquivadas: true })
        const dSel = dLista.filter((d) => estado.diaconisaIds.includes(d.id))
        setDiaconisasPrevia(dSel)

        const pLista = await repositorios.pessoas.listar({ incluirArquivadas: true })
        const pSel = pLista.filter((p) => estado.pessoaIds.includes(p.id))
        setPessoasPrevia(pSel)

        // Resolução do endereço
        if (estado.modoEndereco === 'outro' && estado.enderecoManual) {
          setEnderecoPrevia(estado.enderecoManual)
        } else if (estado.enderecoIdEscolhido) {
          const end = await repositorios.enderecos.obter(estado.enderecoIdEscolhido)
          if (end) setEnderecoPrevia(end)
        } else if (pSel.length > 0) {
          setEnderecoPrevia(pSel[0].endereco)
        }
      }
      void carregarPrevia()
    }
  }, [passo, estado.diaconisaIds, estado.pessoaIds, estado.modoEndereco, estado.enderecoIdEscolhido, estado.enderecoManual])

  // Navega para um passo mantendo o histórico de rota
  function irParaPasso(novoPasso: number) {
    flushSalvarRascunho()
    if (modoEdicao && visitaIdParam) {
      navigate(`/visitas/${visitaIdParam}/editar/${novoPasso}`)
    } else {
      navigate(`/nova-visita/${novoPasso}`)
    }
  }

  function handleVoltar() {
    if (passo > 1) {
      irParaPasso(passo - 1)
    } else {
      flushSalvarRascunho()
      navigate('/')
    }
  }

  // Validação ao tentar avançar de passo
  async function handleAvancar() {
    // PASSO 1: Data
    if (passo === 1) {
      if (!estado.data) {
        setErroPasso1('Faltou escolher a data da visita.')
        return
      }
      if (ehDataFutura(estado.data) && !confirmarDataFutura) {
        setConfirmarDataFutura(true)
        return
      }
      irParaPasso(2)
      return
    }

    // PASSO 2: Diaconisas
    if (passo === 2) {
      if (estado.diaconisaIds.length === 0) {
        setErroPasso2('Escolha pelo menos uma diaconisa que participou da visita.')
        return
      }
      irParaPasso(3)
      return
    }

    // PASSO 3: Pessoas
    if (passo === 3) {
      if (estado.pessoaIds.length === 0) {
        setErroPasso3('Escolha pelo menos uma pessoa que recebeu a visita.')
        return
      }
      irParaPasso(4)
      return
    }

    // PASSO 4: Endereço
    if (passo === 4) {
      if (estado.modoEndereco === 'outro') {
        const manual = estado.enderecoManual
        if (!manual?.logradouro?.trim()) {
          setErroPasso4('Faltou escrever a rua ou avenida onde a visita ocorreu.')
          return
        }
        if (!manual?.setor?.trim()) {
          setErroPasso4('Faltou escrever o setor ou bairro.')
          return
        }
        if (estaoQuadraLoteNumeroVazios(manual) && !confirmarQdLteNumVazios) {
          setConfirmarQdLteNumVazios(true)
          return
        }
      }
      irParaPasso(5)
      return
    }

    // PASSO 5: Observações
    if (passo === 5) {
      if (!estado.observacoes.trim() && !confirmarObservacaoVazia) {
        setConfirmarObservacaoVazia(true)
        return
      }
      irParaPasso(6)
      return
    }

    // PASSO 6: Salvar a visita
    if (passo === 6) {
      await salvarVisitaFinal()
    }
  }

  // Salva definitivamente a visita no banco de dados
  async function salvarVisitaFinal() {
    setSalvando(true)
    try {
      // 1. Resolve o endereço da visita
      let dadosEndereco: DadosEndereco
      if (estado.modoEndereco === 'outro' && estado.enderecoManual) {
        dadosEndereco = estado.enderecoManual
        // Se a usuária marcou para atualizar o cadastro das pessoas para este endereço
        if (estado.atualizarCadastroPessoas) {
          await repositorios.pessoas.mudarEndereco(estado.pessoaIds, { endereco: dadosEndereco })
        }
      } else if (estado.enderecoIdEscolhido) {
        const end = await repositorios.enderecos.obter(estado.enderecoIdEscolhido)
        if (!end) throw new Error('Endereço escolhido não foi encontrado.')
        dadosEndereco = end
      } else {
        const pPrimeira = await repositorios.pessoas.obterComEndereco(estado.pessoaIds[0])
        if (!pPrimeira) throw new Error('Pessoa da visita não encontrada.')
        dadosEndereco = pPrimeira.endereco
      }

      const entrada: EntradaVisita = {
        data: estado.data,
        diaconisaIds: estado.diaconisaIds,
        pessoaIds: estado.pessoaIds,
        endereco: dadosEndereco,
        observacoes: estado.observacoes,
      }

      if (modoEdicao && estado.visitaOrigemId) {
        await repositorios.visitas.atualizar(estado.visitaOrigemId, entrada)
      } else {
        visitaSalvaRef.current = true
        await repositorios.visitas.criar(entrada)
        // Limpa o rascunho de nova visita
        await repositorios.rascunho.limpar()
      }

      setSucessoSalvo(true)
    } catch (err) {
      console.error('Erro ao salvar visita:', err)
      alert('Ocorreu um erro ao salvar a visita. Por favor, tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  // Descarte do rascunho pendente para começar outra visita do zero
  async function descartarRascunhoEComecarOutra() {
    visitaSalvaRef.current = false
    await repositorios.rascunho.limpar()
    setRascunhoPendente(null)
    setEstado({
      ...ESTADO_INICIAL_ASSISTENTE,
      data: obterDataHojeIso(),
      passo: 1,
    })
    navigate('/nova-visita/1', { replace: true })
  }

  function continuarRascunho() {
    if (rascunhoPendente) {
      const passoSalvo = rascunhoPendente.passo || 1
      setRascunhoPendente(null)
      navigate(`/nova-visita/${passoSalvo}`)
    }
  }

  // TELA 1: Pergunta se quer continuar rascunho pendente
  if (rascunhoPendente) {
    return (
      <DialogoRascunhoPendente
        rascunho={rascunhoPendente}
        aoContinuar={continuarRascunho}
        aoDescartarEComecarOutra={() => void descartarRascunhoEComecarOutra()}
      />
    )
  }

  // TELA 2: Sucesso após salvar
  if (sucessoSalvo) {
    return (
      <Pagina
        titulo="Visita salva com sucesso!"
        icone={CheckCircle}
        mostrarInicio={false}
      >
        <div className="space-y-6 text-center">
          <div className="rounded-3xl border-4 border-sucesso bg-sucesso-clara/20 p-8 shadow-sm">
            <CheckCircle aria-hidden="true" className="mx-auto size-20 text-sucesso" />
            <h2 className="mt-4 text-[1.6rem] font-extrabold text-sucesso-escura">
              Visita registrada com sucesso!
            </h2>
            <p className="mt-2 text-[1.1rem] text-texto">
              Todos os dados e anotações foram guardados com segurança neste aparelho.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <BotaoGrande
              icone={ClipboardPlus}
              variante="primario"
              tamanho="enorme"
              onClick={() => {
                visitaSalvaRef.current = false
                setSucessoSalvo(false)
                setEstado({
                  ...ESTADO_INICIAL_ASSISTENTE,
                  data: obterDataHojeIso(),
                  passo: 1,
                })
                navigate('/nova-visita/1', { replace: true })
              }}
            >
              Fazer outra visita
            </BotaoGrande>

            <BotaoGrande
              icone={House}
              variante="secundario"
              tamanho="enorme"
              onClick={() => navigate('/')}
            >
              Ir para o início
            </BotaoGrande>
          </div>
        </div>
      </Pagina>
    )
  }

  if (carregando) {
    return (
      <Pagina titulo="Nova Visita" icone={ClipboardPlus}>
        <p className="text-center text-texto-suave">Abrindo o assistente...</p>
      </Pagina>
    )
  }

  return (
    <Pagina
      titulo={modoEdicao ? 'Editar Visita' : 'Nova Visita'}
      icone={ClipboardPlus}
      mostrarInicio={false}
    >
      <div className="space-y-6 pb-32">
        {/* Barra de progresso */}
        <Progresso passo={passo} total={6} />

        {/* Notificação gentil caso alguém tenha sido removido/arquivado do rascunho */}
        {avisoRascunhoAjustado && (
          <Aviso tipo="atencao">
            {avisoRascunhoAjustado}
          </Aviso>
        )}

        {/* PASSO 1: DATA */}
        {passo === 1 && (
          <Passo1Data
            data={estado.data}
            aoMudarData={(d) => {
              setEstado((prev) => ({ ...prev, data: d }))
              agendarSalvarRascunho()
            }}
            erro={erroPasso1}
            aoLimparErro={() => setErroPasso1(undefined)}
          />
        )}

        {/* PASSO 2: DIACONISAS */}
        {passo === 2 && (
          <Passo2Diaconisas
            diaconisaIds={estado.diaconisaIds}
            aoMudarSelecao={(ids) => {
              setEstado((prev) => ({ ...prev, diaconisaIds: ids }))
              agendarSalvarRascunho()
            }}
            erro={erroPasso2}
            aoLimparErro={() => setErroPasso2(undefined)}
          />
        )}

        {/* PASSO 3: PESSOAS */}
        {passo === 3 && (
          <Passo3Pessoas
            pessoaIds={estado.pessoaIds}
            aoMudarSelecao={(ids) => {
              setEstado((prev) => ({ ...prev, pessoaIds: ids }))
              agendarSalvarRascunho()
            }}
            erro={erroPasso3}
            aoLimparErro={() => setErroPasso3(undefined)}
          />
        )}

        {/* PASSO 4: ENDEREÇO */}
        {passo === 4 && (
          <Passo4Endereco
            pessoaIds={estado.pessoaIds}
            modoEndereco={estado.modoEndereco}
            aoMudarModo={(m) => {
              setEstado((prev) => ({ ...prev, modoEndereco: m }))
              agendarSalvarRascunho()
            }}
            enderecoIdEscolhido={estado.enderecoIdEscolhido}
            aoMudarEnderecoEscolhido={(id) => {
              setEstado((prev) => ({ ...prev, enderecoIdEscolhido: id }))
              agendarSalvarRascunho()
            }}
            enderecoManual={estado.enderecoManual}
            aoMudarEnderecoManual={(dados) => {
              setEstado((prev) => ({ ...prev, enderecoManual: dados }))
              agendarSalvarRascunho()
            }}
            atualizarCadastroPessoas={estado.atualizarCadastroPessoas}
            aoMudarAtualizarCadastro={(at) => {
              setEstado((prev) => ({ ...prev, atualizarCadastroPessoas: at }))
              agendarSalvarRascunho()
            }}
            erro={erroPasso4}
            aoLimparErro={() => setErroPasso4(undefined)}
          />
        )}

        {/* PASSO 5: OBSERVAÇÕES */}
        {passo === 5 && (
          <Passo5Observacoes
            observacoes={estado.observacoes}
            aoMudarObservacoes={(texto) => {
              setEstado((prev) => ({ ...prev, observacoes: texto }))
              agendarSalvarRascunho()
            }}
            confirmarVaziaAberto={confirmarObservacaoVazia}
            aoConfirmarVazia={() => {
              setConfirmarObservacaoVazia(false)
              irParaPasso(6)
            }}
            aoCancelarVazia={() => setConfirmarObservacaoVazia(false)}
          />
        )}

        {/* PASSO 6: PRÉVIA E REVISÃO */}
        {passo === 6 && enderecoPrevia && (
          <Passo6Previa
            data={estado.data}
            diaconisas={diaconisasPrevia}
            pessoas={pessoasPrevia}
            endereco={enderecoPrevia}
            observacoes={estado.observacoes}
            modoEdicao={modoEdicao}
          />
        )}
      </div>

      {/* Barra fixa inferior com botões Voltar e Continuar / Salvar */}
      <BarraNavegacaoPassos
        passo={passo}
        totalPassos={6}
        aoVoltar={handleVoltar}
        aoAvancar={() => void handleAvancar()}
        salvando={salvando}
        modoEdicao={modoEdicao}
      />

      {/* Confirmação caso o passo 1 tenha data futura */}
      {confirmarDataFutura && (
        <DialogoConfirmacao
          aberto={confirmarDataFutura}
          titulo="Essa data é no futuro. Está certo?"
          mensagem="A data que você escolheu ainda não chegou. Deseja manter essa data e continuar?"
          textoConfirmar="Sim, a data é essa"
          textoCancelar="Não, quero mudar a data"
          onConfirmar={() => {
            setConfirmarDataFutura(false)
            irParaPasso(2)
          }}
          onCancelar={() => setConfirmarDataFutura(false)}
        />
      )}

      {/* Confirmação no passo 4 caso QD, LT e NUM estejam vazios */}
      {confirmarQdLteNumVazios && (
        <DialogoConfirmacao
          aberto={confirmarQdLteNumVazios}
          titulo="Quadra, lote e número estão vazios"
          mensagem="Você não preencheu nem Quadra, nem Lote, nem Número. Deseja continuar com este endereço assim mesmo?"
          textoConfirmar="Sim, continuar assim"
          textoCancelar="Não, quero preencher"
          onConfirmar={() => {
            setConfirmarQdLteNumVazios(false)
            irParaPasso(5)
          }}
          onCancelar={() => setConfirmarQdLteNumVazios(false)}
        />
      )}
    </Pagina>
  )
}
