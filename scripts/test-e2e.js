#!/usr/bin/env node

/**
 * Script para executar testes E2E
 * 
 * Este script executa os testes E2E do sistema HotDog Manager
 * e verifica se todos os fluxos principais estão funcionando.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando execução dos testes E2E...\n');

// Verificar se o Playwright está instalado
try {
  execSync('npx playwright --version', { stdio: 'pipe' });
  console.log('✅ Playwright está instalado');
} catch (error) {
  console.error('❌ Playwright não está instalado. Execute: npm run test:install');
  process.exit(1);
}

// Verificar se o servidor de desenvolvimento está rodando
try {
  execSync('curl -s http://localhost:5173 > /dev/null', { stdio: 'pipe' });
  console.log('✅ Servidor de desenvolvimento está rodando');
} catch (error) {
  console.log('⚠️ Servidor de desenvolvimento não está rodando');
  console.log('💡 Execute: npm run dev');
  console.log('💡 Ou os testes serão executados com servidor automático\n');
}

// Verificar se os arquivos de teste existem
const testFiles = [
  'tests/e2e/auth.spec.ts',
  'tests/e2e/tenant-onboarding.spec.ts',
  'tests/e2e/tenant-switching.spec.ts',
  'tests/e2e/tenant-expiration.spec.ts',
  'tests/e2e/root-admin.spec.ts',
  'tests/e2e/integration.spec.ts'
];

console.log('📁 Verificando arquivos de teste...');
for (const file of testFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} não encontrado`);
  }
}

// Verificar configuração do Playwright
if (fs.existsSync('playwright.config.ts')) {
  console.log('✅ playwright.config.ts encontrado');
} else {
  console.log('❌ playwright.config.ts não encontrado');
}

console.log('\n🚀 Executando testes E2E...\n');

try {
  // Executar testes
  const result = execSync('npx playwright test --reporter=line', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ Todos os testes passaram!');
  
  // Verificar se o relatório foi gerado
  if (fs.existsSync('test-results')) {
    console.log('📊 Relatório gerado em: test-results/');
    console.log('💡 Execute: npm run test:report para ver o relatório HTML');
  }
  
} catch (error) {
  console.log('\n❌ Alguns testes falharam');
  console.log('💡 Execute: npm run test:report para ver detalhes');
  console.log('💡 Execute: npm run test:debug para debugar');
  process.exit(1);
}

console.log('\n🎉 Testes E2E concluídos com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm run test:report para ver relatório detalhado');
console.log('2. Execute: npm run test:ui para interface visual');
console.log('3. Execute: npm run test:debug para debugar falhas');
console.log('4. Verifique os screenshots em test-results/');
