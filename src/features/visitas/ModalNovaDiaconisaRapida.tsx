import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { BotaoGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import { ErroNomeDuplicado, ErroValidacao, repositorios, type Diaconisa } from '../../db'
import { completarDdd, mascararDigitacaoTelefone } from '../../lib/telefone'

interface Props {
  aberto: boolean
  aoFechar: () => void
  aoCriada: (diaconisa: Diaconisa) => void
  dddPadrao: string
}

export function ModalNovaDiaconisaRapida({ aberto, aoFechar, aoCriada, dddPadrao }: Props) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erroNome, setErroNome] = useState<string | undefined>()
  const [erroTelefone, setErroTelefone] = useState<string | undefined>()
  const [salvando, setSalvando] = useState(false)

  // Diálogos de confirmação de duplicados / reativação
  const [diaconisaArquivadaEncontrada, setDiaconisaArquivadaEncontrada] = useState<Diaconisa | null>(null)
  const [confirmarDuplicadoAtivo, setConfirmarDuplicadoAtivo] = useState(false)

  if (!aberto) return null

  function resetar() {
    setNome('')
    setTelefone('')
    setErroNome(undefined)
    setErroTelefone(undefined)
    setSalvando(false)
    setDiaconisaArquivadaEncontrada(null)
    setConfirmarDuplicadoAtivo(false)
  }

  function fechar() {
    resetar()
    aoFechar()
  }

  async function salvar(permitirDuplicado = false) {
    setErroNome(undefined)
    setErroTelefone(undefined)
    const telComDdd = completarDdd(telefone, dddPadrao)

    try {
      setSalvando(true)

      // Se não for permitirDuplicado, checa se existe arquivada
      if (!permitirDuplicado) {
        const existente = await repositorios.diaconisas.encontrarPorNome(nome)
        if (existente && !existente.ativa) {
          setDiaconisaArquivadaEncontrada(existente)
          setSalvando(false)
          return
        }
      }

      const criada = await repositorios.diaconisas.criar(
        { nome, telefone: telComDdd },
        { permitirDuplicado },
      )

      resetar()
      aoCriada(criada)
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
        setErroNome('Ocorreu um erro ao cadastrar a diaconisa.')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function reativarDiaconisa(d: Diaconisa) {
    setSalvando(true)
    try {
      await repositorios.diaconisas.reativar(d.id)
      setDiaconisaArquivadaEncontrada(null)
      resetar()
      aoCriada({ ...d, ativa: true })
    } catch {
      setErroNome('Não foi possível reativar o cadastro.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-diaconisa"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-lg rounded-3xl border-4 border-primaria bg-papel p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-borda pb-4">
          <h2 id="titulo-modal-diaconisa" className="text-[1.3rem] font-bold text-primaria">
            Nova Diaconisa
          </h2>
          <button
            type="button"
            onClick={fechar}
            className="rounded-full p-2 text-texto-suave hover:bg-cinza-claro"
            aria-label="Fechar"
          >
            <X className="size-6" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void salvar(false)
          }}
          className="mt-4 space-y-4"
        >
          <CampoTexto
            rotulo="Nome da diaconisa"
            required
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              setErroNome(undefined)
            }}
            erro={erroNome}
            dica="Nome e sobrenome"
            autoFocus
          />

          <CampoTexto
            rotulo="Telefone (opcional)"
            type="tel"
            value={telefone}
            onChange={(e) => {
              setTelefone(mascararDigitacaoTelefone(e.target.value))
              setErroTelefone(undefined)
            }}
            erro={erroTelefone}
            dica="Com DDD, ex.: (62) 99999-9999"
          />

          <div className="mt-6 flex flex-col gap-3 pt-2">
            <BotaoGrande
              type="submit"
              icone={Check}
              variante="primario"
              disabled={salvando || !nome.trim()}
            >
              {salvando ? 'Salvando...' : 'Adicionar e marcar nesta visita'}
            </BotaoGrande>

            <BotaoGrande icone={X} variante="secundario" onClick={fechar} disabled={salvando}>
              Cancelar
            </BotaoGrande>
          </div>
        </form>

        {/* Diálogo se houver diaconisa com o mesmo nome arquivada */}
        {diaconisaArquivadaEncontrada && (
          <DialogoConfirmacao
            aberto={Boolean(diaconisaArquivadaEncontrada)}
            titulo="Diaconisa já existe arquivada"
            mensagem={`Já existe uma diaconisa chamada "${diaconisaArquivadaEncontrada.nome}" que estava arquivada. Deseja reativar o cadastro dela e usá-la nesta visita?`}
            textoConfirmar="Sim, reativar e usar"
            textoCancelar="Não, cancelar"
            onConfirmar={() => void reativarDiaconisa(diaconisaArquivadaEncontrada)}
            onCancelar={() => setDiaconisaArquivadaEncontrada(null)}
          />
        )}

        {/* Diálogo se já houver diaconisa ativa com o mesmo nome */}
        {confirmarDuplicadoAtivo && (
          <DialogoConfirmacao
            aberto={confirmarDuplicadoAtivo}
            titulo="Nome já cadastrado"
            mensagem={`Já existe uma diaconisa ativa com o nome "${nome}". Deseja usar o cadastro existente ou criar outro com o mesmo nome?`}
            textoConfirmar="Criar outra com mesmo nome"
            textoCancelar="Usar a que já existe"
            onConfirmar={() => {
              setConfirmarDuplicadoAtivo(false)
              void salvar(true)
            }}
            onCancelar={() => {
              setConfirmarDuplicadoAtivo(false)
              void repositorios.diaconisas.encontrarPorNome(nome).then((existente) => {
                if (existente) {
                  resetar()
                  aoCriada(existente)
                }
              })
            }}
          />
        )}
      </div>
    </div>
  )
}
