import { test, expect } from '@playwright/test';

/**
 * Testes E2E de Ações Root Admin
 * 
 * Testa o fluxo completo de funcionalidades administrativas:
 * - Acesso ao painel root
 * - Gerenciamento de tenants
 * - Monitoramento de cron
 * - Migração de dados
 * - Provisionamento físico
 */

test.describe('Ações Root Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login como root admin
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="emailAddress"]', 'pedrinhocornetti@gmail.com');
    await page.fill('input[name="password"]', 'Master123!');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
  });

  test('deve acessar painel root', async ({ page }) => {
    // Navegar para painel root
    await page.goto('/root');
    
    // Verificar se foi redirecionado para dashboard root
    await expect(page).toHaveURL(/.*root/);
    
    // Verificar elementos do painel root
    await expect(page.locator('[data-testid="root-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="root-sidebar"]')).toBeVisible();
  });

  test('deve exibir navegação do painel root', async ({ page }) => {
    // Navegar para painel root
    await page.goto('/root');
    
    // Verificar itens de navegação
    await expect(page.locator('[data-testid="nav-item"]')).toHaveCount(6);
    
    // Verificar itens específicos
    await expect(page.locator('[data-testid="nav-item"]').first()).toContainText('Dashboard');
    await expect(page.locator('[data-testid="nav-item"]').nth(1)).toContainText('Tenants');
    await expect(page.locator('[data-testid="nav-item"]').nth(2)).toContainText('Relatórios');
    await expect(page.locator('[data-testid="nav-item"]').nth(3)).toContainText('Monitor de Cron');
    await expect(page.locator('[data-testid="nav-item"]').nth(4)).toContainText('Migração de Dados');
    await expect(page.locator('[data-testid="nav-item"]').nth(5)).toContainText('Provisionamento Físico');
  });

  test('deve gerenciar tenants', async ({ page }) => {
    // Navegar para página de tenants
    await page.goto('/root/tenants');
    
    // Verificar se a página carregou
    await expect(page.locator('[data-testid="tenants-page"]')).toBeVisible();
    
    // Verificar lista de tenants
    await expect(page.locator('[data-testid="tenant-card"]')).toHaveCount(2);
    
    // Verificar informações dos tenants
    await expect(page.locator('[data-testid="tenant-card"]').first()).toContainText('Lanchonete do João Ltda');
    await expect(page.locator('[data-testid="tenant-card"]').nth(1)).toContainText('Hot Dog Express Ltda');
  });

  test('deve monitorar cron jobs', async ({ page }) => {
    // Navegar para página de cron
    await page.goto('/root/cron');
    
    // Verificar se a página carregou
    await expect(page.locator('[data-testid="cron-page"]')).toBeVisible();
    
    // Verificar status dos cron jobs
    await expect(page.locator('[data-testid="cron-status"]')).toBeVisible();
    
    // Verificar próximas execuções
    await expect(page.locator('[data-testid="next-execution"]')).toBeVisible();
    
    // Verificar estatísticas
    await expect(page.locator('[data-testid="cron-stats"]')).toBeVisible();
  });

  test('deve executar migração de dados', async ({ page }) => {
    // Navegar para página de migração
    await page.goto('/root/migration');
    
    // Verificar se a página carregou
    await expect(page.locator('[data-testid="migration-page"]')).toBeVisible();
    
    // Verificar análise de dados legados
    await expect(page.locator('[data-testid="legacy-analysis"]')).toBeVisible();
    
    // Verificar estatísticas
    await expect(page.locator('[data-testid="migration-stats"]')).toBeVisible();
    
    // Verificar botões de ação
    await expect(page.locator('[data-testid="migrate-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible();
  });

  test('deve gerenciar provisionamento físico', async ({ page }) => {
    // Navegar para página de provisionamento
    await page.goto('/root/provisioning');
    
    // Verificar se a página carregou
    await expect(page.locator('[data-testid="provisioning-page"]')).toBeVisible();
    
    // Verificar feature flags
    await expect(page.locator('[data-testid="feature-flags"]')).toBeVisible();
    
    // Verificar status de conexão
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    
    // Verificar botão de provisionamento
    await expect(page.locator('[data-testid="provision-button"]')).toBeVisible();
  });

  test('deve bloquear acesso para usuários não-root', async ({ page }) => {
    // Fazer logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
    
    // Fazer login como usuário comum
    await page.fill('input[name="emailAddress"]', 'demo1@hotdogmanager.com');
    await page.fill('input[name="password"]', 'Demo123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
    
    // Tentar acessar painel root
    await page.goto('/root');
    
    // Verificar se foi bloqueado (404 ou redirecionamento)
    await expect(page).toHaveURL(/.*404/);
  });

  test('deve exibir relatórios administrativos', async ({ page }) => {
    // Navegar para página de relatórios
    await page.goto('/root/reports');
    
    // Verificar se a página carregou
    await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
    
    // Verificar métricas gerais
    await expect(page.locator('[data-testid="general-metrics"]')).toBeVisible();
    
    // Verificar gráficos
    await expect(page.locator('[data-testid="charts"]')).toBeVisible();
  });

  test('deve permitir navegação entre páginas root', async ({ page }) => {
    // Navegar para painel root
    await page.goto('/root');
    
    // Clicar em diferentes itens de navegação
    const navItems = [
      { href: '/root/tenants', testId: 'tenants-page' },
      { href: '/root/reports', testId: 'reports-page' },
      { href: '/root/cron', testId: 'cron-page' },
      { href: '/root/migration', testId: 'migration-page' },
      { href: '/root/provisioning', testId: 'provisioning-page' }
    ];
    
    for (const item of navItems) {
      // Clicar no item de navegação
      await page.click(`[href="${item.href}"]`);
      
      // Verificar se a página carregou
      await expect(page.locator(`[data-testid="${item.testId}"]`)).toBeVisible();
      
      // Verificar se a URL foi atualizada
      await expect(page).toHaveURL(item.href);
    }
  });

  test('deve manter sessão root após refresh', async ({ page }) => {
    // Navegar para painel root
    await page.goto('/root');
    
    // Fazer refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verificar se ainda tem acesso
    await expect(page).toHaveURL(/.*root/);
    await expect(page.locator('[data-testid="root-dashboard"]')).toBeVisible();
  });
});
