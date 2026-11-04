import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { BotaoGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import {
  ErroNomeDuplicado,
  ErroValidacao,
  repositorios,
  type DadosEndereco,
  type Endereco,
  type PessoaComEndereco,
  type PessoaVisitada,
} from '../../db'
import { estaoQuadraLoteNumeroVazios, formatarEndereco } from '../../lib/endereco'
import { completarDdd, mascararDigitacaoTelefone } from '../../lib/telefone'

interface Props {
  aberto: boolean
  aoFechar: () => void
  aoCriada: (pessoa: PessoaVisitada) => void
  dddPadrao: string
  pessoasJaSelecionadas: PessoaComEndereco[]
}

type ModoEnderecoPessoa = 'mesmo-selecionada' | 'existente' | 'novo'

export function ModalNovaPessoaRapida({
  aberto,
  aoFechar,
  aoCriada,
  dddPadrao,
  pessoasJaSelecionadas,
}: Props) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  // Modo de endereço
  const [modoEndereco, setModoEndereco] = useState<ModoEnderecoPessoa>(
    pessoasJaSelecionadas.length > 0 ? 'mesmo-selecionada' : 'novo',
  )
  const [pessoaBaseId, setPessoaBaseId] = useState(
    pessoasJaSelecionadas.length > 0 ? pessoasJaSelecionadas[0].id : '',
  )

  // Endereços existentes
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [enderecoExistenteId, setEnderecoExistenteId] = useState('')

  // Novo endereço manual
  const [logradouro, setLogradouro] = useState('')
  const [quadra, setQuadra] = useState('')
  const [lote, setLote] = useState('')
  const [numero, setNumero] = useState('')
  const [setor, setSetor] = useState('')
  const [complemento, setComplemento] = useState('')

  // Erros
  const [erroNome, setErroNome] = useState<string | undefined>()
  const [erroTelefone, setErroTelefone] = useState<string | undefined>()
  const [erroRua, setErroRua] = useState<string | undefined>()
  const [erroSetor, setErroSetor] = useState<string | undefined>()
  const [salvando, setSalvando] = useState(false)

  // Diálogos de confirmação
  const [pessoaArquivadaEncontrada, setPessoaArquivadaEncontrada] = useState<PessoaVisitada | null>(null)
  const [confirmarDuplicadoAtivo, setConfirmarDuplicadoAtivo] = useState(false)
  const [confirmarQdLteNumVazios, setConfirmarQdLteNumVazios] = useState(false)

  useEffect(() => {
    if (!aberto) return
    let ativo = true
    void repositorios.enderecos.listar().then((lista) => {
      if (!ativo) return
      setEnderecos(lista)
      if (lista.length > 0) {
        setEnderecoExistenteId((prev) => prev || lista[0].id)
      }
    })
    return () => {
      ativo = false
    }
  }, [aberto])

  if (!aberto) return null

  function resetar() {
    setNome('')
    setTelefone('')
    setLogradouro('')
    setQuadra('')
    setLote('')
    setNumero('')
    setSetor('')
    setComplemento('')
    setErroNome(undefined)
    setErroTelefone(undefined)
    setErroRua(undefined)
    setErroSetor(undefined)
    setSalvando(false)
    setPessoaArquivadaEncontrada(null)
    setConfirmarDuplicadoAtivo(false)
    setConfirmarQdLteNumVazios(false)
  }

  function fechar() {
    resetar()
    aoFechar()
  }

  function obterDadosEnderecoForm(): DadosEndereco {
    return {
      logradouro: logradouro.trim(),
      quadra: quadra.trim(),
      lote: lote.trim(),
      numero: numero.trim(),
      setor: setor.trim(),
      complemento: complemento.trim(),
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setErroNome(undefined)
    setErroTelefone(undefined)
    setErroRua(undefined)
    setErroSetor(undefined)

    if (modoEndereco === 'novo') {
      if (!logradouro.trim()) {
        setErroRua('Faltou escrever a rua ou avenida.')
        return
      }
      if (!setor.trim()) {
        setErroSetor('Faltou escrever o setor ou bairro.')
        return
      }

      const dadosEnd = obterDadosEnderecoForm()
      if (estaoQuadraLoteNumeroVazios(dadosEnd) && !confirmarQdLteNumVazios) {
        setConfirmarQdLteNumVazios(true)
        return
      }
    }

    await salvar(false)
  }

  async function salvar(permitirDuplicado = false) {
    setSalvando(true)
    const telComDdd = completarDdd(telefone, dddPadrao)

    try {
      if (!permitirDuplicado) {
        const existente = await repositorios.pessoas.encontrarPorNome(nome)
        if (existente && !existente.ativa) {
          setPessoaArquivadaEncontrada(existente)
          setSalvando(false)
          return
        }
      }

      let destino: { enderecoId: string } | { endereco: DadosEndereco }
      if (modoEndereco === 'mesmo-selecionada') {
        const pBase = pessoasJaSelecionadas.find((p) => p.id === pessoaBaseId)
        if (!pBase) throw new Error('Pessoa base não encontrada.')
        destino = { enderecoId: pBase.enderecoId }
      } else if (modoEndereco === 'existente') {
        destino = { enderecoId: enderecoExistenteId }
      } else {
        destino = { endereco: obterDadosEnderecoForm() }
      }

      const criada = await repositorios.pessoas.criar(
        { nome, telefone: telComDdd, ...destino },
        { permitirDuplicado },
      )

      resetar()
      aoCriada(criada)
    } catch (err) {
      if (err instanceof ErroNomeDuplicado) {
        const p = err.existente as PessoaVisitada
        if (!p.ativa) {
          setPessoaArquivadaEncontrada(p)
        } else {
          setConfirmarDuplicadoAtivo(true)
        }
      } else if (err instanceof ErroValidacao) {
        if (err.campo === 'nome') setErroNome(err.message)
        if (err.campo === 'telefone') setErroTelefone(err.message)
        if (err.campo === 'logradouro') setErroRua(err.message)
        if (err.campo === 'setor') setErroSetor(err.message)
      } else {
        setErroNome('Ocorreu um erro ao salvar a pessoa.')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function reativarPessoa(p: PessoaVisitada) {
    setSalvando(true)
    try {
      await repositorios.pessoas.reativar(p.id)
      setPessoaArquivadaEncontrada(null)
      resetar()
      aoCriada({ ...p, ativa: true })
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
      aria-labelledby="titulo-modal-pessoa"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
    >
      <div className="my-8 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border-4 border-primaria bg-papel p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-borda pb-4">
          <h2 id="titulo-modal-pessoa" className="text-[1.3rem] font-bold text-primaria">
            Nova Pessoa Visitada
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <CampoTexto
            rotulo="Nome da pessoa"
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

          <fieldset className="rounded-2xl border-2 border-borda p-4">
            <legend className="px-2 text-[1.1rem] font-bold text-primaria">
              Endereço desta pessoa:
            </legend>

            <div className="mt-2 space-y-3">
              {/* Opção (a): Mora com alguém já selecionado */}
              {pessoasJaSelecionadas.length > 0 && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-borda p-3 hover:bg-primaria-clara/40">
                  <input
                    type="radio"
                    name="modoEndereco"
                    value="mesmo-selecionada"
                    checked={modoEndereco === 'mesmo-selecionada'}
                    onChange={() => setModoEndereco('mesmo-selecionada')}
                    className="mt-1 size-5 text-primaria"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold">Mora no mesmo endereço de:</span>
                    <select
                      value={pessoaBaseId}
                      onChange={(e) => setPessoaBaseId(e.target.value)}
                      disabled={modoEndereco !== 'mesmo-selecionada'}
                      className="mt-1 block w-full rounded-lg border-2 border-primaria bg-white p-2 text-[1rem] font-medium"
                    >
                      {pessoasJaSelecionadas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({formatarEndereco(p.endereco)})
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              )}

              {/* Opção (b): Escolher endereço já cadastrado */}
              {enderecos.length > 0 && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-borda p-3 hover:bg-primaria-clara/40">
                  <input
                    type="radio"
                    name="modoEndereco"
                    value="existente"
                    checked={modoEndereco === 'existente'}
                    onChange={() => setModoEndereco('existente')}
                    className="mt-1 size-5 text-primaria"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold">Escolher um endereço já cadastrado:</span>
                    <select
                      value={enderecoExistenteId}
                      onChange={(e) => setEnderecoExistenteId(e.target.value)}
                      disabled={modoEndereco !== 'existente'}
                      className="mt-1 block w-full rounded-lg border-2 border-primaria bg-white p-2 text-[1rem] font-medium"
                    >
                      {enderecos.map((end) => (
                        <option key={end.id} value={end.id}>
                          {formatarEndereco(end)}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              )}

              {/* Opção (c): Digitar novo endereço */}
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-borda p-3 hover:bg-primaria-clara/40">
                <input
                  type="radio"
                  name="modoEndereco"
                  value="novo"
                  checked={modoEndereco === 'novo'}
                  onChange={() => setModoEndereco('novo')}
                  className="mt-1 size-5 text-primaria"
                />
                <span className="font-bold">Digitar novo endereço</span>
              </label>
            </div>

            {/* Formulário de novo endereço */}
            {modoEndereco === 'novo' && (
              <div className="mt-4 space-y-3 rounded-xl border-2 border-primaria/40 bg-white p-4">
                <CampoTexto
                  rotulo="Rua / Avenida"
                  required
                  value={logradouro}
                  onChange={(e) => {
                    setLogradouro(e.target.value)
                    setErroRua(undefined)
                  }}
                  erro={erroRua}
                  placeholder="Ex.: Rua das Flores"
                />

                <div className="grid grid-cols-3 gap-2">
                  <CampoTexto
                    rotulo="Quadra (QD)"
                    value={quadra}
                    onChange={(e) => setQuadra(e.target.value)}
                    placeholder="10"
                  />
                  <CampoTexto
                    rotulo="Lote (LT)"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="5"
                  />
                  <CampoTexto
                    rotulo="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="120 ou S/N"
                  />
                </div>

                <CampoTexto
                  rotulo="Setor / Bairro"
                  required
                  value={setor}
                  onChange={(e) => {
                    setSetor(e.target.value)
                    setErroSetor(undefined)
                  }}
                  erro={erroSetor}
                  placeholder="Ex.: Setor Central"
                />

                <CampoTexto
                  rotulo="Complemento (opcional)"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Ex.: Casa dos fundos"
                />
              </div>
            )}
          </fieldset>

          <div className="flex flex-col gap-3 pt-2">
            <BotaoGrande
              type="submit"
              icone={Check}
              variante="primario"
              disabled={salvando || !nome.trim()}
            >
              {salvando ? 'Salvando...' : 'Salvar pessoa e marcar nesta visita'}
            </BotaoGrande>

            <BotaoGrande icone={X} variante="secundario" onClick={fechar} disabled={salvando}>
              Cancelar
            </BotaoGrande>
          </div>
        </form>

        {/* Diálogo se houver pessoa arquivada com mesmo nome */}
        {pessoaArquivadaEncontrada && (
          <DialogoConfirmacao
            aberto={Boolean(pessoaArquivadaEncontrada)}
            titulo="Pessoa já existe arquivada"
            mensagem={`Já existe um cadastro chamado "${pessoaArquivadaEncontrada.nome}" que estava arquivado. Deseja reativar o cadastro dela e marcá-la nesta visita?`}
            textoConfirmar="Sim, reativar e marcar"
            textoCancelar="Não, cancelar"
            onConfirmar={() => void reativarPessoa(pessoaArquivadaEncontrada)}
            onCancelar={() => setPessoaArquivadaEncontrada(null)}
          />
        )}

        {/* Diálogo se houver pessoa ativa com mesmo nome */}
        {confirmarDuplicadoAtivo && (
          <DialogoConfirmacao
            aberto={confirmarDuplicadoAtivo}
            titulo="Nome já cadastrado"
            mensagem={`Já existe uma pessoa cadastrada com o nome "${nome}". Deseja usar o cadastro que já existe ou criar outra pessoa com o mesmo nome?`}
            textoConfirmar="Criar outra pessoa com mesmo nome"
            textoCancelar="Usar a que já existe"
            onConfirmar={() => {
              setConfirmarDuplicadoAtivo(false)
              void salvar(true)
            }}
            onCancelar={() => {
              setConfirmarDuplicadoAtivo(false)
              void repositorios.pessoas.encontrarPorNome(nome).then((existente) => {
                if (existente) {
                  resetar()
                  aoCriada(existente)
                }
              })
            }}
          />
        )}

        {/* Diálogo se QD, LT e NUM estão vazios */}
        {confirmarQdLteNumVazios && (
          <DialogoConfirmacao
            aberto={confirmarQdLteNumVazios}
            titulo="Quadra, lote e número estão vazios"
            mensagem="Você não preencheu nem Quadra, nem Lote, nem Número. Deseja salvar o endereço assim mesmo?"
            textoConfirmar="Sim, salvar assim"
            textoCancelar="Não, quero preencher"
            onConfirmar={() => {
              setConfirmarQdLteNumVazios(false)
              void salvar(false)
            }}
            onCancelar={() => setConfirmarQdLteNumVazios(false)}
          />
        )}
      </div>
    </div>
  )
}
