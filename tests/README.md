# Testes E2E - HotDog Manager

Este diretório contém os testes end-to-end (E2E) do sistema HotDog Manager usando Playwright.

## 🎯 Objetivos dos Testes

Os testes E2E cobrem os fluxos principais do sistema SaaS:

1. **Autenticação** - Login/logout com Clerk
2. **Onboarding** - Modal de vínculo ao CNPJ
3. **Alternância de Tenant** - Troca entre diferentes empresas
4. **Bloqueio por Expiração** - Controle de acesso para tenants expirados
5. **Ações Root Admin** - Funcionalidades administrativas
6. **Integração Completa** - Fluxo completo do sistema

## 📁 Estrutura dos Testes

```
tests/
├── e2e/
│   ├── auth.spec.ts              # Testes de autenticação
│   ├── tenant-onboarding.spec.ts # Testes de onboarding
│   ├── tenant-switching.spec.ts  # Testes de alternância de tenant
│   ├── tenant-expiration.spec.ts # Testes de bloqueio por expiração
│   ├── root-admin.spec.ts        # Testes de ações root admin
│   ├── integration.spec.ts       # Teste de integração completo
│   └── test-setup.ts             # Configurações e helpers
├── playwright.config.ts          # Configuração do Playwright
└── README.md                     # Este arquivo
```

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Instalar navegadores do Playwright:**
   ```bash
   npm run test:install
   ```

3. **Executar seed de desenvolvimento:**
   ```bash
   # No console do Convex, execute:
   # api.seed.seedDev()
   ```

### Comandos de Teste

```bash
# Executar todos os testes
npm test

# Executar com interface visual
npm run test:ui

# Executar em modo debug
npm run test:debug

# Executar com navegador visível
npm run test:headed

# Ver relatório de testes
npm run test:report
```

### Executar Testes Específicos

```bash
# Executar apenas testes de autenticação
npx playwright test auth

# Executar apenas testes de integração
npx playwright test integration

# Executar em navegador específico
npx playwright test --project=chromium
```

## 🧪 Cenários de Teste

### 1. Autenticação (`auth.spec.ts`)

- ✅ Login com credenciais válidas
- ✅ Erro com credenciais inválidas
- ✅ Logout com sucesso
- ✅ Proteção de rotas autenticadas
- ✅ Manutenção de sessão após refresh

### 2. Onboarding (`tenant-onboarding.spec.ts`)

- ✅ Exibição do modal de vínculo
- ✅ Validação de CNPJ inválido
- ✅ Vínculo ao CNPJ com sucesso
- ✅ Erro para CNPJ não encontrado
- ✅ Fechamento do modal sem vincular
- ✅ Loading durante processamento

### 3. Alternância de Tenant (`tenant-switching.spec.ts`)

- ✅ Exibição do tenant switcher
- ✅ Abertura do dropdown com lista
- ✅ Troca para outro tenant
- ✅ Exibição de status do tenant
- ✅ Fechamento do dropdown
- ✅ Manutenção de estado após refresh
- ✅ Loading durante troca

### 4. Bloqueio por Expiração (`tenant-expiration.spec.ts`)

- ✅ Bloqueio de acesso a tenant expirado
- ✅ Exibição da página de plano expirado
- ✅ Opções de renovação
- ✅ Bloqueio de funcionalidades
- ✅ Acesso ao painel root
- ✅ Banner de aviso
- ✅ Logout com tenant expirado
- ✅ Informações de contato
- ✅ Troca para tenant ativo

### 5. Ações Root Admin (`root-admin.spec.ts`)

- ✅ Acesso ao painel root
- ✅ Navegação do painel root
- ✅ Gerenciamento de tenants
- ✅ Monitoramento de cron
- ✅ Migração de dados
- ✅ Provisionamento físico
- ✅ Bloqueio para usuários não-root
- ✅ Relatórios administrativos
- ✅ Navegação entre páginas
- ✅ Manutenção de sessão

### 6. Integração Completa (`integration.spec.ts`)

- ✅ Fluxo completo do sistema SaaS
- ✅ Usuário não-root tentando acessar root
- ✅ Tenant expirado com usuário root

## 📊 Dados de Teste

### Usuários

```typescript
// Usuário administrador
email: 'demo1@hotdogmanager.com'
password: 'Demo123!'

// Usuário funcionário
email: 'demo2@hotdogmanager.com'
password: 'Demo123!'

// Usuário root admin
email: 'pedrinhocornetti@gmail.com'
password: 'Master123!'
```

### Tenants

```typescript
// Tenant ativo
cnpj: '11.222.333/0001-44'
name: 'Lanchonete do João Ltda'
status: 'active'

// Tenant expirado
cnpj: '99.888.777/0001-66'
name: 'Hot Dog Express Ltda'
status: 'expired'
```

## 🔧 Configuração

### Playwright Config

O arquivo `playwright.config.ts` contém:

- **Navegadores**: Chrome, Firefox, Safari, Mobile
- **Timeouts**: 30s por teste, 60s total
- **Retry**: 2 tentativas em caso de falha
- **Workers**: 4 em desenvolvimento, 1 em CI
- **Reporter**: HTML, JSON, JUnit

### Test Setup

O arquivo `test-setup.ts` fornece:

- **Helpers**: Funções utilitárias para testes
- **TestData**: Dados de teste centralizados
- **Timeouts**: Configurações de timeout
- **Viewports**: Tamanhos de tela para testes

## 🐛 Troubleshooting

### Problemas Comuns

1. **Testes falham por timeout:**
   - Verificar se o servidor está rodando
   - Aumentar timeouts no config
   - Verificar conectividade de rede

2. **Elementos não encontrados:**
   - Verificar se os data-testid estão corretos
   - Aguardar carregamento completo da página
   - Verificar se o seed foi executado

3. **Login falha:**
   - Verificar credenciais de teste
   - Verificar se o Clerk está configurado
   - Verificar se o usuário existe no banco

4. **Tenant não encontrado:**
   - Executar seed de desenvolvimento
   - Verificar se o tenant existe
   - Verificar permissões do usuário

### Debug

```bash
# Executar em modo debug
npm run test:debug

# Executar com logs detalhados
DEBUG=pw:api npx playwright test

# Executar com navegador visível
npm run test:headed
```

## 📈 Relatórios

### HTML Report

```bash
npm run test:report
```

O relatório HTML inclui:
- Resumo de execução
- Screenshots de falhas
- Vídeos de execução
- Traces detalhados
- Logs de console

### CI/CD

Os testes são configurados para:
- Executar em CI/CD
- Gerar relatórios em JSON/JUnit
- Falhar o build em caso de erro
- Executar em paralelo

## 🔮 Próximos Passos

### Melhorias Planejadas

- [ ] Testes de performance
- [ ] Testes de acessibilidade
- [ ] Testes de responsividade
- [ ] Testes de API
- [ ] Testes de integração com Convex

### Novos Cenários

- [ ] Testes de migração de dados
- [ ] Testes de provisionamento físico
- [ ] Testes de cron jobs
- [ ] Testes de relatórios
- [ ] Testes de exportação

## 📚 Recursos

- [Documentação do Playwright](https://playwright.dev/)
- [Guia de Testes E2E](https://playwright.dev/docs/intro)
- [Configuração de CI/CD](https://playwright.dev/docs/ci)
- [Debugging de Testes](https://playwright.dev/docs/debug)
