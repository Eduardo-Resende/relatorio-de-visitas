import { RotateCw } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { BotaoGrande } from '../components/BotaoGrande'

/** Mostrada se o navegador não deixar o app guardar dados (ex.: aba privada). */
export function TelaErroBanco() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 p-6">
      <Aviso tipo="erro" titulo="Não consegui abrir o espaço para guardar as visitas">
        Isso costuma acontecer quando o navegador está em uma aba privada ou anônima, ou sem
        espaço no aparelho. Abra o aplicativo em uma aba normal e tente de novo.
      </Aviso>
      <BotaoGrande icone={RotateCw} onClick={() => window.location.reload()}>
        Tentar de novo
      </BotaoGrande>
    </div>
  )
}
