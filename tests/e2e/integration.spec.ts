import { test, expect } from '@playwright/test';

/**
 * Teste de Integração Completo
 * 
 * Testa o fluxo completo do sistema SaaS:
 * 1. Login Clerk
 * 2. Modal de vínculo ao CNPJ
 * 3. Alternância de tenant
 * 4. Bloqueio por expiração
 * 5. Ações root admin
 */

test.describe('Integração Completa - Fluxo SaaS', () => {
  test('fluxo completo do sistema SaaS', async ({ page }) => {
    // ========================================
    // 1. LOGIN CLERK
    // ========================================
    
    // Navegar para a página inicial
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verificar se está na página de login
    await expect(page).toHaveURL(/.*sign-in/);
    
    // Fazer login
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Verificar se foi redirecionado para dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // ========================================
    // 2. MODAL DE VÍNCULO AO CNPJ
    // ========================================
    
    // Verificar se o modal de vínculo está visível
    await expect(page.locator('[data-testid="tenant-link-modal"]')).toBeVisible();
    
    // Preencher CNPJ válido
    await page.fill('input[name="cnpj"]', '11.222.333/0001-44');
    
    // Submeter formulário
    await page.click('button[type="submit"]');
    
    // Aguardar processamento
    await page.waitForTimeout(2000);
    
    // Verificar se o modal foi fechado
    await expect(page.locator('[data-testid="tenant-link-modal"]')).not.toBeVisible();
    
    // ========================================
    // 3. ALTERNÂNCIA DE TENANT
    // ========================================
    
    // Verificar se o tenant switcher está visível
    await expect(page.locator('[data-testid="tenant-switcher"]')).toBeVisible();
    
    // Verificar se mostra o tenant atual
    await expect(page.locator('[data-testid="current-tenant"]')).toContainText('Lanchonete do João Ltda');
    
    // Clicar no tenant switcher
    await page.click('[data-testid="tenant-switcher"]');
    
    // Verificar se o dropdown está visível
    await expect(page.locator('[data-testid="tenant-dropdown"]')).toBeVisible();
    
    // Verificar se lista os tenants disponíveis
    await expect(page.locator('[data-testid="tenant-item"]')).toHaveCount(2);
    
    // Clicar no segundo tenant (expirado)
    await page.click('[data-testid="tenant-item"]:nth-child(2)');
    
    // Aguardar troca
    await page.waitForTimeout(2000);
    
    // Verificar se o tenant atual foi atualizado
    await expect(page.locator('[data-testid="current-tenant"]')).toContainText('Hot Dog Express Ltda');
    
    // ========================================
    // 4. BLOQUEIO POR EXPIRAÇÃO
    // ========================================
    
    // Tentar acessar dashboard
    await page.goto('/dashboard');
    
    // Aguardar redirecionamento para página de expiração
    await page.waitForURL(/.*plano-expirado/, { timeout: 10000 });
    
    // Verificar se foi redirecionado
    await expect(page).toHaveURL(/.*plano-expirado/);
    
    // Verificar elementos da página de expiração
    await expect(page.locator('[data-testid="expired-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="expired-title"]')).toContainText('Plano Expirado');
    
    // Verificar informações do tenant
    await expect(page.locator('[data-testid="tenant-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-info"]')).toContainText('Hot Dog Express Ltda');
    
    // Verificar opções de renovação
    await expect(page.locator('[data-testid="contact-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="renew-button"]')).toBeVisible();
    
    // ========================================
    // 5. AÇÕES ROOT ADMIN
    // ========================================
    
    // Fazer logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
    
    // Fazer login como root admin
    await page.fill('input[name="emailAddress"]', 'pedrinhocornetti@gmail.com');
    await page.fill('input[name="password"]', 'Master123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Navegar para painel root
    await page.goto('/root');
    
    // Verificar se foi redirecionado para dashboard root
    await expect(page).toHaveURL(/.*root/);
    
    // Verificar elementos do painel root
    await expect(page.locator('[data-testid="root-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="root-sidebar"]')).toBeVisible();
    
    // Verificar itens de navegação
    await expect(page.locator('[data-testid="nav-item"]')).toHaveCount(6);
    
    // ========================================
    // 6. TESTE DE FUNCIONALIDADES ROOT
    // ========================================
    
    // Testar página de tenants
    await page.goto('/root/tenants');
    await expect(page.locator('[data-testid="tenants-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="tenant-card"]')).toHaveCount(2);
    
    // Testar página de cron
    await page.goto('/root/cron');
    await expect(page.locator('[data-testid="cron-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="cron-status"]')).toBeVisible();
    
    // Testar página de migração
    await page.goto('/root/migration');
    await expect(page.locator('[data-testid="migration-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="legacy-analysis"]')).toBeVisible();
    
    // Testar página de provisionamento
    await page.goto('/root/provisioning');
    await expect(page.locator('[data-testid="provisioning-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="feature-flags"]')).toBeVisible();
    
    // ========================================
    // 7. VOLTA AO TENANT ATIVO
    // ========================================
    
    // Trocar para tenant ativo
    await page.click('[data-testid="tenant-switcher"]');
    await page.click('[data-testid="tenant-item"]:first-child');
    await page.waitForTimeout(2000);
    
    // Verificar se foi redirecionado para dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verificar se não há mais bloqueio
    await expect(page.locator('[data-testid="expiration-banner"]')).not.toBeVisible();
    
    // Verificar se o tenant atual foi atualizado
    await expect(page.locator('[data-testid="current-tenant"]')).toContainText('Lanchonete do João Ltda');
    
    // ========================================
    // 8. TESTE DE FUNCIONALIDADES NORMAIS
    // ========================================
    
    // Testar acesso a diferentes páginas
    const pages = ['/products', '/sales', '/customers', '/reports'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Verificar se não foi redirecionado para expiração
      await expect(page).not.toHaveURL(/.*plano-expirado/);
      
      // Verificar se a página carregou
      await expect(page.locator('body')).toBeVisible();
    }
    
    // ========================================
    // 9. LOGOUT FINAL
    // ========================================
    
    // Fazer logout final
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Aguardar redirecionamento para login
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
    
    // Verificar se foi redirecionado
    await expect(page).toHaveURL(/.*sign-in/);
  });

  test('fluxo de usuário não-root tentando acessar root', async ({ page }) => {
    // Fazer login como usuário comum
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Vincular ao tenant
    await page.fill('input[name="cnpj"]', '11.222.333/0001-44');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Tentar acessar painel root
    await page.goto('/root');
    
    // Verificar se foi bloqueado
    await expect(page).toHaveURL(/.*404/);
  });

  test('fluxo de tenant expirado com usuário root', async ({ page }) => {
    // Fazer login como root admin
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'pedrinhocornetti@gmail.com');
    await page.fill('input[name="password"]', 'Master123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Vincular ao tenant expirado
    await page.fill('input[name="cnpj"]', '99.888.777/0001-66');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verificar se foi redirecionado para expiração
    await page.waitForURL(/.*plano-expirado/, { timeout: 10000 });
    
    // Verificar se a página de expiração carregou
    await expect(page.locator('[data-testid="expired-title"]')).toBeVisible();
    
    // Verificar se ainda pode acessar painel root
    await page.goto('/root');
    await expect(page).toHaveURL(/.*root/);
    await expect(page.locator('[data-testid="root-dashboard"]')).toBeVisible();
  });
});
