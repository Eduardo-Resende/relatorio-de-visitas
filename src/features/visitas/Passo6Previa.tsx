import { formatarDataParaExibicao } from '../../lib/data'
import { formatarTelefone } from '../../lib/telefone'
import type { DadosEndereco, PessoaNaVisita } from '../../db'

interface Props {
  data: string
  diaconisas: PessoaNaVisita[]
  pessoas: PessoaNaVisita[]
  endereco: DadosEndereco
  observacoes: string
  modoEdicao?: boolean
}

/**
 * Prévia da visita fiel ao layout oficial do formulário em papel:
 * Cabeçalho cinza, Atualização Cadastral, Endereço pautado, Nome/Telefone e Observações pautadas.
 */
export function Passo6Previa({
  data,
  diaconisas,
  pessoas,
  endereco,
  observacoes,
  modoEdicao = false,
}: Props) {
  const nomesDiaconisas = diaconisas.map((d) => d.nome).join(' / ')
  const dataFormatada = formatarDataParaExibicao(data)

  // Mínimo de 2 linhas para pessoas (como no formulário em papel)
  const linhasPessoas = [...pessoas]
  while (linhasPessoas.length < 2) {
    linhasPessoas.push({ id: `vazio-${linhasPessoas.length}`, nome: '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[1.3rem] font-bold text-primaria">
          {modoEdicao ? 'Revisar alterações da visita' : 'Revisão da visita'}
        </h2>
        <p className="mt-1 text-texto-suave">
          Confira como os dados vão aparecer no relatório impresso antes de salvar.
        </p>
      </div>

      {/* BLOCO DA VISITA - FORMATO FIEL AO FORMULÁRIO EM PAPEL */}
      <div
        role="region"
        aria-label="Ficha da visita"
        className="overflow-hidden rounded-2xl border-4 border-borda bg-white shadow-md text-black font-sans"
      >
        {/* Faixa superior institucional */}
        <div className="border-b-2 border-black bg-cinza-claro px-4 py-2 text-center text-[1rem] font-black uppercase tracking-wider">
          Equipe de Visitas: Diaconisas
        </div>

        {/* Linha 1: NOME (diaconisas) e DATA DA VISITA */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black bg-cinza-claro/70 px-4 py-2">
          <div className="min-w-0 flex-1">
            <span className="font-extrabold text-[0.95rem]">NOME: </span>
            <span className="font-bold text-[1.05rem] text-primaria-escura">{nomesDiaconisas}</span>
          </div>
          <div className="shrink-0 text-right">
            <span className="font-extrabold text-[0.95rem]">DATA DA VISITA: </span>
            <span className="font-bold text-[1.05rem] text-primaria-escura">{dataFormatada}</span>
          </div>
        </div>

        {/* Linha 2: ATUALIZAÇÃO CADASTRAL */}
        <div className="border-b border-black py-1 text-center text-[0.85rem] font-extrabold uppercase tracking-widest text-cinza-escuro">
          Atualização Cadastral
        </div>

        {/* Linha 3: ENDEREÇO */}
        <div className="border-b-2 border-black p-4 space-y-2">
          <div className="text-[0.85rem] font-black uppercase">Endereço:</div>
          <div className="space-y-2 text-[1.05rem]">
            <div className="border-b border-black/40 pb-1">
              <span className="font-bold">{endereco.logradouro || '—'}</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[0.95rem]">
              <span>
                <strong>QD:</strong> {endereco.quadra || '____'}
              </span>
              <span>
                <strong>LT:</strong> {endereco.lote || '____'}
              </span>
              <span>
                <strong>NUM:</strong> {endereco.numero || '____'}
              </span>
              <span>
                <strong>SETOR:</strong> {endereco.setor || '____'}
              </span>
              {endereco.complemento && (
                <span>
                  <strong>COMPL.:</strong> {endereco.complemento}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Linha 4: NOME E TELEFONE DAS PESSOAS */}
        <div className="border-b-2 border-black p-4">
          <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-1 text-[0.85rem] font-black uppercase">
            <span className="col-span-8">Nome da pessoa visitada</span>
            <span className="col-span-4 text-right">Telefone</span>
          </div>

          <div className="divide-y divide-black/20">
            {linhasPessoas.map((p, idx) => (
              <div
                key={p.id || idx}
                className="grid grid-cols-12 gap-2 py-2 text-[1.05rem] font-medium"
              >
                <span className="col-span-8 truncate font-bold text-primaria-escura">
                  {p.nome || <span className="text-transparent">—</span>}
                </span>
                <span className="col-span-4 text-right text-texto">
                  {p.telefone ? formatarTelefone(p.telefone) : <span className="text-transparent">—</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Linha 5: OBSERVAÇÕES PAUTADAS */}
        <div className="p-4">
          <div className="text-[0.85rem] font-black uppercase text-cinza-escuro">
            Observações:
          </div>

          <div className="mt-2 min-h-36 rounded-lg bg-[linear-gradient(transparent_27px,#d1d5db_28px)] bg-[size:100%_28px] leading-7">
            {observacoes.trim() ? (
              <p className="whitespace-pre-wrap font-sans text-[1.05rem] text-texto pt-0.5">
                {observacoes}
              </p>
            ) : (
              <p className="italic text-texto-suave pt-1">
                (Nenhuma observação registrada nesta visita)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
