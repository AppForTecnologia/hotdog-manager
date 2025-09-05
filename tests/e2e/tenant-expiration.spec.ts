import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Bloqueio por Expiração
 * 
 * Testa o fluxo completo de bloqueio por expiração:
 * - Acesso a tenant expirado
 * - Exibição de página de aviso
 * - Bloqueio de funcionalidades
 * - Redirecionamento para renovação
 */

test.describe('Bloqueio por Expiração', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login e vincular ao tenant expirado
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Vincular ao tenant expirado
    await page.fill('input[name="cnpj"]', '99.888.777/0001-66');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('deve bloquear acesso a tenant expirado', async ({ page }) => {
    // Tentar acessar dashboard
    await page.goto('/dashboard');
    
    // Aguardar redirecionamento para página de expiração
    await page.waitForURL(/.*plano-expirado/, { timeout: 10000 });
    
    // Verificar se foi redirecionado
    await expect(page).toHaveURL(/.*plano-expirado/);
  });

  test('deve exibir página de plano expirado', async ({ page }) => {
    // Navegar para página de expiração
    await page.goto('/plano-expirado');
    
    // Verificar elementos da página
    await expect(page.locator('[data-testid="expired-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="expired-title"]')).toContainText('Plano Expirado');
    
    // Verificar informações do tenant
    await expect(page.locator('[data-testid="tenant-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-info"]')).toContainText('Hot Dog Express Ltda');
    
    // Verificar data de expiração
    await expect(page.locator('[data-testid="expiration-date"]')).toBeVisible();
  });

  test('deve mostrar opções de renovação', async ({ page }) => {
    // Navegar para página de expiração
    await page.goto('/plano-expirado');
    
    // Verificar botão de contato
    await expect(page.locator('[data-testid="contact-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-button"]')).toContainText('Entrar em Contato');
    
    // Verificar botão de renovação
    await expect(page.locator('[data-testid="renew-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="renew-button"]')).toContainText('Renovar Plano');
  });

  test('deve bloquear funcionalidades do sistema', async ({ page }) => {
    // Tentar acessar diferentes páginas
    const protectedPages = ['/products', '/sales', '/customers', '/reports'];
    
    for (const pagePath of protectedPages) {
      await page.goto(pagePath);
      
      // Aguardar redirecionamento
      await page.waitForURL(/.*plano-expirado/, { timeout: 5000 });
      
      // Verificar se foi redirecionado
      await expect(page).toHaveURL(/.*plano-expirado/);
    }
  });

  test('deve permitir acesso ao painel root', async ({ page }) => {
    // Tentar acessar painel root
    await page.goto('/root');
    
    // Verificar se não foi redirecionado (usuário é root admin)
    await expect(page).toHaveURL(/.*root/);
    
    // Verificar se o painel root está visível
    await expect(page.locator('[data-testid="root-dashboard"]')).toBeVisible();
  });

  test('deve mostrar banner de aviso em tenant expirado', async ({ page }) => {
    // Tentar acessar dashboard
    await page.goto('/dashboard');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*plano-expirado/, { timeout: 10000 });
    
    // Verificar banner de aviso
    await expect(page.locator('[data-testid="expiration-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="expiration-banner"]')).toContainText('Plano Expirado');
  });

  test('deve permitir logout mesmo com tenant expirado', async ({ page }) => {
    // Navegar para página de expiração
    await page.goto('/plano-expirado');
    
    // Clicar no menu do usuário
    await page.click('[data-testid="user-menu"]');
    
    // Clicar em logout
    await page.click('[data-testid="logout-button"]');
    
    // Aguardar redirecionamento para login
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
    
    // Verificar se foi redirecionado
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('deve mostrar informações de contato', async ({ page }) => {
    // Navegar para página de expiração
    await page.goto('/plano-expirado');
    
    // Verificar informações de contato
    await expect(page.locator('[data-testid="contact-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-info"]')).toContainText('contato@hotdogexpress.com');
    
    // Verificar telefone
    await expect(page.locator('[data-testid="phone-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-info"]')).toContainText('(11) 91234-5678');
  });

  test('deve permitir trocar para tenant ativo', async ({ page }) => {
    // Navegar para página de expiração
    await page.goto('/plano-expirado');
    
    // Clicar no tenant switcher
    await page.click('[data-testid="tenant-switcher"]');
    
    // Selecionar tenant ativo
    await page.click('[data-testid="tenant-item"]:first-child');
    
    // Aguardar troca
    await page.waitForTimeout(2000);
    
    // Verificar se foi redirecionado para dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verificar se não há mais bloqueio
    await expect(page.locator('[data-testid="expiration-banner"]')).not.toBeVisible();
  });
});
