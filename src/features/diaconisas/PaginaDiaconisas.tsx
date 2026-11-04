import { useEffect, useState } from 'react'
import {
  HeartHandshake,
  RotateCcw,
  UserCheck,
  UserMinus,
  UserPen,
  UserPlus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { BotaoGrande, LinkGrande } from '../../components/BotaoGrande'
import { CampoTexto } from '../../components/CampoTexto'
import { Pagina } from '../../components/Pagina'
import { repositorios, type Diaconisa } from '../../db'
import { formatarTelefone } from '../../lib/telefone'

export function PaginaDiaconisas() {
  const navigate = useNavigate()
  const [diaconisas, setDiaconisas] = useState<Diaconisa[]>([])
  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState<'ativas' | 'arquivadas'>('ativas')
  const [carregando, setCarregando] = useState(true)
  const [avisoSucesso, setAvisoSucesso] = useState<string | null>(null)

  async function carregar(mostrarCarregando = false) {
    if (mostrarCarregando) setCarregando(true)
    try {
      const lista = await repositorios.diaconisas.listar({ incluirArquivadas: true })
      setDiaconisas(lista)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    let ativo = true
    repositorios.diaconisas.listar({ incluirArquivadas: true }).then((lista) => {
      if (ativo) {
        setDiaconisas(lista)
        setCarregando(false)
      }
    })
    return () => {
      ativo = false
    }
  }, [])

  const ativas = diaconisas.filter((d) => d.ativa)
  const arquivadas = diaconisas.filter((d) => !d.ativa)

  const listaFiltrada = (aba === 'ativas' ? ativas : arquivadas).filter((d) => {
    if (!busca.trim()) return true
    return d.nomeNormalizado.includes(busca.trim().toLowerCase())
  })

  async function reativarDiaconisa(d: Diaconisa) {
    await repositorios.diaconisas.reativar(d.id)
    setAvisoSucesso(`"${d.nome}" voltou a ser usada com sucesso!`)
    await carregar()
  }

  return (
    <Pagina titulo="Diaconisas" icone={HeartHandshake}>
      <div className="flex flex-col gap-6">
        <LinkGrande para="/diaconisas/nova" icone={UserPlus} variante="sucesso" tamanho="enorme">
          + Adicionar Nova Diaconisa
        </LinkGrande>

        {avisoSucesso && (
          <Aviso tipo="sucesso" grande titulo="Muito bem!">
            {avisoSucesso}
          </Aviso>
        )}

        {/* Abas grandes para alternar entre ativas e arquivadas */}
        <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Filtrar diaconisas">
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
          rotulo="Buscar diaconisa"
          dica="Digite o nome para encontrar mais rápido"
          placeholder="Exemplo: Maria"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {carregando ? (
          <p className="py-6 text-center text-[1.1rem]">Carregando diaconisas...</p>
        ) : listaFiltrada.length === 0 ? (
          <Aviso tipo="info">
            {busca.trim()
              ? `Nenhuma diaconisa encontrada com o nome "${busca}".`
              : aba === 'ativas'
                ? 'Nenhuma diaconisa cadastrada ainda. Toque no botão verde acima para cadastrar a primeira!'
                : 'Não há nenhuma diaconisa arquivada no momento.'}
          </Aviso>
        ) : (
          <div className="flex flex-col gap-4" role="list">
            {listaFiltrada.map((d) => (
              <div
                key={d.id}
                role="listitem"
                className="flex flex-col gap-3 rounded-2xl border-2 border-borda bg-papel p-5 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 className="text-[1.3rem] font-bold text-texto">{d.nome}</h2>
                  <p className="mt-1 text-[1.05rem] text-texto-suave">
                    {d.telefone ? `Telefone: ${formatarTelefone(d.telefone)}` : 'Sem telefone cadastrado'}
                  </p>
                  {!d.ativa && (
                    <span className="mt-2 inline-block rounded-lg bg-atencao-clara px-3 py-1 text-sm font-bold text-atencao">
                      Arquivada (não aparece em novas visitas)
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  {d.ativa ? (
                    <BotaoGrande
                      icone={UserPen}
                      variante="secundario"
                      cheio={false}
                      onClick={() => navigate(`/diaconisas/${d.id}/editar`)}
                    >
                      Editar
                    </BotaoGrande>
                  ) : (
                    <BotaoGrande
                      icone={RotateCcw}
                      variante="sucesso"
                      cheio={false}
                      onClick={() => void reativarDiaconisa(d)}
                    >
                      Voltar a usar
                    </BotaoGrande>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Pagina>
  )
}
