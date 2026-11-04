import { Link, Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { ControleFonte } from '../components/ControleFonte'

/** Estrutura comum a todas as telas: cabeçalho com A-/A+, conteúdo e rodapé. */
export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-papel focus:p-3 focus:font-bold"
      >
        Ir para o conteúdo
      </a>
      <header className="bg-primaria text-white">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-[1.3rem] font-extrabold leading-tight text-white no-underline">
            Relatório de Visitas
          </Link>
          <ControleFonte />
        </div>
      </header>
      <main id="conteudo" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t-2 border-borda px-4 py-4 text-center text-texto-suave">
        <p className="mx-auto flex max-w-3xl items-center justify-center gap-2">
          <ShieldCheck aria-hidden="true" className="size-[1.3em] shrink-0" />
          <span>Seus dados ficam só neste aparelho.</span>
        </p>
      </footer>
    </div>
  )
}
