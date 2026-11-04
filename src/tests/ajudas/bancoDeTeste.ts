import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { BancoDeDados } from '../../db/dexie/bancoDeDados'
import { criarRepositorios } from '../../db/dexie/criarRepositorios'

/** Cria um banco novo e vazio na memória (cada teste tem o seu). */
export function criarBancoDeTeste() {
  const db = new BancoDeDados('teste', { indexedDB: new IDBFactory(), IDBKeyRange })
  return { db, repos: criarRepositorios(db) }
}

export const ENDERECO = {
  logradouro: 'Rua das Flores',
  quadra: '10',
  lote: '5',
  numero: '120',
  setor: 'Setor Central',
}
