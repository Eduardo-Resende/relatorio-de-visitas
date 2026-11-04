# MISSÃO

Construir um aplicativo web (PWA) chamado "Relatório de Visitas", usado por um pastor e pelas diaconisas de uma igreja para registrar visitas pastorais e gerar relatórios em PDF. A imagem anexa é o formulário em papel que o app deve substituir e é a REFERÊNCIA OFICIAL do layout do PDF. Analise a imagem com atenção antes de começar.

O app roda 100% LOCAL (sem servidor, sem banco na nuvem, sem login). Todos os dados ficam no aparelho (celular ou computador). Deve funcionar offline depois de instalado.

# PÚBLICO E PRINCÍPIOS DE USABILIDADE (PRIORIDADE MÁXIMA)

Quem vai usar são, em maioria, senhoras idosas com pouca familiaridade com tecnologia. Portanto:
- Todo o texto em português do Brasil, linguagem simples, sem termos técnicos (nunca "cadastro inválido", "erro 500"; sim "Faltou escrever o nome").
- Fonte base de 20px ou mais. Botões com no mínimo 56px de altura, grandes, com ÍCONE + TEXTO (nunca só ícone). Alto contraste (WCAG AA no mínimo). Botões "A- / A+" para aumentar a letra, com a escolha salva.
- Uma pergunta por tela (fluxo em passos, estilo assistente), com barra de progresso ("Passo 2 de 5"), botão grande "Continuar" e botão "Voltar" sempre visíveis.
- Sem gestos escondidos (arrastar, segurar, duplo toque). Tudo por toque simples.
- Confirmações claras antes de apagar ou sair ("Tem certeza que quer apagar esta visita?" com botões "Sim, apagar" e "Não, voltar").
- Rascunho automático: se ela sair no meio do relatório, ao voltar aparece "Você parou uma visita no meio. Quer continuar?".
- Mensagens de sucesso grandes e visíveis após salvar ("Visita salva com sucesso!").
- Menu principal com poucos botões enormes: Nova Visita, Visitas Feitas, Gerar Relatório (PDF), Diaconisas, Pessoas Visitadas, Cópia de Segurança.
- Layout responsivo: celular (uso principal, retrato) e computador. No celular, navegação por barra inferior ou botões grandes na tela inicial.

# STACK TECNOLÓGICA

- React + TypeScript + Vite, instalável como PWA (vite-plugin-pwa, Service Worker com cache de todos os arquivos, manifest com ícones e nome "Relatório de Visitas").
- Tailwind CSS para estilo.
- Armazenamento: IndexedDB via Dexie. Chamar navigator.storage.persist() para reduzir risco de o navegador apagar os dados.
- Validação: Zod. Formulários: React Hook Form.
- Datas: date-fns com locale pt-BR.
- PDF: jsPDF (desenho manual com controle total de coordenadas) ou pdf-lib. Escolha a que reproduzir melhor o layout e gerar tudo offline.
- Corretor: nspell + dicionário pt-BR (pacote dictionary-pt-br ou equivalente), carregado sob demanda e incluído no cache offline.
- Testes: Vitest (regras de negócio) e Playwright (fluxo principal), se viável.
- Nenhuma chamada a APIs externas para dados. Nenhum analytics.

# MODELO DE DADOS (IndexedDB)

Diaconisa: id (uuid), nome, telefone (opcional), ativa (boolean, para "arquivar" em vez de apagar), criadoEm.

Endereco: id, logradouro (rua/avenida), quadra (QD), lote (LT), numero (NUM), setor, complemento (opcional), chaveNormalizada (logradouro+QD+LT+NUM+setor sem acentos e em minúsculas, para evitar duplicados).

PessoaVisitada: id, nome, telefone (opcional), enderecoId, ativa, criadoEm.
IMPORTANTE: várias pessoas podem compartilhar o MESMO Endereco (relação muitos-para-um). O endereço é uma entidade separada e reaproveitável.

Visita: id, data (ISO), diaconisas (lista de {id, nome, telefone}), pessoas (lista de {id, nome, telefone}), endereco ({logradouro, quadra, lote, numero, setor}), observacoes (texto longo, SEM limite de caracteres), criadoEm, atualizadoEm.
IMPORTANTE: a Visita guarda uma CÓPIA (snapshot) dos nomes, telefones e endereço do momento da visita. Assim o histórico e os PDFs não mudam se alguém editar o cadastro depois.

Rascunho: guarda o estado do assistente de nova visita.
Configuracoes: tamanho da fonte, DDD padrão (62), primeiro dia da semana (padrão: domingo).

# FLUXO "NOVA VISITA" (ASSISTENTE EM PASSOS)

Passo 1 - Data: campo de data grande, padrão HOJE, exibida como DD/MM/AAAA. Botões rápidos "Hoje" e "Ontem".

Passo 2 - Quem visitou (diaconisas): lista de cartões grandes com nome e caixa de seleção (pode marcar várias). Campo de busca no topo. Botão grande "+ Adicionar nova diaconisa" abre mini-formulário (nome, telefone) e já deixa a nova marcada. Mínimo 1 selecionada.

Passo 3 - Quem foi visitado: busca por nome + lista de cartões com seleção múltipla. Cada cartão mostra nome e endereço. Botão "+ Adicionar nova pessoa": nome, telefone e endereço. Ao informar o endereço de uma nova pessoa, oferecer: (a) "Mora no mesmo endereço de [pessoa já selecionada]", (b) escolher um endereço já cadastrado (busca por rua/setor), (c) digitar novo endereço. Mínimo 1 selecionada.

Passo 4 - Confirmar endereço:
 - Se todas as pessoas selecionadas têm o mesmo endereço: mostrar o endereço em letra grande e perguntar "A visita foi neste endereço?" [Sim] [Não, foi em outro].
 - Se têm endereços diferentes: perguntar "Em qual endereço foi a visita?" listando os endereços encontrados + opção "Outro endereço".
 - Se escolher "Não/Outro": abrir formulário de endereço (Rua, QD, LT, NUM, Setor). Depois perguntar "Quer atualizar o endereço cadastrado dessas pessoas para este novo?" [Sim, atualizar] [Não, só nesta visita]. Se sim, atualizar PessoaVisitada.enderecoId (reaproveitando endereço igual se já existir).

Passo 5 - Observações: caixa de texto grande (altura generosa, cresce conforme o texto, SEM maxLength e SEM truncar), com os recursos de microfone e corretor (ver abaixo).

Passo 6 - Revisão: mostrar uma PRÉVIA no mesmo formato do formulário (cabeçalho cinza com NOME e DATA DA VISITA, ATUALIZAÇÃO CADASTRAL, ENDEREÇO, NOME/TELEFONE, OBSERVAÇÕES). Botões grandes: "Salvar visita" e "Voltar para corrigir". Ao salvar, limpar o rascunho e mostrar sucesso com botão "Fazer outra visita" e "Ir para o início".

# MICROFONE (FALAR PARA ESCREVER)

- Usar Web Speech API (SpeechRecognition / webkitSpeechRecognition) com lang "pt-BR", continuous=true e interimResults=true.
- Botão grande "Falar" com ícone de microfone. Ao tocar, muda para "Parar de falar" (vermelho) com indicador visual pulsando e a frase "Estou ouvindo...". O texto provisório aparece em cor diferente e vira definitivo quando confirmado.
- O texto falado é INSERIDO na posição do cursor, sem apagar o que já existe.
- O navegador encerra o reconhecimento sozinho após silêncio: reiniciar automaticamente enquanto o usuário não tocar em "Parar".
- Tratar: permissão negada (mensagem simples explicando como liberar o microfone), sem internet, navegador sem suporte (esconder o botão e mostrar dica "Use o microfone do teclado do seu celular").
- Sugestão de comandos por voz simples (opcional): "ponto", "vírgula", "nova linha" convertidos em pontuação.
- Deixar a lógica isolada em um hook (useSpeechToText) para poder trocar o motor depois.

# CORRETOR ORTOGRÁFICO

- Campo de observações com spellcheck="true", lang="pt-BR", autocapitalize="sentences" (sublinhado nativo do navegador).
- Botão grande "Corrigir ortografia": usa nspell + dicionário pt-BR local. Abre um painel com uma palavra suspeita por vez, mostrando "Você escreveu: X" e botões grandes com até 3 sugestões, mais "Deixar como está" e "Sempre aceitar esta palavra".
- "Sempre aceitar" salva a palavra num dicionário pessoal no IndexedDB (nomes de pessoas e bairros).
- Ignorar números e palavras capitalizadas no meio da frase por padrão (provavelmente nomes próprios).
- Botão "Corrigir tudo automaticamente" que aplica a primeira sugestão, com opção de desfazer.
- Carregar o dicionário só na primeira vez que usar e deixar em cache para uso offline.

# TELAS DE CADASTRO

Diaconisas e Pessoas Visitadas: lista com busca, botão "+ Adicionar", editar (toque no cartão), "Arquivar/Remover". Regra: se a pessoa ou diaconisa já aparece em visitas, NUNCA apagar de fato, apenas arquivar (some das listas de seleção, mas o histórico permanece). Em Pessoas Visitadas, mostrar o endereço e permitir ver quem mais mora no mesmo endereço.

Visitas Feitas: lista em ordem da mais recente, com filtro por período e busca por nome. Cada visita pode ser aberta, editada (reutilizando as telas do assistente) ou apagada (com confirmação).

# VALIDAÇÕES

- Nomes: obrigatório, mínimo 3 caracteres, remover espaços extras, impedir apenas números. Detectar duplicado ignorando acentos e maiúsculas ("Já existe uma Maria Silva. Quer usar a que já existe?").
- Telefone: opcional; se preenchido, aceitar 10 ou 11 dígitos com DDD, aplicar máscara automática (62) 99999-9999 enquanto digita, DDD padrão das configurações se ela digitar só 8 ou 9 dígitos. Teclado numérico no celular (inputMode="tel").
- Endereço: Rua e Setor obrigatórios. QD, LT e NUM opcionais, mas avisar com gentileza se todos estiverem vazios. Permitir "S/N" em número.
- Data: obrigatória, formato DD/MM/AAAA. Se for futura, perguntar "Essa data é no futuro. Está certo?".
- Diaconisas da visita: mínimo 1. Pessoas visitadas: mínimo 1.
- Observações: não obrigatória, mas se estiver vazia perguntar "Quer salvar sem observações?". SEM limite de tamanho (testar com 20.000+ caracteres).
- Todas as mensagens de erro em linguagem amigável, perto do campo, em vermelho com ícone, e sem bloquear a tela inteira.

# EXPORTAR RELATÓRIO EM PDF

Tela "Gerar Relatório":
- Opções grandes: "Esta semana", "Semana passada", "Este mês", "Escolher datas" (De / Até) e "Escolher uma semana".
- Mostrar a contagem antes de gerar ("Encontrei 12 visitas neste período"). Se for zero, avisar com gentileza.
- Botão "Gerar PDF". Gerar no próprio aparelho. Depois: "Baixar" e, no celular, "Compartilhar" (Web Share API com arquivo, ex.: enviar por WhatsApp), com fallback para download.
- Nome do arquivo: Relatorio-Visitas_AAAA-MM-DD_a_AAAA-MM-DD.pdf.

LAYOUT DO PDF (fiel à imagem anexa):
- Página A4 PAISAGEM, margens pequenas. Fonte sem serifa (Helvetica ou similar), com acentos corretos.
- Faixa cinza no topo da página: "EQUIPE DE VISITAS: Diaconisas" (em negrito), repetida em todas as páginas.
- Cada visita é um BLOCO com borda, na ordem cronológica:
  1. Faixa cinza: "NOME:" (negrito) seguido dos nomes das diaconisas que visitaram, separados por " / " (reduzir fonte ou quebrar linha se forem muitas) + "DATA DA VISITA:" (negrito) seguido de DD/MM/AAAA.
  2. "ATUALIZAÇÃO CADASTRAL" centralizado, em negrito, fonte menor.
  3. Rótulo "ENDEREÇO"; abaixo, linha sublinhada com a rua preenchida, seguida de "QD ____ LT ____ NUM ____ SETOR ____" com os valores escritos sobre as linhas, igual à imagem.
  4. Rótulos "NOME" (esquerda) e "TELEFONE" (direita, no formato (62) 99999-9999). Uma linha por pessoa visitada, com o texto escrito sobre a linha. Mínimo 2 linhas (como no papel); se houver mais pessoas, adicionar linhas.
  5. Rótulo "OBSERVAÇÕES" e, abaixo, linhas horizontais pautadas com o texto escrito sobre elas. Mínimo de 6 linhas pautadas (mesmo com observação curta, para manter a aparência do papel). O texto NUNCA é cortado: o bloco cresce conforme a observação.
- Paginação: colocar 2 blocos por página quando couberem. Um bloco não deve ser dividido entre páginas, EXCETO se a observação for maior que uma página inteira; nesse caso continuar na página seguinte repetindo a faixa cinza com "(continuação)".
- Preservar quebras de linha digitadas pelo usuário nas observações.
- Rodapé discreto: "Período: DD/MM/AAAA a DD/MM/AAAA - Página X de Y".
- Criar um teste que gera PDFs de amostra: 1 visita curta, 5 visitas, 1 com observação gigante (20.000 caracteres), 1 com 8 pessoas visitadas e 4 diaconisas, e conferir visualmente contra a imagem de referência.

# CÓPIA DE SEGURANÇA (OBRIGATÓRIO, pois os dados ficam só no aparelho)

- Botão grande "Salvar cópia de segurança" que baixa um arquivo .json com todos os dados, e "Restaurar cópia" que importa o arquivo (validar o formato, perguntar antes se substitui ou mescla os dados).
- Lembrete amigável na tela inicial se a última cópia tiver mais de 7 dias ("Faz tempo que você não salva uma cópia de segurança").
- Esta função também serve para passar os dados do celular para o computador.

# ARQUITETURA DE PASTAS SUGERIDA

src/
  app/ (rotas, layout, providers)
  features/
    visitas/ (assistente, lista, rascunho)
    diaconisas/
    pessoas/
    enderecos/
    relatorio/ (seleção de período, geração do PDF)
    backup/
    configuracoes/
  db/ (schema Dexie, repositórios, migrações versionadas)
  lib/ (validators, formatadores de telefone e data, normalização de texto, intervalos de semana)
  hooks/ (useSpeechToText, useSpellcheck, useDraft)
  components/ (Botao grande, Cartao selecionável, CampoTexto, Progresso, Dialogo de confirmação, Aviso)
  pdf/ (gerador do PDF, medição de texto, paginação)
  tests/

Separar regras de negócio e acesso a dados dos componentes visuais (repositórios com interface clara, para no futuro poder trocar o armazenamento local por um servidor sem reescrever a interface).

# COMO TRABALHAR (PASSO A PASSO)

Antes de programar, gere um PLANO com as fases abaixo e o apresente para mim. Depois execute uma fase por vez, rodando build e testes ao final de cada uma, e resuma o que foi feito.

Fase 1 - Projeto base: Vite + React + TS + Tailwind, PWA, tema de acessibilidade (fontes grandes, componentes de botão/cartão/campo), roteamento e tela inicial.
Fase 2 - Banco de dados: schema Dexie, repositórios, migrações, storage.persist, testes das regras (duplicados, snapshot, arquivar).
Fase 3 - Cadastros: Diaconisas, Pessoas Visitadas e Endereços compartilhados, com validações e máscaras.
Fase 4 - Assistente de Nova Visita (passos 1 a 6) com rascunho automático e regras de confirmação/atualização de endereço.
Fase 5 - Microfone e corretor ortográfico.
Fase 6 - Lista de Visitas (filtrar, editar, apagar).
Fase 7 - Relatório em PDF (seletor de período, geração, paginação, compartilhar) e comparação com a imagem de referência.
Fase 8 - Cópia de segurança, configurações (tamanho da fonte, DDD, primeiro dia da semana).
Fase 9 - Revisão de acessibilidade (teste com fonte grande, contraste, navegação por teclado, leitores de tela básicos), testes em tela de celular (360px) e desktop, testes offline.
Fase 10 - Publicação: gerar build estático e documentar (em português, para leigos) como publicar em hospedagem estática gratuita (GitHub Pages, Netlify ou Cloudflare Pages) e como instalar na tela inicial do celular. Os dados continuam apenas no aparelho; a hospedagem serve só para entregar os arquivos do app.

# CRITÉRIOS DE ACEITE (checklist final)

- Uma senhora consegue registrar uma visita completa em menos de 2 minutos, sem ajuda, usando só toques.
- Duas ou mais pessoas no mesmo endereço funcionam, e o endereço é preenchido uma única vez.
- Se a visita foi em outro endereço, o app pede o novo e pergunta se atualiza o cadastro.
- Observação de 20.000 caracteres é salva e aparece completa no PDF.
- O PDF de uma semana tem o mesmo formato da imagem: faixa cinza, NOME/DATA, ATUALIZAÇÃO CADASTRAL, ENDEREÇO com QD/LT/NUM/SETOR, NOME/TELEFONE, OBSERVAÇÕES pautadas.
- O app funciona sem internet após instalado (exceto o reconhecimento de voz, que depende do navegador).
- Os dados sobrevivem a fechar e reabrir o app, e podem ser restaurados por cópia de segurança.
- Nenhum dado é enviado a servidores por mim programados.
- Sem erros no console, build limpo, testes passando.

# SE ALGO ESTIVER AMBÍGUO

Faça a escolha mais simples para uma usuária idosa, registre a decisão no README (seção "Decisões") e siga em frente. Só me pergunte se for algo que bloqueie o trabalho.