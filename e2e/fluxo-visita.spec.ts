import { expect, test } from '@playwright/test'

test.describe('Fase 4 - Fluxo completo no navegador e validação de rascunho', () => {
  test('Barra fixa Voltar/Continuar em tela de 360px com teclado aberto (campo visível)', async ({ page }) => {
    // Simula celular com 360px de largura e teclado virtual aberto (altura reduzida para 360px)
    await page.setViewportSize({ width: 360, height: 360 })
    await page.goto('/')

    // Vai para Nova Visita
    await page.click('text=Nova Visita')
    await page.waitForURL(/.*#\/nova-visita\/1/)

    // Verifica que o seletor de data e a barra fixa estão presentes e acessíveis
    const campoData = page.locator('#campo-data-visita')
    await expect(campoData).toBeVisible()

    // Foca o campo
    await campoData.focus()

    // O campo deve estar visível dentro do viewport mesmo com a barra fixa inferior
    await expect(campoData).toBeInViewport()

    // A barra inferior com "Continuar" também está visível e clicável
    const botaoContinuar = page.locator('button:has-text("Continuar")')
    await expect(botaoContinuar).toBeVisible()
    await expect(botaoContinuar).toBeInViewport()
  })

  test('Fluxo completo de nova visita com recarga no meio para validar rascunho', async ({ page }) => {
    // Configura tamanho de celular padrão (360x640)
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/')

    // 1. Toca em "Nova Visita"
    await page.click('text=Nova Visita')
    await page.waitForURL(/.*#\/nova-visita\/1/)
    await expect(page.locator('h1')).toContainText('Nova Visita')
    await expect(page.locator('text=Passo 1 de 6')).toBeVisible()

    // Passo 1: Avança para o passo 2
    await page.click('button:has-text("Continuar")')
    await page.waitForURL(/.*#\/nova-visita\/2/)
    await expect(page.locator('text=Passo 2 de 6')).toBeVisible()

    // Passo 2: Adiciona nova diaconisa rápida
    await page.click('button:has-text("+ Adicionar nova diaconisa")')
    await page.getByLabel('Nome da diaconisa').fill('Irmã Eunice Santos')
    await page.click('button:has-text("Adicionar e marcar nesta visita")')

    // Confere que Irmã Eunice foi marcada
    await expect(page.locator('text=1 diaconisa selecionada')).toBeVisible()
    await expect(page.locator('text=Irmã Eunice Santos')).toBeVisible()

    // Avança para o passo 3
    await page.click('button:has-text("Continuar")')
    await page.waitForURL(/.*#\/nova-visita\/3/)
    await expect(page.locator('text=Passo 3 de 6')).toBeVisible()

    // Passo 3: Adiciona nova pessoa rápida
    await page.click('button:has-text("+ Adicionar nova pessoa")')
    await page.getByLabel('Nome da pessoa').fill('Dona Francisca Lima')

    // Preenche endereço da pessoa (opção novo endereço)
    await page.getByLabel('Rua / Avenida').fill('Rua das Rosas')
    await page.getByLabel('Quadra (QD)').fill('12')
    await page.getByLabel('Lote (LT)').fill('3')
    await page.getByLabel('Número').fill('45')
    await page.getByLabel('Setor / Bairro').fill('Setor Primavera')

    await page.click('button:has-text("Salvar pessoa e marcar nesta visita")')

    // Confere que Dona Francisca foi marcada
    await expect(page.locator('text=1 pessoa selecionada')).toBeVisible()
    await expect(page.locator('text=Dona Francisca Lima')).toBeVisible()

    // Avança para o passo 4
    await page.click('button:has-text("Continuar")')
    await page.waitForURL(/.*#\/nova-visita\/4/)
    await expect(page.locator('text=Passo 4 de 6')).toBeVisible()

    // Passo 4: Confirma que a visita foi neste endereço
    await expect(page.locator('text=Rua das Rosas')).toBeVisible()
    await page.click('button:has-text("Sim, foi neste endereço")')

    // Avança para o passo 5
    await page.click('button:has-text("Continuar")')
    await page.waitForURL(/.*#\/nova-visita\/5/)
    await expect(page.locator('text=Passo 5 de 6')).toBeVisible()

    // Passo 5: Digita as observações
    const textarea = page.locator('#campo-observacoes')
    await textarea.fill('Visita muito abençoada. Pedido de oração pela saúde dos netos.')

    // Espera ~600ms para salvar rascunho no IndexedDB
    await page.waitForTimeout(700)

    // ==========================================
    // TESTE DE RECARGA: Recarrega a página no meio
    // ==========================================
    await page.reload()

    // Ao recarregar a rota #/nova-visita/5:
    // O texto da observação foi restaurado do rascunho!
    await expect(page.locator('#campo-observacoes')).toHaveValue(
      'Visita muito abençoada. Pedido de oração pela saúde dos netos.',
    )

    // Testa navegação para #/nova-visita na raiz para conferir o diálogo de rascunho
    await page.goto('/#/nova-visita')
    await expect(page.locator('text=Você parou uma visita no meio')).toBeVisible()
    await page.click('button:has-text("Continuar de onde parei")')

    // Volta para o assistente
    await expect(page.locator('#campo-observacoes')).toBeVisible()

    // Avança para o Passo 6 (Prévia)
    await page.click('button:has-text("Continuar")')
    await page.waitForURL(/.*#\/nova-visita\/6/)
    await expect(page.locator('text=Passo 6 de 6')).toBeVisible()

    // Confere os dados na prévia oficial
    await expect(page.locator('text=Irmã Eunice Santos')).toBeVisible()
    await expect(page.locator('text=Dona Francisca Lima')).toBeVisible()
    await expect(page.locator('text=Rua das Rosas')).toBeVisible()
    await expect(page.locator('text=Pedido de oração pela saúde dos netos.')).toBeVisible()

    // Salva a visita
    await page.click('button:has-text("Salvar visita")')

    // Confere a tela de sucesso
    await expect(page.locator('text=Visita registrada com sucesso!')).toBeVisible()

    // Toca em "Ir para o início"
    await page.click('button:has-text("Ir para o início")')
    await page.waitForURL(/.*#\//)

    // Confere que ao clicar em "Nova Visita" agora, NÃO há mais rascunho pendente (vai direto para passo 1)
    await page.click('text=Nova Visita')
    await expect(page.locator('text=Passo 1 de 6')).toBeVisible()
    expect(page.url()).toContain('#/nova-visita/1')
  })
})
