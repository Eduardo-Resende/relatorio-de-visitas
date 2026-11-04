import { BancoDeDados } from './dexie/bancoDeDados'
import { criarRepositorios } from './dexie/criarRepositorios'

export type * from './tipos'
export type * from './repositorios'
export { ErroNaoEncontrado, ErroNomeDuplicado, ErroValidacao } from '../lib/erros'
export { pedirArmazenamentoPersistente } from './armazenamento'

/** Banco único do app (IndexedDB do navegador). */
export const bd = new BancoDeDados()

/** Ponto de acesso aos dados para as telas. Troque a implementação aqui para usar outro armazenamento. */
export const repositorios = criarRepositorios(bd)
