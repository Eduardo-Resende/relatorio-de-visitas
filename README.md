# Relatório de Visitas

Aplicativo web (PWA) para registrar visitas pastorais e gerar relatórios em PDF.
Roda 100% no aparelho (sem servidor, sem login) e funciona sem internet depois de instalado.

## Comandos (para quem desenvolve)

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Abre o app para desenvolvimento (a rota `#/vitrine` mostra os componentes) |
| `npm run dev:celular` | Abre o app na rede local com HTTPS para testar no celular |
| `npm run build` | Gera a versão final em `dist/` |
| `npm run preview:celular` | Roda a versão gerada em `dist/` com HTTPS na rede local |
| `npm test` | Roda os testes de regras de negócio (Vitest) |
| `npm run test:e2e` | Roda os testes no navegador (Playwright - celular 360px e fluxo com rascunho) |
| `npm run lint` | Confere o código (oxlint) |
| `npm run icones` | Gera de novo os ícones do app (`scripts/gerar-icones.mjs`) |

## Andamento

- [x] Fase 1 - Projeto base
- [x] Fase 2 - Banco de dados
- [x] Fase 3 - Cadastros (Diaconisas, Pessoas e Endereços compartilhados)
- [x] Fase 4 - Assistente de Nova Visita e Rascunho automático
- [ ] Fases 5 a 10 (ver plano)

## Decisões

Escolhas feitas para facilitar a vida de quem vai usar (senhoras com pouca prática com tecnologia).

- **PDF:** jsPDF com Helvetica embutida. Caracteres que a Helvetica não suporta (emojis, símbolos) serão convertidos para equivalentes ou trocados por "?" (Fase 7).
- **Rotas:** `HashRouter` (endereços com `#/`). Funciona em qualquer hospedagem estática sem configuração e dentro de subpastas.
- **Navegação:** a tela inicial tem botões enormes; nas outras telas há sempre o botão "Voltar ao início" no topo. Não há barra inferior fixa, para não tirar espaço da tela do celular.
- **Tamanho da letra:** 4 níveis (20, 24, 28 e 32 px) pelos botões **A-** e **A+** no cabeçalho. Tudo no app usa `rem`, então tudo cresce junto. A escolha fica salva no aparelho (`localStorage`) e é aplicada antes de desenhar a tela, sem "pulo" visual.
- **Cores:** paleta de alto contraste (azul, verde, vinho e fundo creme). O teste `src/tests/contraste.test.ts` garante contraste mínimo 4.5:1 (WCAG AA) nos pares de texto/fundo do tema.
- **Foco do teclado:** anel preto com folga amarela, visível sobre qualquer fundo.
- **Fonte:** fontes do próprio sistema (sem baixar nada), para funcionar offline e carregar rápido.
- **Atualização do app:** automática (Service Worker `autoUpdate`). A usuária não precisa responder nada.
- **Precache do PWA:** guarda todos os arquivos, incluindo o dicionário do corretor (vários MB). Limite configurado em 12 MB (`maximumFileSizeToCacheInBytes`).
- **Corretor ortográfico:** pacote `dictionary-pt-br` (descrição oficial: "Portuguese (Brazil) spelling dictionary"), usado com `nspell`.
- **Confirmações:** usam `<dialog>` nativo (o foco fica preso na caixa, Esc = "Não, voltar"). O botão "Não, voltar" vem primeiro e recebe o foco, para evitar toque sem querer em "Sim, apagar".
- **Botões:** sempre ícone + texto, altura mínima de 3,5 rem (70 px com a letra normal; o mínimo pedido era 56 px).
- **Datas:** a data da visita é guardada como texto `AAAA-MM-DD` (sem hora), para nunca mudar de dia por causa do fuso horário. Momentos exatos (`criadoEm`, `atualizadoEm`) usam o formato ISO completo.
- **Telefone:** guardado só com números (`62999999999`). A máscara `(62) 99999-9999` é aplicada só na hora de mostrar e digitar (Fase 3). O banco aceita vazio ou 10/11 números.
- **Duplicados:** nomes são comparados sem acentos, maiúsculas e espaços extras. O banco recusa o duplicado com um erro que traz o cadastro existente; a tela pergunta "Quer usar a que já existe?" e, se a usuária insistir, cria com `permitirDuplicado` (pode haver duas pessoas com o mesmo nome em casas diferentes).
- **Arquivar x apagar:** `remover()` só apaga de verdade quem nunca apareceu em visitas; senão apenas arquiva. A checagem usa índices próprios (`diaconisaIds` e `pessoaIds`) que a visita guarda além das cópias.
- **Endereços:** são uma tabela à parte, com chave única (rua+QD+LT+NUM+setor normalizados), então "Rua das Flores" e "rua  das flores" viram um cadastro só. Quando o último morador sai, o endereço sem moradores é apagado automaticamente. Corrigir um endereço vale para todos que moram nele; se a correção deixar o endereço igual a outro, os dois são juntados.
- **Cópia (snapshot) da visita:** nomes, telefones e endereço ficam dentro da visita. Ao editar uma visita, quem já estava mantém a cópia antiga; só quem entrou usa os dados atuais. O complemento do endereço não entra na cópia (não aparece no formulário em papel).
- **Filtro de arquivadas:** feito ao listar, pois valores `true/false` não podem ser índices do IndexedDB (o volume de dados é pequeno).
- **Migrações:** a lista `VERSOES` em `src/db/dexie/bancoDeDados.ts` guarda o histórico. Para mudar o formato dos dados, nunca edite uma versão antiga: acrescente uma nova no fim (com `migrar` se precisar converter).
- **Troca de armazenamento:** as telas só usam as interfaces de `src/db/repositorios.ts`. A implementação local (Dexie) fica em `src/db/dexie/`.
- **Se o banco não abrir** (ex.: aba privada), o app mostra uma tela explicando o problema, em vez de ficar em branco.
- **Armazenamento protegido:** ao abrir, o app chama `navigator.storage.persist()` para o navegador não apagar os dados.
- **DDD automático:** na digitação de telefone, se o usuário informar apenas 8 ou 9 dígitos, o app completa automaticamente com o DDD padrão das configurações (62) antes de salvar.
- **Endereço compartilhado:** ao cadastrar pessoas, oferece 3 opções intuitivas: digitar novo endereço, morar no mesmo endereço de alguém já cadastrado ou escolher da lista de endereços. O cartão exibe "Moram aqui também: ...".
- **Alerta de endereço compartilhado:** ao alterar um endereço compartilhado por múltiplas pessoas, o app pergunta se deseja atualizar para todos ou desmembrar/alterar apenas para a pessoa selecionada.
- **Aviso gentil de endereço:** se Quadra, Lote e Número estiverem todos vazios, o app pede confirmação gentil antes de salvar.
- **Reativação inteligente:** se o nome digitado já existir arquivado, o app oferece reativá-lo com um toque. Ao arquivar, explica de forma didática que o cadastro foi guardado para preservar o histórico das visitas.
- **Rotas por passo no assistente (`#/nova-visita/:passo`):** cada passo do assistente tem sua própria rota na URL. Quando a usuária aperta o botão voltar nativo do celular ou do navegador, ela volta um passo da visita em vez de sair ou fechar o aplicativo.
- **Barra fixa inferior e teclado móvel:** botões "Voltar" e "Continuar" em barra fixa no rodapé para facilidade de toque no celular. Em telas pequenas (360px) com o teclado virtual aberto, o recuo inferior (`pb-32`) e a diretiva `interactive-widget=resizes-content` garantem que o campo em digitação permaneça sempre visível acima do teclado e da barra.
- **Rascunho automático com debounce:** salva o progresso com espera de 500 ms após a digitação, imediatamente ao trocar de passos e ao sair da tela ou fechar o app. Suporta anotações longas de 20.000+ caracteres de forma instantânea. Ao entrar em "Nova Visita" com rascunho salvo, pergunta se quer continuar de onde parou ou começar do zero (com confirmação). Se alguém do rascunho tiver sido arquivado ou removido posteriormente, o assistente ajusta a lista e avisa gentilmente a usuária.
- **Pessoa nova criada no passo 3 salva na hora:** ao tocar em "+ Adicionar nova pessoa" no passo 3, ela é cadastrada no banco de dados na mesma hora, reaproveitando as opções de endereço compartilhado e a lógica de duplicados e reativação da Fase 3.
- **Mesmas diaconisas da última visita:** botão no passo 2 que busca a visita anterior e permite marcar com um só toque as diaconisas participantes que continuam ativas, sem marcar automaticamente por padrão.
- **Reaproveitamento na edição (Fase 6):** o assistente e a prévia aceitam uma visita existente como ponto de partida (`/visitas/:id/editar/:passo`), permitindo editar e salvar visitas sem duplicar lógica de tela.

## Como testar no celular com HTTPS

1. Conecte o celular na mesma rede Wi-Fi do computador.
2. No terminal do computador, execute:
   ```bash
   npm run preview:celular
   ```
   (ou `npm run dev:celular` para modo de desenvolvimento com recarregamento em tempo real).
3. O terminal mostrará o endereço local HTTPS com o IP do computador (exemplo: `https://10.97.49.136:4173`).
4. Abra esse endereço no navegador do celular (Chrome no Android ou Safari no iPhone). O navegador exibirá um aviso de certificado auto-assinado; toque em "Avançado" e "Continuar para o site (inseguro)".

## Como publicar

Como o aplicativo é 100% estático (não usa servidor, roda totalmente no aparelho do usuário):

### Opção 1: GitHub Pages (Gratuito)
1. Crie um repositório no GitHub.
2. No seu computador, inicialize o git e envie o código:
   ```bash
   git init
   git add .
   git commit -m "Versao inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/relatorio-de-visitas.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings > Pages** e selecione a branch `main` e a pasta `/dist` (ou use uma GitHub Action simples para rodar `npm run build` e publicar).

### Opção 2: Netlify ou Cloudflare Pages (Arraste e Solte - Super Fácil)
1. Gere a pasta de produção no computador:
   ```bash
   npm run build
   ```
2. Abra o site do [Netlify Drop](https://app.netlify.com/drop) ou Cloudflare Pages.
3. Arraste a pasta `dist` gerada diretamente para a tela.
4. O site gera um link com HTTPS pronto em menos de 30 segundos! As irmãs da igreja já poderão abrir, instalar como app e usar offline.
