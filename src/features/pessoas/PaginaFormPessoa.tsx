import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Home,
  RotateCcw,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { BotaoGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { DialogoConfirmacao } from '../../components/DialogoConfirmacao'
import { Pagina } from '../../components/Pagina'
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
import { completarDdd, formatarTelefone, mascararDigitacaoTelefone } from '../../lib/telefone'

type ModoEndereco = 'novo' | 'mesmo-pessoa' | 'escolher-existente'

export function PaginaFormPessoa() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const editando = Boolean(id)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dddPadrao, setDddPadrao] = useState('62')

  // Endereço (campos manuais)
  const [logradouro, setLogradouro] = useState('')
  const [quadra, setQuadra] = useState('')
  const [lote, setLote] = useState('')
  const [numero, setNumero] = useState('')
  const [setor, setSetor] = useState('')
  const [complemento, setComplemento] = useState('')

  // Modos de preenchimento de endereço
  const [modoEndereco, setModoEndereco] = useState<ModoEndereco>('novo')
  const [outrasPessoas, setOutrasPessoas] = useState<PessoaComEndereco[]>([])
  const [pessoaSelecionadaId, setPessoaSelecionadaId] = useState<string>('')
  const [enderecosExistentes, setEnderecosExistentes] = useState<Endereco[]>([])
  const [enderecoSelecionadoId, setEnderecoSelecionadoId] = useState<string>('')

  // Dados originais para edição
  const [enderecoIdOriginal, setEnderecoIdOriginal] = useState<string | null>(null)
  const [moradoresOriginais, setMoradoresOriginais] = useState<PessoaVisitada[]>([])

  // Erros de validação
  const [erroNome, setErroNome] = useState<string | undefined>()
  const [erroTelefone, setErroTelefone] = useState<string | undefined>()
  const [erroRua, setErroRua] = useState<string | undefined>()
  const [erroSetor, setErroSetor] = useState<string | undefined>()

  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  // Diálogos e avisos
  const [pessoaArquivadaEncontrada, setPessoaArquivadaEncontrada] = useState<PessoaVisitada | null>(null)
  const [confirmarDuplicadoAtivo, setConfirmarDuplicadoAtivo] = useState(false)
  const [confirmarQdLteNumVazios, setConfirmarQdLteNumVazios] = useState(false)
  const [confirmarMudancaCompartilhada, setConfirmarMudancaCompartilhada] = useState(false)
  const [confirmarRemocao, setConfirmarRemocao] = useState(false)
  const [explicacaoArquivada, setExplicacaoArquivada] = useState<string | null>(null)

  useEffect(() => {
    async function inicializar() {
      const config = await repositorios.configuracoes.obter()
      setDddPadrao(config.dddPadrao)

      const todasPessoas = await repositorios.pessoas.listar()
      setOutrasPessoas(todasPessoas.filter((p) => p.id !== id))

      const listaEnderecos = await repositorios.enderecos.listar()
      setEnderecosExistentes(listaEnderecos)

      if (id) {
        const pessoa = await repositorios.pessoas.obterComEndereco(id)
        if (pessoa) {
          setNome(pessoa.nome)
          setTelefone(pessoa.telefone ? formatarTelefone(pessoa.telefone) : '')
          setLogradouro(pessoa.endereco.logradouro)
          setQuadra(pessoa.endereco.quadra)
          setLote(pessoa.endereco.lote)
          setNumero(pessoa.endereco.numero)
          setSetor(pessoa.endereco.setor)
          setComplemento(pessoa.endereco.complemento ?? '')
          setEnderecoIdOriginal(pessoa.enderecoId)

          const moradores = await repositorios.pessoas.moradoresDoEndereco(pessoa.enderecoId)
          setMoradoresOriginais(moradores)
        } else {
          navigate('/pessoas', { replace: true })
        }
      }
      setCarregando(false)
    }
    void inicializar()
  }, [id, navigate])

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTelefone(mascararDigitacaoTelefone(e.target.value))
    setErroTelefone(undefined)
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

  // Submissão do formulário
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setErroNome(undefined)
    setErroTelefone(undefined)
    setErroRua(undefined)
    setErroSetor(undefined)

    // Se estiver em modo novo endereço, valida campos obrigatórios
    if (modoEndereco === 'novo') {
      if (!logradouro.trim()) {
        setErroRua('Faltou escrever a rua ou avenida.')
        return
      }
      if (!setor.trim()) {
        setErroSetor('Faltou escrever o setor ou bairro.')
        return
      }

      // Se QD, LT e NUM estão vazios, pergunta gentilmente antes de continuar
      const dadosEnd = obterDadosEnderecoForm()
      if (estaoQuadraLoteNumeroVazios(dadosEnd) && !confirmarQdLteNumVazios) {
        setConfirmarQdLteNumVazios(true)
        return
      }
    } else if (modoEndereco === 'mesmo-pessoa' && !pessoaSelecionadaId) {
      setErroRua('Escolha com quem esta pessoa mora.')
      return
    } else if (modoEndereco === 'escolher-existente' && !enderecoSelecionadoId) {
      setErroRua('Escolha um endereço da lista.')
      return
    }

    // Se for edição e o endereço for compartilhado com outras pessoas, avisa antes de salvar
    if (editando && enderecoIdOriginal) {
      const outrosMoradores = moradoresOriginais.filter((m) => m.id !== id)
      if (outrosMoradores.length > 0 && !confirmarMudancaCompartilhada) {
        setConfirmarMudancaCompartilhada(true)
        return
      }
    }

    await executarSalvar()
  }

  async function executarSalvar(
    permitirDuplicado = false,
    atualizarTodosMoradores = true,
  ) {
    setSalvando(true)
    const telComDdd = completarDdd(telefone, dddPadrao)

    try {
      // Se for novo cadastro, verifica se já existe na lista de arquivadas
      if (!editando && !permitirDuplicado) {
        const existente = await repositorios.pessoas.encontrarPorNome(nome)
        if (existente && !existente.ativa) {
          setPessoaArquivadaEncontrada(existente)
          setSalvando(false)
          return
        }
      }

      if (!editando) {
        // Criar nova pessoa
        let destino: { enderecoId: string } | { endereco: DadosEndereco }
        if (modoEndereco === 'mesmo-pessoa') {
          const pessoaBase = outrasPessoas.find((p) => p.id === pessoaSelecionadaId)
          if (!pessoaBase) throw new Error('Pessoa selecionada não encontrada.')
          destino = { enderecoId: pessoaBase.enderecoId }
        } else if (modoEndereco === 'escolher-existente') {
          destino = { enderecoId: enderecoSelecionadoId }
        } else {
          destino = { endereco: obterDadosEnderecoForm() }
        }

        await repositorios.pessoas.criar(
          { nome, telefone: telComDdd, ...destino },
          { permitirDuplicado },
        )
      } else if (id && enderecoIdOriginal) {
        // Editar pessoa existente
        await repositorios.pessoas.atualizar(
          id,
          { nome, telefone: telComDdd },
          { permitirDuplicado },
        )

        const novosDadosEnd = obterDadosEnderecoForm()
        if (atualizarTodosMoradores) {
          // Atualiza o endereço compartilhado
          await repositorios.enderecos.atualizar(enderecoIdOriginal, novosDadosEnd)
        } else {
          // Muda o endereço somente desta pessoa
          await repositorios.pessoas.mudarEndereco([id], { endereco: novosDadosEnd })
        }
      }

      navigate('/pessoas')
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
        setErroNome('Ocorreu um erro ao salvar. Verifique os dados digitados.')
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
      const resultado = await repositorios.pessoas.remover(id)
      if (resultado === 'arquivada') {
        setExplicacaoArquivada(
          `Como "${nome}" já participou de visitas registradas anteriormente, ela foi ARQUIVADA em vez de apagada para não alterar o histórico das visitas. Você pode reativá-la a qualquer momento em "Ver arquivadas".`,
        )
      } else {
        navigate('/pessoas')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function handleReativarArquivada() {
    if (!pessoaArquivadaEncontrada) return
    await repositorios.pessoas.reativar(pessoaArquivadaEncontrada.id)
    setPessoaArquivadaEncontrada(null)
    navigate('/pessoas')
  }

  if (carregando) {
    return (
      <Pagina titulo="Carregando..." icone={Users}>
        <p className="py-6 text-center text-[1.1rem]">Aguarde um momento...</p>
      </Pagina>
    )
  }

  const outrosMoradores = moradoresOriginais.filter((m) => m.id !== id)

  return (
    <Pagina
      titulo={editando ? 'Editar Pessoa' : 'Nova Pessoa'}
      icone={editando ? Users : UserPlus}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Seção 1: Dados Pessoais */}
        <div className="rounded-2xl border-2 border-borda bg-papel p-5">
          <h2 className="mb-4 text-xl font-bold text-primaria">1. Dados da Pessoa</h2>
          <div className="flex flex-col gap-4">
            <CampoTexto
              rotulo="Nome completo"
              dica="Escreva o nome da pessoa visitada"
              placeholder="Exemplo: Maria da Silva"
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
              dica={`Exemplo: (${dddPadrao}) 99999-9999. Se não digitar o DDD, usaremos (${dddPadrao}) automaticamente.`}
              placeholder={`(${dddPadrao}) 99999-9999`}
              value={telefone}
              erro={erroTelefone}
              onChange={handleTelefoneChange}
              inputMode="tel"
            />
          </div>
        </div>

        {/* Seção 2: Endereço */}
        <div className="rounded-2xl border-2 border-borda bg-papel p-5">
          <h2 className="mb-4 text-xl font-bold text-primaria">2. Onde esta pessoa mora?</h2>

          {/* Opções de endereço para nova pessoa */}
          {!editando && (
            <div className="mb-6 flex flex-col gap-3">
              <p className="text-[1.05rem] font-bold">Como deseja informar o endereço?</p>

              <button
                type="button"
                onClick={() => setModoEndereco('novo')}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                  modoEndereco === 'novo'
                    ? 'border-primaria bg-primaria-clara font-bold'
                    : 'border-borda hover:bg-primaria-clara/40'
                }`}
              >
                <Home className="size-6 shrink-0 text-primaria" />
                <span>Digitar um novo endereço</span>
              </button>

              {outrasPessoas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModoEndereco('mesmo-pessoa')}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                    modoEndereco === 'mesmo-pessoa'
                      ? 'border-primaria bg-primaria-clara font-bold'
                      : 'border-borda hover:bg-primaria-clara/40'
                  }`}
                >
                  <Users className="size-6 shrink-0 text-primaria" />
                  <span>Mora no mesmo endereço de alguém já cadastrado</span>
                </button>
              )}

              {enderecosExistentes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModoEndereco('escolher-existente')}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${
                    modoEndereco === 'escolher-existente'
                      ? 'border-primaria bg-primaria-clara font-bold'
                      : 'border-borda hover:bg-primaria-clara/40'
                  }`}
                >
                  <Home className="size-6 shrink-0 text-primaria" />
                  <span>Escolher um endereço da lista</span>
                </button>
              )}
            </div>
          )}

          {/* Modo: Mora com alguém */}
          {!editando && modoEndereco === 'mesmo-pessoa' && (
            <div className="flex flex-col gap-3">
              <label htmlFor="select-pessoa-morador" className="block text-[1.1rem] font-bold">
                Escolha a pessoa que mora na mesma casa:
              </label>
              <select
                id="select-pessoa-morador"
                value={pessoaSelecionadaId}
                onChange={(e) => {
                  setPessoaSelecionadaId(e.target.value)
                  setErroRua(undefined)
                }}
                className="min-h-14 w-full rounded-xl border-2 border-borda bg-papel px-4 py-2 text-[1rem]"
              >
                <option value="">Selecione uma pessoa...</option>
                {outrasPessoas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({formatarEndereco(p.endereco)})
                  </option>
                ))}
              </select>
              {erroRua && <p className="font-bold text-perigo">{erroRua}</p>}
            </div>
          )}

          {/* Modo: Escolher endereço existente */}
          {!editando && modoEndereco === 'escolher-existente' && (
            <div className="flex flex-col gap-3">
              <label htmlFor="select-endereco-existente" className="block text-[1.1rem] font-bold">
                Escolha o endereço já cadastrado:
              </label>
              <select
                id="select-endereco-existente"
                value={enderecoSelecionadoId}
                onChange={(e) => {
                  setEnderecoSelecionadoId(e.target.value)
                  setErroRua(undefined)
                }}
                className="min-h-14 w-full rounded-xl border-2 border-borda bg-papel px-4 py-2 text-[1rem]"
              >
                <option value="">Selecione um endereço...</option>
                {enderecosExistentes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatarEndereco(e)}
                  </option>
                ))}
              </select>
              {erroRua && <p className="font-bold text-perigo">{erroRua}</p>}
            </div>
          )}

          {/* Modo: Digitar novo endereço (ou edição) */}
          {(editando || modoEndereco === 'novo') && (
            <div className="flex flex-col gap-4">
              {editando && outrosMoradores.length > 0 && (
                <Aviso tipo="atencao" titulo="Endereço compartilhado!">
                  Moram aqui também: <strong>{outrosMoradores.map((m) => m.nome).join(', ')}</strong>.
                  Ao mudar os dados abaixo, você poderá escolher se atualiza para todos ou só para esta pessoa.
                </Aviso>
              )}

              <CampoTexto
                rotulo="Rua ou Avenida"
                dica="Obrigatório"
                placeholder="Exemplo: Rua das Flores"
                value={logradouro}
                erro={erroRua}
                onChange={(e) => {
                  setLogradouro(e.target.value)
                  setErroRua(undefined)
                }}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CampoTexto
                  rotulo="Quadra (QD)"
                  placeholder="Ex.: 12"
                  value={quadra}
                  onChange={(e) => setQuadra(e.target.value)}
                />
                <CampoTexto
                  rotulo="Lote (LT)"
                  placeholder="Ex.: 05"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                />
                <CampoTexto
                  rotulo="Número (NUM)"
                  dica="Aceita número ou S/N"
                  placeholder="Ex.: 150 ou S/N"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>

              <CampoTexto
                rotulo="Setor ou Bairro"
                dica="Obrigatório"
                placeholder="Exemplo: Setor Central"
                value={setor}
                erro={erroSetor}
                onChange={(e) => {
                  setSetor(e.target.value)
                  setErroSetor(undefined)
                }}
                required
              />

              <CampoTexto
                rotulo="Complemento (opcional)"
                dica="Exemplo: Casa dos fundos, Apto 101"
                placeholder="Exemplo: Casa 2"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="mt-4 flex flex-col gap-3">
          <BotaoGrande
            type="submit"
            icone={Check}
            variante="sucesso"
            tamanho="enorme"
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar Pessoa'}
          </BotaoGrande>

          <BotaoGrande
            icone={ArrowLeft}
            variante="secundario"
            onClick={() => navigate('/pessoas')}
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
                Remover ou arquivar pessoa
              </BotaoGrande>
            </div>
          )}
        </div>
      </form>

      {/* Confirmação quando QD, LT e NUM estão vazios */}
      <DialogoConfirmacao
        aberto={confirmarQdLteNumVazios}
        titulo="Quadra, Lote e Número estão vazios"
        mensagem="Você não preencheu a Quadra, o Lote nem o Número. Deseja salvar o endereço assim mesmo?"
        textoConfirmar="Sim, salvar assim mesmo"
        textoCancelar="Não, vou preencher"
        iconeConfirmar={Check}
        variante="primario"
        onConfirmar={() => {
          setConfirmarQdLteNumVazios(false)
          void executarSalvar()
        }}
        onCancelar={() => setConfirmarQdLteNumVazios(false)}
      />

      {/* Confirmação ao alterar endereço compartilhado */}
      {confirmarMudancaCompartilhada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-[min(92vw,36rem)] rounded-3xl border-4 border-borda bg-papel p-6 text-texto">
            <h2 className="text-2xl font-extrabold text-primaria">
              Atualizar endereço compartilhado?
            </h2>
            <p className="mt-3 text-[1.05rem]">
              Este endereço é compartilhado por{' '}
              <strong>{outrosMoradores.length + 1} pessoas</strong>:{' '}
              {[nome, ...outrosMoradores.map((m) => m.nome)].join(', ')}.
            </p>
            <p className="mt-2 text-[1.05rem]">Como deseja salvar a alteração?</p>

            <div className="mt-6 flex flex-col gap-3">
              <BotaoGrande
                icone={Users}
                variante="primario"
                onClick={() => {
                  setConfirmarMudancaCompartilhada(false)
                  void executarSalvar(false, true)
                }}
              >
                Atualizar para TODAS as {outrosMoradores.length + 1} pessoas
              </BotaoGrande>

              <BotaoGrande
                icone={UserCheck}
                variante="secundario"
                onClick={() => {
                  setConfirmarMudancaCompartilhada(false)
                  void executarSalvar(false, false)
                }}
              >
                Mudar SOMENTE para {nome}
              </BotaoGrande>

              <BotaoGrande
                icone={ArrowLeft}
                variante="secundario"
                onClick={() => setConfirmarMudancaCompartilhada(false)}
              >
                Não salvar, voltar
              </BotaoGrande>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação quando o nome já existe nas ARQUIVADAS */}
      <DialogoConfirmacao
        aberto={Boolean(pessoaArquivadaEncontrada)}
        titulo="Pessoa já cadastrada nas arquivadas"
        mensagem={`Encontramos "${pessoaArquivadaEncontrada?.nome}" na lista de arquivadas. Você gostaria de voltar a usá-la em vez de cadastrar novamente?`}
        textoConfirmar="Sim, voltar a usar"
        textoCancelar="Não, cancelar"
        iconeConfirmar={RotateCcw}
        variante="sucesso"
        onConfirmar={() => void handleReativarArquivada()}
        onCancelar={() => setPessoaArquivadaEncontrada(null)}
      />

      {/* Confirmação quando o nome já existe nas ATIVAS */}
      <DialogoConfirmacao
        aberto={confirmarDuplicadoAtivo}
        titulo="Nome já cadastrado"
        mensagem={`Já existe uma pessoa ativa com o nome "${nome}". Deseja salvar mesmo assim e ter duas com o mesmo nome?`}
        textoConfirmar="Sim, salvar com o mesmo nome"
        textoCancelar="Não, vou corrigir o nome"
        iconeConfirmar={Check}
        variante="primario"
        onConfirmar={() => {
          setConfirmarDuplicadoAtivo(false)
          void executarSalvar(true)
        }}
        onCancelar={() => setConfirmarDuplicadoAtivo(false)}
      />

      {/* Confirmação para remover */}
      <DialogoConfirmacao
        aberto={confirmarRemocao}
        titulo="Remover pessoa?"
        mensagem={`Tem certeza que deseja remover "${nome}"? Se ela já participou de visitas no passado, será arquivada para manter os relatórios corretos.`}
        textoConfirmar="Sim, remover"
        textoCancelar="Não, voltar"
        iconeConfirmar={Trash2}
        variante="perigo"
        onConfirmar={() => void handleRemover()}
        onCancelar={() => setConfirmarRemocao(false)}
      />

      {/* Modal explicativo quando a pessoa é arquivada em vez de apagada */}
      {explicacaoArquivada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-[min(92vw,36rem)] rounded-3xl border-4 border-borda bg-papel p-6 text-texto">
            <h2 className="text-2xl font-extrabold text-primaria">Pessoa Arquivada</h2>
            <div className="mt-4">
              <Aviso tipo="info">{explicacaoArquivada}</Aviso>
            </div>
            <div className="mt-6">
              <BotaoGrande
                icone={Check}
                variante="primario"
                onClick={() => navigate('/pessoas')}
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
