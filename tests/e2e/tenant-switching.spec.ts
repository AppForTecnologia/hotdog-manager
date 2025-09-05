import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Alternância de Tenant
 * 
 * Testa o fluxo completo de alternância entre tenants:
 * - Exibição do tenant switcher
 * - Listagem de tenants disponíveis
 * - Troca de tenant
 * - Atualização da interface
 */

test.describe('Alternância de Tenant', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login e vincular ao tenant
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Vincular ao tenant ativo
    await page.fill('input[name="cnpj"]', '11.222.333/0001-44');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('deve exibir tenant switcher na navbar', async ({ page }) => {
    // Verificar se o tenant switcher está visível
    await expect(page.locator('[data-testid="tenant-switcher"]')).toBeVisible();
    
    // Verificar se mostra o tenant atual
    await expect(page.locator('[data-testid="current-tenant"]')).toContainText('Lanchonete do João Ltda');
  });

  test('deve abrir dropdown com lista de tenants', async ({ page }) => {
    // Clicar no tenant switcher
    await page.click('[data-testid="tenant-switcher"]');
    
    // Verificar se o dropdown está visível
    await expect(page.locator('[data-testid="tenant-dropdown"]')).toBeVisible();
    
    // Verificar se lista os tenants disponíveis
    await expect(page.locator('[data-testid="tenant-item"]')).toHaveCount(2);
    
    // Verificar se mostra informações dos tenants
    await expect(page.locator('[data-testid="tenant-item"]').first()).toContainText('Lanchonete do João Ltda');
    await expect(page.locator('[data-testid="tenant-item"]').nth(1)).toContainText('Hot Dog Express Ltda');
  });

  test('deve trocar para outro tenant', async ({ page }) => {
    // Abrir dropdown
    await page.click('[data-testid="tenant-switcher"]');
    
    // Clicar no segundo tenant (expirado)
    await page.click('[data-testid="tenant-item"]:nth-child(2)');
    
    // Aguardar troca
    await page.waitForTimeout(2000);
    
    // Verificar se o tenant atual foi atualizado
    await expect(page.locator('[data-testid="current-tenant"]')).toContainText('Hot Dog Express Ltda');
    
    // Verificar se a URL foi atualizada
    await expect(page).toHaveURL(/.*tenant=.*/);
  });

  test('deve mostrar status do tenant no dropdown', async ({ page }) => {
    // Abrir dropdown
    await page.click('[data-testid="tenant-switcher"]');
    
    // Verificar status do primeiro tenant (ativo)
    await expect(page.locator('[data-testid="tenant-status"]').first()).toContainText('Ativo');
    
    // Verificar status do segundo tenant (expirado)
    await expect(page.locator('[data-testid="tenant-status"]').nth(1)).toContainText('Expirado');
  });

  test('deve fechar dropdown ao clicar fora', async ({ page }) => {
    // Abrir dropdown
    await page.click('[data-testid="tenant-switcher"]');
    
    // Verificar se está aberto
    await expect(page.locator('[data-testid="tenant-dropdown"]')).toBeVisible();
    
    // Clicar fora do dropdown
    await page.click('body');
    
    // Verificar se foi fechado
    await expect(page.locator('[data-testid="tenant-dropdown"]')).not.toBeVisible();
  });

  test('deve manter estado após refresh', async ({ page }) => {
    // Trocar para outro tenant
    await page.click('[data-testid="tenant-switcher"]');
    await page.click('[data-testid="tenant-item"]:nth-child(2)');
    await page.waitForTimeout(2000);
    
    // Fazer refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar se o tenant foi mantido
    await expect(page.locator('[data-testid="current-tenant"]')).toContainText('Hot Dog Express Ltda');
  });

  test('deve mostrar loading durante troca', async ({ page }) => {
    // Abrir dropdown
    await page.click('[data-testid="tenant-switcher"]');
    
    // Clicar em outro tenant
    await page.click('[data-testid="tenant-item"]:nth-child(2)');
    
    // Verificar se o loading está visível
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Verificar se o switcher está desabilitado
    await expect(page.locator('[data-testid="tenant-switcher"]')).toBeDisabled();
  });
});
