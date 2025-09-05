import { test as base } from '@playwright/test';

/**
 * Configuração de testes E2E
 * 
 * Configurações compartilhadas e helpers para todos os testes
 */

// Extensão do teste base com configurações customizadas
export const test = base.extend({
  // Configurações de página customizadas
  page: async ({ page }, use) => {
    // Configurar timeouts
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(30000);
    
    // Configurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Configurar interceptação de requests
    await page.route('**/*', (route) => {
      // Log de requests para debugging
      console.log(`Request: ${route.request().method()} ${route.request().url()}`);
      route.continue();
    });
    
    await use(page);
  },
});

// Configurações globais de teste
export const expect = test.expect;

// Helpers para testes
export class TestHelpers {
  /**
   * Aguarda o carregamento completo da página
   */
  static async waitForPageLoad(page: any) {
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { state: 'visible' });
  }

  /**
   * Faz login com credenciais específicas
   */
  static async login(page: any, email: string, password: string) {
    await page.goto('/');
    await this.waitForPageLoad(page);
    
    await page.fill('input[name="emailAddress"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });
  }

  /**
   * Vincula ao tenant especificado
   */
  static async linkToTenant(page: any, cnpj: string) {
    await page.fill('input[name="cnpj"]', cnpj);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }

  /**
   * Troca para outro tenant
   */
  static async switchTenant(page: any, tenantIndex: number = 1) {
    await page.click('[data-testid="tenant-switcher"]');
    await page.click(`[data-testid="tenant-item"]:nth-child(${tenantIndex + 1})`);
    await page.waitForTimeout(2000);
  }

  /**
   * Aguarda elemento estar visível
   */
  static async waitForElement(page: any, selector: string, timeout: number = 10000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Aguarda elemento não estar visível
   */
  static async waitForElementHidden(page: any, selector: string, timeout: number = 10000) {
    await page.waitForSelector(selector, { state: 'hidden', timeout });
  }

  /**
   * Faz logout
   */
  static async logout(page: any) {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(/.*sign-in/, { timeout: 10000 });
  }

  /**
   * Navega para uma página específica
   */
  static async navigateTo(page: any, path: string) {
    await page.goto(path);
    await this.waitForPageLoad(page);
  }

  /**
   * Verifica se está na página correta
   */
  static async verifyPage(page: any, expectedPath: string) {
    await expect(page).toHaveURL(new RegExp(expectedPath));
  }

  /**
   * Aguarda redirecionamento
   */
  static async waitForRedirect(page: any, expectedUrl: string, timeout: number = 10000) {
    await page.waitForURL(new RegExp(expectedUrl), { timeout });
  }

  /**
   * Limpa dados de teste
   */
  static async cleanup(page: any) {
    // Fazer logout se estiver logado
    try {
      await this.logout(page);
    } catch (error) {
      // Ignorar erro se já estiver deslogado
    }
    
    // Limpar localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

// Configurações de dados de teste
export const TestData = {
  users: {
    admin: {
      email: 'demo1@hotdogmanager.com',
      password: 'Demo123!',
      name: 'João Silva - Demo'
    },
    employee: {
      email: 'demo2@hotdogmanager.com',
      password: 'Demo123!',
      name: 'Maria Santos - Demo'
    },
    root: {
      email: 'pedrinhocornetti@gmail.com',
      password: 'Master123!',
      name: 'Pedro Cornetti - Master'
    }
  },
  tenants: {
    active: {
      cnpj: '11.222.333/0001-44',
      name: 'Lanchonete do João Ltda',
      status: 'active'
    },
    expired: {
      cnpj: '99.888.777/0001-66',
      name: 'Hot Dog Express Ltda',
      status: 'expired'
    }
  },
  pages: {
    dashboard: '/dashboard',
    products: '/products',
    sales: '/sales',
    customers: '/customers',
    reports: '/reports',
    root: '/root',
    rootTenants: '/root/tenants',
    rootCron: '/root/cron',
    rootMigration: '/root/migration',
    rootProvisioning: '/root/provisioning',
    expiredPlan: '/plano-expirado'
  }
};

// Configurações de timeout
export const Timeouts = {
  short: 5000,
  medium: 10000,
  long: 30000,
  veryLong: 60000
};

// Configurações de viewport
export const Viewports = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
};
