import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Autenticação
 * 
 * Testa o fluxo completo de autenticação com Clerk:
 * - Login com email/senha
 * - Redirecionamento após login
 * - Logout
 * - Proteção de rotas
 */

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página inicial
    await page.goto('/');
  });

  test('deve fazer login com sucesso', async ({ page }) => {
    // Aguardar o carregamento da página
    await page.waitForLoadState('networkidle');
    
    // Verificar se está na página de login
    await expect(page).toHaveURL(/.*sign-in/);
    
    // Preencher email
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    
    // Preencher senha
    await page.fill('input[name="password"]', 'Demo123!');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Verificar se foi redirecionado para o dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verificar se o usuário está logado
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Aguardar o carregamento da página
    await page.waitForLoadState('networkidle');
    
    // Preencher email inválido
    await page.fill('input[name="emailAddress"]', 'invalid@email.com');
    
    // Preencher senha inválida
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    
    // Aguardar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Verificar se ainda está na página de login
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('deve fazer logout com sucesso', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento para dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Clicar no menu do usuário
    await page.click('[data-testid="user-menu"]');
    
    // Clicar em logout
    await page.click('[data-testid="logout-button"]');
    
    // Aguardar redirecionamento para login
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
    
    // Verificar se foi redirecionado para login
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('deve proteger rotas autenticadas', async ({ page }) => {
    // Tentar acessar dashboard sem estar logado
    await page.goto('/dashboard');
    
    // Aguardar redirecionamento para login
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
    
    // Verificar se foi redirecionado
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('deve manter sessão após refresh', async ({ page }) => {
    // Fazer login
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Fazer refresh da página
    await page.reload();
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se ainda está logado
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
