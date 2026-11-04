import type { Repositorios } from '../repositorios'
import type { BancoDeDados } from './bancoDeDados'
import { criarRepositorioDiaconisas } from './diaconisas'
import { criarRepositorioEnderecos } from './enderecos'
import { criarRepositorioPessoas } from './pessoas'
import {
  criarRepositorioConfiguracoes,
  criarRepositorioDicionarioPessoal,
  criarRepositorioRascunho,
} from './simples'
import { criarRepositorioVisitas } from './visitas'

/** Liga todos os repositórios a um banco Dexie (IndexedDB). */
export function criarRepositorios(db: BancoDeDados): Repositorios {
  const enderecos = criarRepositorioEnderecos(db)
  return {
    diaconisas: criarRepositorioDiaconisas(db),
    enderecos,
    pessoas: criarRepositorioPessoas(db, enderecos),
    visitas: criarRepositorioVisitas(db),
    rascunho: criarRepositorioRascunho(db),
    configuracoes: criarRepositorioConfiguracoes(db),
    dicionarioPessoal: criarRepositorioDicionarioPessoal(db),
  }
}
