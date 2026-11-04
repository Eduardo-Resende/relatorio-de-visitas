import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { BotaoGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { CartaoSelecionavel } from '../../components/CartaoSelecionavel'
import { repositorios, type PessoaComEndereco, type PessoaVisitada } from '../../db'
import { formatarEndereco } from '../../lib/endereco'
import { formatarTelefone } from '../../lib/telefone'
import { normalizarTexto } from '../../lib/texto'
import { ModalNovaPessoaRapida } from './ModalNovaPessoaRapida'

interface Props {
  pessoaIds: string[]
  aoMudarSelecao: (novosIds: string[]) => void
  erro?: string
  aoLimparErro: () => void
}

/** Passo 3: Seleção das pessoas visitadas. */
export function Passo3Pessoas({
  pessoaIds,
  aoMudarSelecao,
  erro,
  aoLimparErro,
}: Props) {
  const [pessoas, setPessoas] = useState<PessoaComEndereco[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [dddPadrao, setDddPadrao] = useState('62')
  const [modalNovaAberta, setModalNovaAberta] = useState(false)

  async function recarregarPessoas() {
    const lista = await repositorios.pessoas.listar()
    setPessoas(lista)
  }

  useEffect(() => {
    async function carregar() {
      await recarregarPessoas()
      const config = await repositorios.configuracoes.obter()
      setDddPadrao(config.dddPadrao)
      setCarregando(false)
    }
    void carregar()
  }, [])

  function alternar(id: string) {
    aoLimparErro()
    if (pessoaIds.includes(id)) {
      aoMudarSelecao(pessoaIds.filter((item) => item !== id))
    } else {
      aoMudarSelecao([...pessoaIds, id])
    }
  }

  async function handlePessoaCriada(nova: PessoaVisitada) {
    await recarregarPessoas()
    aoLimparErro()
    // Já deixa a nova marcada automaticamente
    if (!pessoaIds.includes(nova.id)) {
      aoMudarSelecao([...pessoaIds, nova.id])
    }
    setModalNovaAberta(false)
  }

  const termo = normalizarTexto(busca)
  const filtradas = termo
    ? pessoas.filter((p) => {
        const nomeNorm = p.nomeNormalizado
        const endNorm = normalizarTexto(formatarEndereco(p.endereco))
        return nomeNorm.includes(termo) || endNorm.includes(termo)
      })
    : pessoas

  const pessoasJaSelecionadas = pessoas.filter((p) => pessoaIds.includes(p.id))

  return (
    <section aria-labelledby="titulo-passo-pessoas" className="space-y-6">
      <div>
        <h2 id="titulo-passo-pessoas" className="text-[1.3rem] font-bold text-primaria">
          Quem foi visitado?
        </h2>
        <p className="mt-1 text-texto-suave">
          Marque todas as pessoas que receberam a visita. Escolha pelo menos uma.
        </p>
      </div>

      {/* Botão de adicionar nova pessoa na hora */}
      <BotaoGrande
        icone={UserPlus}
        variante="primario"
        onClick={() => setModalNovaAberta(true)}
      >
        + Adicionar nova pessoa
      </BotaoGrande>

      {/* Campo de busca */}
      <CampoTexto
        rotulo="Buscar pessoa por nome ou endereço"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Digite o nome ou a rua..."
        dica={pessoas.length > 0 ? `${pessoas.length} pessoas cadastradas` : undefined}
      />

      {erro && (
        <p role="alert" className="text-[1.1rem] font-bold text-perigo">
          {erro}
        </p>
      )}

      {/* Contagem de selecionadas */}
      <div className="flex items-center justify-between border-b-2 border-borda pb-2">
        <span className="text-[1.1rem] font-bold text-primaria">
          {pessoaIds.length === 0
            ? 'Nenhuma selecionada'
            : pessoaIds.length === 1
              ? '1 pessoa selecionada'
              : `${pessoaIds.length} pessoas selecionadas`}
        </span>
      </div>

      {/* Lista de cartões */}
      {carregando ? (
        <p className="text-center text-texto-suave">Carregando pessoas...</p>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-borda p-6 text-center">
          <p className="text-texto-suave">
            {pessoas.length === 0
              ? 'Nenhuma pessoa cadastrada ainda. Toque no botão acima para adicionar a primeira.'
              : 'Nenhuma pessoa encontrada com essa busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="group" aria-label="Lista de pessoas visitadas">
          {filtradas.map((p) => {
            const selecionada = pessoaIds.includes(p.id)
            const enderecoTexto = formatarEndereco(p.endereco)
            const subtitulo = p.telefone
              ? `${enderecoTexto} • ${formatarTelefone(p.telefone)}`
              : enderecoTexto

            return (
              <CartaoSelecionavel
                key={p.id}
                titulo={p.nome}
                subtitulo={subtitulo}
                selecionado={selecionada}
                onAlternar={() => alternar(p.id)}
              />
            )
          })}
        </div>
      )}

      {/* Modal para cadastrar nova pessoa */}
      <ModalNovaPessoaRapida
        aberto={modalNovaAberta}
        aoFechar={() => setModalNovaAberta(false)}
        aoCriada={handlePessoaCriada}
        dddPadrao={dddPadrao}
        pessoasJaSelecionadas={pessoasJaSelecionadas}
      />
    </section>
  )
}
