import { useEffect, useState } from 'react'
import { Check, Home, MapPin, PlusCircle } from 'lucide-react'
import { CampoTexto } from '../../components/CampoTexto'
import {
  repositorios,
  type DadosEndereco,
  type Endereco,
  type PessoaComEndereco,
} from '../../db'
import { formatarEndereco } from '../../lib/endereco'
import type { ModoEndereco } from './tipos'

interface Props {
  pessoaIds: string[]
  modoEndereco: ModoEndereco
  aoMudarModo: (modo: ModoEndereco) => void
  enderecoIdEscolhido?: string
  aoMudarEnderecoEscolhido: (id: string) => void
  enderecoManual?: DadosEndereco
  aoMudarEnderecoManual: (dados: DadosEndereco) => void
  atualizarCadastroPessoas: boolean
  aoMudarAtualizarCadastro: (atualizar: boolean) => void
  erro?: string
  aoLimparErro: () => void
}

/** Passo 4: Confirmação e definição do endereço da visita. */
export function Passo4Endereco({
  pessoaIds,
  modoEndereco,
  aoMudarModo,
  enderecoIdEscolhido,
  aoMudarEnderecoEscolhido,
  enderecoManual,
  aoMudarEnderecoManual,
  atualizarCadastroPessoas,
  aoMudarAtualizarCadastro,
  erro,
  aoLimparErro,
}: Props) {
  const [pessoasSelecionadas, setPessoasSelecionadas] = useState<PessoaComEndereco[]>([])
  const [carregando, setCarregando] = useState(true)

  // Campos manuais do endereço "outro"
  const [logradouro, setLogradouro] = useState(enderecoManual?.logradouro ?? '')
  const [quadra, setQuadra] = useState(enderecoManual?.quadra ?? '')
  const [lote, setLote] = useState(enderecoManual?.lote ?? '')
  const [numero, setNumero] = useState(enderecoManual?.numero ?? '')
  const [setor, setSetor] = useState(enderecoManual?.setor ?? '')
  const [complemento, setComplemento] = useState(enderecoManual?.complemento ?? '')

  useEffect(() => {
    async function carregar() {
      const pessoas: PessoaComEndereco[] = []
      for (const id of pessoaIds) {
        const p = await repositorios.pessoas.obterComEndereco(id)
        if (p) pessoas.push(p)
      }
      setPessoasSelecionadas(pessoas)

      // Identifica endereços únicos
      const enderecosMap = new Map<string, Endereco>()
      pessoas.forEach((p) => {
        if (!enderecosMap.has(p.enderecoId)) {
          enderecosMap.set(p.enderecoId, p.endereco)
        }
      })
      const enderecosUnicos = Array.from(enderecosMap.values())

      if (enderecosUnicos.length === 1 && modoEndereco !== 'outro') {
        aoMudarModo('mesmo')
        aoMudarEnderecoEscolhido(enderecosUnicos[0].id)
      } else if (enderecosUnicos.length > 1 && modoEndereco !== 'outro') {
        aoMudarModo('escolhido')
        if (!enderecoIdEscolhido || !enderecosMap.has(enderecoIdEscolhido)) {
          aoMudarEnderecoEscolhido(enderecosUnicos[0].id)
        }
      }

      setCarregando(false)
    }
    void carregar()
  }, [pessoaIds, modoEndereco, enderecoIdEscolhido, aoMudarModo, aoMudarEnderecoEscolhido])

  function atualizarManual(parcial: Partial<DadosEndereco>) {
    aoLimparErro()
    const novo: DadosEndereco = {
      logradouro: parcial.logradouro !== undefined ? parcial.logradouro : logradouro,
      quadra: parcial.quadra !== undefined ? parcial.quadra : quadra,
      lote: parcial.lote !== undefined ? parcial.lote : lote,
      numero: parcial.numero !== undefined ? parcial.numero : numero,
      setor: parcial.setor !== undefined ? parcial.setor : setor,
      complemento: parcial.complemento !== undefined ? parcial.complemento : complemento,
    }
    if (parcial.logradouro !== undefined) setLogradouro(parcial.logradouro)
    if (parcial.quadra !== undefined) setQuadra(parcial.quadra)
    if (parcial.lote !== undefined) setLote(parcial.lote)
    if (parcial.numero !== undefined) setNumero(parcial.numero)
    if (parcial.setor !== undefined) setSetor(parcial.setor)
    if (parcial.complemento !== undefined) setComplemento(parcial.complemento)
    aoMudarEnderecoManual(novo)
  }

  // Agrupamento de pessoas por endereço
  const enderecosAgrupados: { endereco: Endereco; pessoas: PessoaComEndereco[] }[] = []
  pessoasSelecionadas.forEach((p) => {
    let grupo = enderecosAgrupados.find((g) => g.endereco.id === p.enderecoId)
    if (!grupo) {
      grupo = { endereco: p.endereco, pessoas: [] }
      enderecosAgrupados.push(grupo)
    }
    grupo.pessoas.push(p)
  })

  const mesmoEnderecoParaTodos = enderecosAgrupados.length <= 1
  const enderecoPrincipal = enderecosAgrupados[0]?.endereco

  if (carregando) {
    return <p className="text-center text-texto-suave">Carregando dados de endereço...</p>
  }

  return (
    <section aria-labelledby="titulo-passo-endereco" className="space-y-6">
      <div>
        <h2 id="titulo-passo-endereco" className="text-[1.3rem] font-bold text-primaria">
          Onde foi realizada a visita?
        </h2>
        <p className="mt-1 text-texto-suave">
          Confira o endereço do local onde a visita aconteceu.
        </p>
      </div>

      {erro && (
        <p role="alert" className="text-[1.1rem] font-bold text-perigo">
          {erro}
        </p>
      )}

      {/* CASO 1: Todas as pessoas selecionadas têm o MESMO endereço */}
      {mesmoEnderecoParaTodos && enderecoPrincipal && (
        <div className="space-y-5">
          <div className="rounded-2xl border-3 border-primaria bg-papel p-5 shadow-xs">
            <span className="text-[0.95rem] font-bold uppercase tracking-wider text-primaria">
              Endereço cadastrado:
            </span>
            <p className="mt-2 text-[1.35rem] font-extrabold leading-snug text-primaria">
              {formatarEndereco(enderecoPrincipal)}
            </p>
            <p className="mt-1 text-[1rem] text-texto-suave">
              Moram aqui:{' '}
              {pessoasSelecionadas.map((p) => p.nome).join(', ')}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[1.15rem] font-bold text-primaria">
              A visita foi neste endereço?
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  aoLimparErro()
                  aoMudarModo('mesmo')
                  aoMudarEnderecoEscolhido(enderecoPrincipal.id)
                }}
                className={`flex min-h-20 items-center justify-center gap-3 rounded-2xl border-3 px-6 py-4 text-[1.15rem] font-bold transition ${
                  modoEndereco === 'mesmo'
                    ? 'border-sucesso-escura bg-sucesso text-white'
                    : 'border-borda bg-papel text-texto hover:bg-cinza-claro'
                }`}
              >
                <Check className="size-7" />
                <span>Sim, foi neste endereço</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  aoLimparErro()
                  aoMudarModo('outro')
                }}
                className={`flex min-h-20 items-center justify-center gap-3 rounded-2xl border-3 px-6 py-4 text-[1.15rem] font-bold transition ${
                  modoEndereco === 'outro'
                    ? 'border-primaria-escura bg-primaria text-white'
                    : 'border-borda bg-papel text-texto hover:bg-cinza-claro'
                }`}
              >
                <MapPin className="size-7" />
                <span>Não, foi em outro endereço</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASO 2: As pessoas têm endereços DIFERENTES */}
      {!mesmoEnderecoParaTodos && (
        <div className="space-y-4">
          <p className="text-[1.15rem] font-bold text-primaria">
            As pessoas visitadas moram em endereços diferentes. Em qual endereço foi a visita?
          </p>

          <div className="space-y-3" role="radiogroup" aria-label="Endereços encontrados">
            {enderecosAgrupados.map((grupo) => {
              const selecionado =
                modoEndereco === 'escolhido' && enderecoIdEscolhido === grupo.endereco.id
              return (
                <button
                  key={grupo.endereco.id}
                  type="button"
                  role="radio"
                  aria-checked={selecionado}
                  onClick={() => {
                    aoLimparErro()
                    aoMudarModo('escolhido')
                    aoMudarEnderecoEscolhido(grupo.endereco.id)
                  }}
                  className={`flex min-h-20 w-full items-start gap-4 rounded-2xl border-3 p-4 text-left transition ${
                    selecionado
                      ? 'border-primaria bg-primaria-clara'
                      : 'border-borda bg-papel hover:bg-primaria-clara/40'
                  }`}
                >
                  <Home
                    className={`mt-1 size-7 shrink-0 ${
                      selecionado ? 'text-primaria' : 'text-texto-suave'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-[1.15rem] leading-snug">
                      {formatarEndereco(grupo.endereco)}
                    </strong>
                    <span className="mt-1 block text-[0.95rem] text-texto-suave">
                      Moram neste endereço:{' '}
                      {grupo.pessoas.map((p) => p.nome).join(', ')}
                    </span>
                  </div>
                </button>
              )
            })}

            <button
              type="button"
              role="radio"
              aria-checked={modoEndereco === 'outro'}
              onClick={() => {
                aoLimparErro()
                aoMudarModo('outro')
              }}
              className={`flex min-h-20 w-full items-center gap-4 rounded-2xl border-3 p-4 text-left transition ${
                modoEndereco === 'outro'
                  ? 'border-primaria bg-primaria-clara'
                  : 'border-borda bg-papel hover:bg-primaria-clara/40'
              }`}
            >
              <PlusCircle
                className={`size-7 shrink-0 ${
                  modoEndereco === 'outro' ? 'text-primaria' : 'text-texto-suave'
                }`}
              />
              <span className="text-[1.15rem] font-bold">
                A visita foi em outro endereço (digitar novo)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO QUANDO ESCOLHEU "NÃO/OUTRO ENDEREÇO" */}
      {modoEndereco === 'outro' && (
        <div className="space-y-4 rounded-2xl border-3 border-primaria/50 bg-papel p-5 shadow-sm">
          <h3 className="text-[1.2rem] font-bold text-primaria">
            Digite o endereço onde ocorreu a visita:
          </h3>

          <CampoTexto
            rotulo="Rua / Avenida"
            required
            value={logradouro}
            onChange={(e) => atualizarManual({ logradouro: e.target.value })}
            placeholder="Ex.: Rua das Flores"
          />

          <div className="grid grid-cols-3 gap-2">
            <CampoTexto
              rotulo="Quadra (QD)"
              value={quadra}
              onChange={(e) => atualizarManual({ quadra: e.target.value })}
              placeholder="10"
            />
            <CampoTexto
              rotulo="Lote (LT)"
              value={lote}
              onChange={(e) => atualizarManual({ lote: e.target.value })}
              placeholder="5"
            />
            <CampoTexto
              rotulo="Número"
              value={numero}
              onChange={(e) => atualizarManual({ numero: e.target.value })}
              placeholder="120 ou S/N"
            />
          </div>

          <CampoTexto
            rotulo="Setor / Bairro"
            required
            value={setor}
            onChange={(e) => atualizarManual({ setor: e.target.value })}
            placeholder="Ex.: Setor Central"
          />

          <CampoTexto
            rotulo="Complemento (opcional)"
            value={complemento}
            onChange={(e) => atualizarManual({ complemento: e.target.value })}
            placeholder="Ex.: Casa 2, fundos"
          />

          {/* Pergunta sobre atualização cadastral */}
          <div className="mt-4 border-t-2 border-borda pt-4">
            <p className="text-[1.1rem] font-bold text-primaria">
              Quer atualizar o endereço cadastrado dessas pessoas para este novo endereço?
            </p>
            <p className="mt-1 text-[0.95rem] text-texto-suave">
              Se você escolher sim, o cadastro delas será atualizado para este endereço a partir de agora.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => aoMudarAtualizarCadastro(true)}
                className={`flex min-h-16 items-center justify-center gap-3 rounded-xl border-3 px-4 py-3 text-[1.05rem] font-bold transition ${
                  atualizarCadastroPessoas
                    ? 'border-sucesso-escura bg-sucesso text-white'
                    : 'border-borda bg-white text-texto hover:bg-cinza-claro'
                }`}
              >
                <Check className="size-6" />
                <span>Sim, atualizar o cadastro delas</span>
              </button>

              <button
                type="button"
                onClick={() => aoMudarAtualizarCadastro(false)}
                className={`flex min-h-16 items-center justify-center gap-3 rounded-xl border-3 px-4 py-3 text-[1.05rem] font-bold transition ${
                  !atualizarCadastroPessoas
                    ? 'border-primaria-escura bg-primaria text-white'
                    : 'border-borda bg-white text-texto hover:bg-cinza-claro'
                }`}
              >
                <span>Não, usar só nesta visita</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
