import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import {
  ClipboardList,
  FileText,
  House,
  Save,
  SearchX,
} from 'lucide-react'
import { LinkGrande } from '../components/BotaoGrande'
import { Pagina } from '../components/Pagina'
import { PaginaDiaconisas } from '../features/diaconisas/PaginaDiaconisas'
import { PaginaFormDiaconisa } from '../features/diaconisas/PaginaFormDiaconisa'
import { PaginaInicial } from '../features/inicio/PaginaInicial'
import { PaginaFormPessoa } from '../features/pessoas/PaginaFormPessoa'
import { PaginaPessoas } from '../features/pessoas/PaginaPessoas'
import { PaginaNovaVisita } from '../features/visitas/PaginaNovaVisita'
import { TamanhoFonteProvider } from '../hooks/TamanhoFonteProvider'
import { Layout } from './Layout'
import { PaginaEmBreve } from './PaginaEmBreve'

// Página de testes visuais dos componentes: só existe no modo de desenvolvimento.
const Vitrine = import.meta.env.DEV ? lazy(() => import('./Vitrine')) : null

function NaoEncontrada() {
  return (
    <Pagina titulo="Não achei esta página" icone={SearchX} mostrarInicio={false}>
      <LinkGrande para="/" icone={House}>
        Ir para o início
      </LinkGrande>
    </Pagina>
  )
}

export default function App() {
  return (
    <TamanhoFonteProvider>
      {/* HashRouter: funciona em qualquer hospedagem estática, sem configuração. */}
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<PaginaInicial />} />
            {/* Assistente de Nova Visita e Edição de Visitas */}
            <Route path="nova-visita" element={<PaginaNovaVisita />} />
            <Route path="nova-visita/:passo" element={<PaginaNovaVisita />} />
            <Route path="visitas/:id/editar" element={<PaginaNovaVisita modoEdicao />} />
            <Route path="visitas/:id/editar/:passo" element={<PaginaNovaVisita modoEdicao />} />

            <Route path="visitas" element={<PaginaEmBreve titulo="Visitas Feitas" icone={ClipboardList} />} />
            <Route path="relatorio" element={<PaginaEmBreve titulo="Gerar Relatório (PDF)" icone={FileText} />} />

            {/* Rotas de Diaconisas */}
            <Route path="diaconisas" element={<PaginaDiaconisas />} />
            <Route path="diaconisas/nova" element={<PaginaFormDiaconisa />} />
            <Route path="diaconisas/:id/editar" element={<PaginaFormDiaconisa />} />

            {/* Rotas de Pessoas Visitadas */}
            <Route path="pessoas" element={<PaginaPessoas />} />
            <Route path="pessoas/nova" element={<PaginaFormPessoa />} />
            <Route path="pessoas/:id/editar" element={<PaginaFormPessoa />} />

            <Route path="copia-de-seguranca" element={<PaginaEmBreve titulo="Cópia de Segurança" icone={Save} />} />
            {Vitrine && (
              <Route
                path="vitrine"
                element={
                  <Suspense fallback={null}>
                    <Vitrine />
                  </Suspense>
                }
              />
            )}
            <Route path="*" element={<NaoEncontrada />} />
          </Route>
        </Routes>
      </HashRouter>
    </TamanhoFonteProvider>
  )
}
