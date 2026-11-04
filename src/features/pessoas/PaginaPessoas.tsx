import { useEffect, useState } from 'react'
import {
  Home,
  RotateCcw,
  UserCheck,
  UserMinus,
  UserPen,
  UserPlus,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { BotaoGrande, LinkGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { Pagina } from '../../components/Pagina'
import { repositorios, type PessoaComEndereco, type PessoaVisitada } from '../../db'
import { formatarEndereco } from '../../lib/endereco'
import { formatarTelefone } from '../../lib/telefone'

export function PaginaPessoas() {
  const navigate = useNavigate()
  const [pessoas, setPessoas] = useState<PessoaComEndereco[]>([])
  const [outrosMoradoresMap, setOutrosMoradoresMap] = useState<Record<string, string[]>>({})
  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState<'ativas' | 'arquivadas'>('ativas')
  const [carregando, setCarregando] = useState(true)
  const [avisoSucesso, setAvisoSucesso] = useState<string | null>(null)

  async function carregar(mostrarCarregando = false) {
    if (mostrarCarregando) setCarregando(true)
    try {
      const lista = await repositorios.pessoas.listar({ incluirArquivadas: true })
      setPessoas(lista)

      // Carrega os coabitantes para cada endereço
      const mapa: Record<string, string[]> = {}
      const enderecoIds = [...new Set(lista.map((p) => p.enderecoId))]

      await Promise.all(
        enderecoIds.map(async (endId) => {
          const moradores = await repositorios.pessoas.moradoresDoEndereco(endId, {
            incluirArquivadas: true,
          })
          mapa[endId] = moradores.map((m) => m.nome)
        }),
      )
      setOutrosMoradoresMap(mapa)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    async function inicial() {
      const lista = await repositorios.pessoas.listar({ incluirArquivadas: true })
      const mapa: Record<string, string[]> = {}
      const enderecoIds = [...new Set(lista.map((p) => p.enderecoId))]

      await Promise.all(
        enderecoIds.map(async (endId) => {
          const moradores = await repositorios.pessoas.moradoresDoEndereco(endId, {
            incluirArquivadas: true,
          })
          mapa[endId] = moradores.map((m) => m.nome)
        }),
      )

      if (ativo) {
        setPessoas(lista)
        setOutrosMoradoresMap(mapa)
        setCarregando(false)
      }
    }
    void inicial()
    return () => {
      ativo = false
    }
  }, [])

  const ativas = pessoas.filter((p) => p.ativa)
  const arquivadas = pessoas.filter((p) => !p.ativa)

  const listaFiltrada = (aba === 'ativas' ? ativas : arquivadas).filter((p) => {
    if (!busca.trim()) return true
    const termo = busca.trim().toLowerCase()
    const nomeOk = p.nomeNormalizado.includes(termo)
    const ruaOk = p.endereco.chaveNormalizada.includes(termo)
    return nomeOk || ruaOk
  })

  async function reativarPessoa(p: PessoaVisitada) {
    await repositorios.pessoas.reativar(p.id)
    setAvisoSucesso(`"${p.nome}" voltou a ser usada com sucesso!`)
    await carregar()
  }

  return (
    <Pagina titulo="Pessoas Visitadas" icone={Users}>
      <div className="flex flex-col gap-6">
        <LinkGrande para="/pessoas/nova" icone={UserPlus} variante="sucesso" tamanho="enorme">
          + Adicionar Nova Pessoa
        </LinkGrande>

        {avisoSucesso && (
          <Aviso tipo="sucesso" grande titulo="Muito bem!">
            {avisoSucesso}
          </Aviso>
        )}

        {/* Abas grandes para alternar entre ativas e arquivadas */}
        <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Filtrar pessoas visitadas">
          <BotaoGrande
            icone={UserCheck}
            variante={aba === 'ativas' ? 'primario' : 'secundario'}
            onClick={() => setAba('ativas')}
            aria-selected={aba === 'ativas'}
            role="tab"
          >
            Ativas ({ativas.length})
          </BotaoGrande>
          <BotaoGrande
            icone={UserMinus}
            variante={aba === 'arquivadas' ? 'primario' : 'secundario'}
            onClick={() => setAba('arquivadas')}
            aria-selected={aba === 'arquivadas'}
            role="tab"
          >
            Ver arquivadas ({arquivadas.length})
          </BotaoGrande>
        </div>

        {/* Campo de busca */}
        <CampoTexto
          rotulo="Buscar por nome ou endereço"
          dica="Digite o nome da pessoa ou o nome da rua/setor"
          placeholder="Exemplo: Maria ou Flores"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {carregando ? (
          <p className="py-6 text-center text-[1.1rem]">Carregando pessoas...</p>
        ) : listaFiltrada.length === 0 ? (
          <Aviso tipo="info">
            {busca.trim()
              ? `Ninguém encontrado com o termo "${busca}".`
              : aba === 'ativas'
                ? 'Nenhuma pessoa cadastrada ainda. Toque no botão verde acima para cadastrar a primeira!'
                : 'Não há nenhuma pessoa arquivada no momento.'}
          </Aviso>
        ) : (
          <div className="flex flex-col gap-4" role="list">
            {listaFiltrada.map((p) => {
              const todosMoradores = outrosMoradoresMap[p.enderecoId] || []
              const outrosMoradores = todosMoradores.filter((mNome) => mNome !== p.nome)

              return (
                <div
                  key={p.id}
                  role="listitem"
                  className="flex flex-col gap-3 rounded-2xl border-2 border-borda bg-papel p-5 shadow-sm md:flex-row md:items-start md:justify-between"
                >
                  <div className="flex-1">
                    <h2 className="text-[1.3rem] font-bold text-texto">{p.nome}</h2>
                    <p className="mt-1 text-[1.05rem] text-texto-suave">
                      {p.telefone ? `Telefone: ${formatarTelefone(p.telefone)}` : 'Sem telefone cadastrado'}
                    </p>

                    <div className="mt-2 flex items-start gap-2 text-[1.05rem] font-medium text-texto">
                      <Home className="mt-1 size-5 shrink-0 text-primaria" />
                      <span>{formatarEndereco(p.endereco)}</span>
                    </div>

                    {outrosMoradores.length > 0 && (
                      <div className="mt-2 rounded-xl bg-primaria-clara p-3 text-[0.95rem] text-primaria">
                        <strong>Moram aqui também:</strong> {outrosMoradores.join(', ')}
                      </div>
                    )}

                    {!p.ativa && (
                      <span className="mt-2 inline-block rounded-lg bg-atencao-clara px-3 py-1 text-sm font-bold text-atencao">
                        Arquivada (não aparece em novas visitas)
                      </span>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-3 pt-2 md:pt-0">
                    {p.ativa ? (
                      <BotaoGrande
                        icone={UserPen}
                        variante="secundario"
                        cheio={false}
                        onClick={() => navigate(`/pessoas/${p.id}/editar`)}
                      >
                        Editar
                      </BotaoGrande>
                    ) : (
                      <BotaoGrande
                        icone={RotateCcw}
                        variante="sucesso"
                        cheio={false}
                        onClick={() => void reativarPessoa(p)}
                      >
                        Voltar a usar
                      </BotaoGrande>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Pagina>
  )
}
