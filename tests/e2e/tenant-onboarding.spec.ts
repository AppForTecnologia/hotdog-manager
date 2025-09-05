import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Onboarding de Tenant
 * 
 * Testa o fluxo completo de onboarding:
 * - Modal de vínculo ao CNPJ
 * - Seleção de tenant
 * - Validação de dados
 * - Redirecionamento após vínculo
 */

test.describe('Onboarding de Tenant', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
  });

  test('deve exibir modal de vínculo ao CNPJ', async ({ page }) => {
    // Verificar se o modal de vínculo está visível
    await expect(page.locator('[data-testid="tenant-link-modal"]')).toBeVisible();
    
    // Verificar título do modal
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Vincular ao CNPJ');
    
    // Verificar campos obrigatórios
    await expect(page.locator('input[name="cnpj"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve validar CNPJ inválido', async ({ page }) => {
    // Preencher CNPJ inválido
    await page.fill('input[name="cnpj"]', '123456789');
    
    // Tentar submeter
    await page.click('button[type="submit"]');
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="cnpj-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="cnpj-error"]')).toContainText('CNPJ inválido');
  });

  test('deve vincular ao CNPJ com sucesso', async ({ page }) => {
    // Preencher CNPJ válido
    await page.fill('input[name="cnpj"]', '11.222.333/0001-44');
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Aguardar processamento
    await page.waitForTimeout(2000);
    
    // Verificar se o modal foi fechado
    await expect(page.locator('[data-testid="tenant-link-modal"]')).not.toBeVisible();
    
    // Verificar se foi redirecionado para dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verificar se o tenant switcher está visível
    await expect(page.locator('[data-testid="tenant-switcher"]')).toBeVisible();
  });

  test('deve mostrar erro para CNPJ não encontrado', async ({ page }) => {
    // Preencher CNPJ que não existe
    await page.fill('input[name="cnpj"]', '99.999.999/0001-99');
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Aguardar processamento
    await page.waitForTimeout(2000);
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('CNPJ não encontrado');
  });

  test('deve permitir fechar modal sem vincular', async ({ page }) => {
    // Clicar no botão de fechar
    await page.click('[data-testid="close-modal"]');
    
    // Verificar se o modal foi fechado
    await expect(page.locator('[data-testid="tenant-link-modal"]')).not.toBeVisible();
    
    // Verificar se ainda está na página
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('deve mostrar loading durante processamento', async ({ page }) => {
    // Preencher CNPJ válido
    await page.fill('input[name="cnpj"]', '11.222.333/0001-44');
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Verificar se o loading está visível
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verificar se o botão está desabilitado
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });
});
