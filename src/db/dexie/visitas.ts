import { ErroNaoEncontrado, ErroValidacao } from '../../lib/erros'
import { normalizarTexto } from '../../lib/texto'
import { enderecoDaVisita, validarDataIso } from '../../lib/validadores'
import type { EntradaVisita, FiltroVisitas, RepositorioVisitas } from '../repositorios'
import type { PessoaNaVisita, Visita } from '../tipos'
import type { BancoDeDados } from './bancoDeDados'
import { novoId, semRepetidos } from './util'

type Cadastro = { id: string; nome: string; telefone?: string }

function copia(c: Cadastro): PessoaNaVisita {
  return { id: c.id, nome: c.nome, ...(c.telefone ? { telefone: c.telefone } : {}) }
}

export function criarRepositorioVisitas(db: BancoDeDados): RepositorioVisitas {
  /**
   * Monta a lista de cópias (snapshot). Quem já constava na visita (`anteriores`)
   * mantém a cópia antiga; os demais usam o cadastro de agora.
   */
  async function montarCopias(
    ids: string[],
    anteriores: PessoaNaVisita[],
    buscar: (ids: string[]) => Promise<(Cadastro | undefined)[]>,
    aviso: string,
  ): Promise<PessoaNaVisita[]> {
    const unicos = semRepetidos(ids)
    const antigas = new Map(anteriores.map((p) => [p.id, p]))
    const faltam = unicos.filter((id) => !antigas.has(id))
    const atuais = await buscar(faltam)
    const novas = new Map<string, PessoaNaVisita>()
    faltam.forEach((id, i) => {
      const c = atuais[i]
      if (!c) throw new ErroNaoEncontrado(aviso)
      novas.set(id, copia(c))
    })
    return unicos.map((id) => (antigas.get(id) ?? novas.get(id)) as PessoaNaVisita)
  }

  async function montar(entrada: EntradaVisita, anterior?: Visita) {
    const data = validarDataIso(entrada.data)
    const endereco = enderecoDaVisita(entrada.endereco)
    if (semRepetidos(entrada.diaconisaIds).length < 1) {
      throw new ErroValidacao('diaconisas', 'Escolha pelo menos uma diaconisa.')
    }
    if (semRepetidos(entrada.pessoaIds).length < 1) {
      throw new ErroValidacao('pessoas', 'Escolha pelo menos uma pessoa visitada.')
    }
    const diaconisas = await montarCopias(
      entrada.diaconisaIds,
      anterior?.diaconisas ?? [],
      (ids) => db.diaconisas.bulkGet(ids),
      'uma das diaconisas escolhidas',
    )
    const pessoas = await montarCopias(
      entrada.pessoaIds,
      anterior?.pessoas ?? [],
      (ids) => db.pessoas.bulkGet(ids),
      'uma das pessoas escolhidas',
    )
    return {
      data,
      endereco,
      observacoes: entrada.observacoes ?? '',
      diaconisas,
      pessoas,
      diaconisaIds: diaconisas.map((d) => d.id),
      pessoaIds: pessoas.map((p) => p.id),
    }
  }

  async function listar(filtro: FiltroVisitas = {}): Promise<Visita[]> {
    const { de, ate, busca, ordem = 'desc' } = filtro
    let lista: Visita[]
    if (de || ate) {
      lista = await db.visitas
        .where('data')
        .between(de ?? '0000-00-00', ate ?? '9999-99-99', true, true)
        .toArray()
    } else {
      lista = await db.visitas.toArray()
    }
    const termo = busca ? normalizarTexto(busca) : ''
    if (termo) {
      lista = lista.filter((v) =>
        [...v.diaconisas, ...v.pessoas].some((p) => normalizarTexto(p.nome).includes(termo)),
      )
    }
    const sentido = ordem === 'asc' ? 1 : -1
    return lista.sort(
      (a, b) =>
        sentido * (a.data.localeCompare(b.data) || a.criadoEm.localeCompare(b.criadoEm)),
    )
  }

  return {
    async criar(entrada) {
      return db.transaction('rw', db.visitas, db.diaconisas, db.pessoas, async () => {
        const agora = new Date().toISOString()
        const visita: Visita = { id: novoId(), ...(await montar(entrada)), criadoEm: agora, atualizadoEm: agora }
        await db.visitas.add(visita)
        return visita
      })
    },

    async atualizar(id, entrada) {
      return db.transaction('rw', db.visitas, db.diaconisas, db.pessoas, async () => {
        const anterior = await db.visitas.get(id)
        if (!anterior) throw new ErroNaoEncontrado('a visita')
        const visita: Visita = {
          id,
          ...(await montar(entrada, anterior)),
          criadoEm: anterior.criadoEm,
          atualizadoEm: new Date().toISOString(),
        }
        await db.visitas.put(visita)
        return visita
      })
    },

    obter: (id) => db.visitas.get(id),

    listar,

    async contar(filtro) {
      return (await listar(filtro)).length
    },

    async apagar(id) {
      await db.visitas.delete(id)
    },
  }
}
