import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  HeartHandshake,
  RotateCcw,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { BotaoGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import { Pagina } from '../../components/Pagina'
import { ErroNomeDuplicado, ErroValidacao, repositorios, type Diaconisa } from '../../db'
import { completarDdd, formatarTelefone, mascararDigitacaoTelefone } from '../../lib/telefone'

export function PaginaFormDiaconisa() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editando = Boolean(id)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dddPadrao, setDddPadrao] = useState('62')

  const [erroNome, setErroNome] = useState<string | undefined>()
  const [erroTelefone, setErroTelefone] = useState<string | undefined>()
  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(editando)

  // Modais de confirmação e alerta
  const [diaconisaArquivadaEncontrada, setDiaconisaArquivadaEncontrada] = useState<Diaconisa | null>(null)
  const [confirmarDuplicadoAtivo, setConfirmarDuplicadoAtivo] = useState(false)
  const [confirmarRemocao, setConfirmarRemocao] = useState(false)
  const [explicacaoArquivada, setExplicacaoArquivada] = useState<string | null>(null)

  useEffect(() => {
    async function carregarDados() {
      const config = await repositorios.configuracoes.obter()
      setDddPadrao(config.dddPadrao)

      if (id) {
        const d = await repositorios.diaconisas.obter(id)
        if (d) {
          setNome(d.nome)
          setTelefone(d.telefone ? formatarTelefone(d.telefone) : '')
        } else {
          navigate('/diaconisas', { replace: true })
        }
      }
      setCarregando(false)
    }
    void carregarDados()
  }, [id, navigate])

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTelefone(mascararDigitacaoTelefone(e.target.value))
    setErroTelefone(undefined)
  }

  async function salvar(permitirDuplicado = false) {
    setErroNome(undefined)
    setErroTelefone(undefined)

    // Completa o DDD caso o usuário tenha digitado apenas 8 ou 9 números
    const telComDdd = completarDdd(telefone, dddPadrao)

    try {
      setSalvando(true)

      // Se for novo cadastro, verifica se já existe arquivada para oferecer reativação
      if (!editando && !permitirDuplicado) {
        const existente = await repositorios.diaconisas.encontrarPorNome(nome)
        if (existente && !existente.ativa) {
          setDiaconisaArquivadaEncontrada(existente)
          setSalvando(false)
          return
        }
      }

      if (editando && id) {
        await repositorios.diaconisas.atualizar(
          id,
          { nome, telefone: telComDdd },
          { permitirDuplicado },
        )
      } else {
        await repositorios.diaconisas.criar(
          { nome, telefone: telComDdd },
          { permitirDuplicado },
        )
      }

      navigate('/diaconisas')
    } catch (err) {
      if (err instanceof ErroNomeDuplicado) {
        const d = err.existente as Diaconisa
        if (!d.ativa) {
          setDiaconisaArquivadaEncontrada(d)
        } else {
          setConfirmarDuplicadoAtivo(true)
        }
      } else if (err instanceof ErroValidacao) {
        if (err.campo === 'nome') setErroNome(err.message)
        if (err.campo === 'telefone') setErroTelefone(err.message)
      } else {
        setErroNome('Ocorreu um erro ao salvar. Tente novamente.')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function handleRemover() {
    if (!id) return
    setConfirmarRemocao(false)
    setSalvando(true)
    try {
      const resultado = await repositorios.diaconisas.remover(id)
      if (resultado === 'arquivada') {
        setExplicacaoArquivada(
          `Como "${nome}" já participou de visitas registradas anteriormente, ela foi ARQUIVADA em vez de apagada para não estragar o histórico das visitas. Ela não aparecerá ao registrar novas visitas, mas você pode reativá-la em "Ver arquivadas" quando quiser.`,
        )
      } else {
        navigate('/diaconisas')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function handleReativarArquivada() {
    if (!diaconisaArquivadaEncontrada) return
    await repositorios.diaconisas.reativar(diaconisaArquivadaEncontrada.id)
    setDiaconisaArquivadaEncontrada(null)
    navigate('/diaconisas')
  }

  if (carregando) {
    return (
      <Pagina titulo="Carregando..." icone={HeartHandshake}>
        <p className="py-6 text-center text-[1.1rem]">Aguarde um momento...</p>
      </Pagina>
    )
  }

  return (
    <Pagina
      titulo={editando ? 'Editar Diaconisa' : 'Nova Diaconisa'}
      icone={editando ? HeartHandshake : UserPlus}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void salvar()
        }}
        className="flex flex-col gap-6"
      >
        <CampoTexto
          rotulo="Nome da diaconisa"
          dica="Escreva o nome completo ou como ela é conhecida"
          placeholder="Exemplo: Maria Silva"
          value={nome}
          erro={erroNome}
          onChange={(e) => {
            setNome(e.target.value)
            setErroNome(undefined)
          }}
          required
          autoFocus
        />

        <CampoTexto
          rotulo="Telefone (opcional)"
          dica={`Exemplo: (${dddPadrao}) 99999-9999. Se não digitar o DDD, usaremos o (${dddPadrao}) automaticamente.`}
          placeholder={`(${dddPadrao}) 99999-9999`}
          value={telefone}
          erro={erroTelefone}
          onChange={handleTelefoneChange}
          inputMode="tel"
        />

        <div className="mt-4 flex flex-col gap-3">
          <BotaoGrande
            type="submit"
            icone={Check}
            variante="sucesso"
            tamanho="enorme"
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar Diaconisa'}
          </BotaoGrande>

          <BotaoGrande
            icone={ArrowLeft}
            variante="secundario"
            onClick={() => navigate('/diaconisas')}
            disabled={salvando}
          >
            Voltar sem salvar
          </BotaoGrande>

          {editando && (
            <div className="mt-6 border-t-2 border-borda pt-6">
              <BotaoGrande
                icone={Trash2}
                variante="perigo"
                onClick={() => setConfirmarRemocao(true)}
                disabled={salvando}
              >
                Remover ou arquivar diaconisa
              </BotaoGrande>
            </div>
          )}
        </div>
      </form>

      {/* Confirmação quando o nome já existe na lista de ARQUIVADAS */}
      <DialogoConfirmacao
        aberto={Boolean(diaconisaArquivadaEncontrada)}
        titulo="Diaconisa já cadastrada nas arquivadas"
        mensagem={`Encontramos "${diaconisaArquivadaEncontrada?.nome}" na lista de arquivadas. Você gostaria de voltar a usá-la em vez de cadastrar novamente?`}
        textoConfirmar="Sim, voltar a usar"
        textoCancelar="Não, cancelar"
        iconeConfirmar={RotateCcw}
        variante="sucesso"
        onConfirmar={() => void handleReativarArquivada()}
        onCancelar={() => setDiaconisaArquivadaEncontrada(null)}
      />

      {/* Confirmação quando o nome já existe nas ATIVAS */}
      <DialogoConfirmacao
        aberto={confirmarDuplicadoAtivo}
        titulo="Nome já cadastrado"
        mensagem={`Já existe uma diaconisa ativa com o nome "${nome}". Deseja salvar mesmo assim e ter duas com o mesmo nome?`}
        textoConfirmar="Sim, salvar com o mesmo nome"
        textoCancelar="Não, vou corrigir o nome"
        iconeConfirmar={Check}
        variante="primario"
        onConfirmar={() => {
          setConfirmarDuplicadoAtivo(false)
          void salvar(true)
        }}
        onCancelar={() => setConfirmarDuplicadoAtivo(false)}
      />

      {/* Confirmação para remover */}
      <DialogoConfirmacao
        aberto={confirmarRemocao}
        titulo="Remover diaconisa?"
        mensagem={`Tem certeza que deseja remover "${nome}"? Se ela já participou de visitas no passado, será arquivada para manter os relatórios corretos.`}
        textoConfirmar="Sim, remover"
        textoCancelar="Não, voltar"
        iconeConfirmar={Trash2}
        variante="perigo"
        onConfirmar={() => void handleRemover()}
        onCancelar={() => setConfirmarRemocao(false)}
      />

      {/* Modal explicativo quando a diaconisa é arquivada em vez de apagada */}
      {explicacaoArquivada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-[min(92vw,36rem)] rounded-3xl border-4 border-borda bg-papel p-6 text-texto">
            <h2 className="text-2xl font-extrabold text-primaria">Diaconisa Arquivada</h2>
            <div className="mt-4">
              <Aviso tipo="info">{explicacaoArquivada}</Aviso>
            </div>
            <div className="mt-6">
              <BotaoGrande
                icone={Check}
                variante="primario"
                onClick={() => navigate('/diaconisas')}
              >
                Entendi, voltar para a lista
              </BotaoGrande>
            </div>
          </div>
        </div>
      )}
    </Pagina>
  )
}
