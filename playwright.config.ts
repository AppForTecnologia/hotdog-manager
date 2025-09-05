import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * 
 * Configuração para testes end-to-end do sistema HotDog Manager
 * Inclui testes para fluxos principais: login, vínculo de CNPJ, alternância de tenant, bloqueio por expiração
 */

export default defineConfig({
  // Diretório base para os testes
  testDir: './tests/e2e',
  
  // Executar testes em paralelo
  fullyParallel: true,
  
  // Falhar o build no CI se você deixar test.only no código
  forbidOnly: !!process.env.CI,
  
  // Re-executar testes em desenvolvimento apenas em arquivos modificados
  retries: process.env.CI ? 2 : 0,
  
  // Número de workers para execução paralela
  workers: process.env.CI ? 1 : undefined,
  
  // Configuração de reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // Configurações globais compartilhadas
  use: {
    // URL base para os testes
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    
    // Coletar trace quando retry
    trace: 'on-first-retry',
    
    // Screenshots em caso de falha
    screenshot: 'only-on-failure',
    
    // Vídeo em caso de falha
    video: 'retain-on-failure',
    
    // Timeout para ações
    actionTimeout: 10000,
    
    // Timeout para navegação
    navigationTimeout: 30000,
  },

  // Configuração de projetos (diferentes navegadores)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Testes em dispositivos móveis
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Servidor de desenvolvimento para testes
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos
  },

  // Configurações de expectativas
  expect: {
    // Timeout para expectativas
    timeout: 10000,
  },

  // Configurações de output
  outputDir: 'test-results/',
  
  // Configurações de timeout
  timeout: 30 * 1000, // 30 segundos por teste
  globalTimeout: 60 * 1000, // 1 minuto total
  
  // Configurações de retry
  retries: 2,
  
  // Configurações de workers
  workers: process.env.CI ? 1 : 4,
});
