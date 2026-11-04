import { useState } from 'react'
import { ClipboardPlus, Palette, Trash2 } from 'lucide-react'
import { Aviso } from '../components/Aviso'
import { BotaoGrande } from '../components/BotaoGrande'
import { CampoTexto } from '../components/CampoTexto'
import { CartaoSelecionavel } from '../components/CartaoSelecionavel'
import { DialogoConfirmacao } from '../components/DialogoConfirmacao'
import { Pagina } from '../components/Pagina'
import { Progresso } from '../components/Progresso'

/** Vitrine dos componentes (só em desenvolvimento): rota #/vitrine. */
export default function Vitrine() {
  const [marcados, setMarcados] = useState<string[]>(['Maria'])
  const [opcao, setOpcao] = useState('a')
  const [dialogo, setDialogo] = useState(false)
  const alternar = (n: string) =>
    setMarcados((m) => (m.includes(n) ? m.filter((x) => x !== n) : [...m, n]))

  return (
    <Pagina titulo="Vitrine de componentes" icone={Palette}>
      <div className="flex flex-col gap-6">
        <Progresso passo={2} total={5} />
        <div className="flex flex-col gap-3">
          <BotaoGrande icone={ClipboardPlus} variante="primario">Continuar</BotaoGrande>
          <BotaoGrande icone={ClipboardPlus} variante="sucesso">Salvar visita</BotaoGrande>
          <BotaoGrande icone={Trash2} variante="perigo" onClick={() => setDialogo(true)}>Apagar visita</BotaoGrande>
          <BotaoGrande icone={ClipboardPlus} variante="secundario">Voltar</BotaoGrande>
          <BotaoGrande icone={ClipboardPlus} disabled>Desativado</BotaoGrande>
        </div>
        <div className="flex flex-col gap-3">
          {['Maria', 'Ana Paula'].map((n) => (
            <CartaoSelecionavel key={n} titulo={n} subtitulo="Rua das Flores, QD 3 LT 5" selecionado={marcados.includes(n)} onAlternar={() => alternar(n)} />
          ))}
        </div>
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Exemplo">
          {['a', 'b'].map((o) => (
            <CartaoSelecionavel key={o} tipo="opcao" titulo={`Opção ${o.toUpperCase()}`} selecionado={opcao === o} onAlternar={() => setOpcao(o)} />
          ))}
        </div>
        <CampoTexto rotulo="Nome" dica="Escreva o nome completo" placeholder="Ex.: Maria Silva" />
        <CampoTexto rotulo="Nome com erro" erro="Faltou escrever o nome." defaultValue="" />
        <Aviso tipo="info" titulo="Informação">Texto de informação.</Aviso>
        <Aviso tipo="atencao" titulo="Atenção">Essa data é no futuro. Está certo?</Aviso>
        <Aviso tipo="erro" titulo="Erro">Faltou escrever o nome.</Aviso>
        <Aviso tipo="sucesso" grande titulo="Visita salva com sucesso!">Tudo certo.</Aviso>
      </div>
      <DialogoConfirmacao
        aberto={dialogo}
        titulo="Tem certeza que quer apagar esta visita?"
        mensagem="Depois de apagar, não dá para desfazer."
        textoConfirmar="Sim, apagar"
        textoCancelar="Não, voltar"
        iconeConfirmar={Trash2}
        onConfirmar={() => setDialogo(false)}
        onCancelar={() => setDialogo(false)}
      />
    </Pagina>
  )
}
