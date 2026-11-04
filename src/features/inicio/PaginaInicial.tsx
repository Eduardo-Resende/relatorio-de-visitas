import {
  ClipboardList,
  ClipboardPlus,
  FileText,
  HeartHandshake,
  Save,
  Users,
} from 'lucide-react'
import { LinkGrande } from '../../components/BotaoGrande'
import { Pagina } from '../../components/Pagina'

/** Menu principal: poucos botões enormes. */
export function PaginaInicial() {
  return (
    <Pagina titulo="O que você quer fazer?" icone={ClipboardList} mostrarInicio={false}>
      <nav aria-label="Menu principal">
        <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
          <li className="md:col-span-2">
            <LinkGrande para="/nova-visita" icone={ClipboardPlus} variante="sucesso" tamanho="enorme">
              Nova Visita
            </LinkGrande>
          </li>
          <li>
            <LinkGrande para="/visitas" icone={ClipboardList} tamanho="enorme">
              Visitas Feitas
            </LinkGrande>
          </li>
          <li>
            <LinkGrande para="/relatorio" icone={FileText} tamanho="enorme">
              Gerar Relatório (PDF)
            </LinkGrande>
          </li>
          <li>
            <LinkGrande para="/diaconisas" icone={HeartHandshake} tamanho="enorme">
              Diaconisas
            </LinkGrande>
          </li>
          <li>
            <LinkGrande para="/pessoas" icone={Users} tamanho="enorme">
              Pessoas Visitadas
            </LinkGrande>
          </li>
          <li className="md:col-span-2">
            <LinkGrande para="/copia-de-seguranca" icone={Save} variante="secundario" tamanho="enorme">
              Cópia de Segurança
            </LinkGrande>
          </li>
        </ul>
      </nav>
    </Pagina>
  )
}
