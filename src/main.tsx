import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './app/App.tsx'
import { TelaErroBanco } from './app/TelaErroBanco.tsx'
import { bd, pedirArmazenamentoPersistente } from './db'
import { aplicarTamanho, lerTamanhoSalvo } from './lib/fonte'

// Aplica o tamanho de letra salvo antes de desenhar a tela (evita "pulo" visual).
aplicarTamanho(lerTamanhoSalvo())

// Service Worker: guarda o app no aparelho para funcionar sem internet.
registerSW({ immediate: true })

async function iniciar() {
  const raiz = createRoot(document.getElementById('root')!)
  try {
    await bd.open()
  } catch {
    raiz.render(<TelaErroBanco />)
    return
  }
  // Pede ao navegador para não apagar os dados do app (não bloqueia a abertura).
  void pedirArmazenamentoPersistente()
  raiz.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void iniciar()
