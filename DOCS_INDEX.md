# Índice de Documentação - HotDog Manager

Este documento serve como índice para toda a documentação do sistema HotDog Manager.

## 📚 Documentação Principal

### 🚀 **README.md**
**Documentação principal do projeto**
- Visão geral do sistema multi-tenant
- Instalação e configuração
- Funcionalidades e tecnologias
- Estrutura do projeto
- Scripts disponíveis
- Deploy e produção

### 🏃 **QUICK_START.md**
**Guia rápido para desenvolvedores**
- Setup em 5 minutos
- Configuração básica
- Comandos essenciais
- Problemas comuns
- Deploy rápido

### 🔧 **OPERATION_GUIDE.md**
**Guia de operação e manutenção**
- Setup inicial completo
- Gerenciamento de tenants
- Monitoramento de cron jobs
- Migração de dados
- Troubleshooting
- Segurança e boas práticas

## 🧪 Documentação de Testes

### 🧪 **TESTING_GUIDE.md**
**Guia completo de testes**
- Seeds de desenvolvimento
- Testes E2E com Playwright
- Configuração e setup
- Cenários de teste
- Relatórios e resultados
- Troubleshooting

### 📁 **tests/README.md**
**Documentação dos testes E2E**
- Objetivos dos testes
- Estrutura dos testes
- Como executar
- Cenários testados
- Dados de teste
- Configuração

## 🏢 Documentação do Sistema Multi-Tenant

### 📋 **src/pages/EXPIRATION_SYSTEM.md**
**Sistema de expiração de tenants**
- Controle de acesso por data
- Bloqueio automático
- Página de aviso
- Renovação de planos

### ⏰ **src/pages/CRON_SYSTEM.md**
**Sistema de cron jobs**
- Automação de tarefas
- Monitoramento
- Configuração
- Troubleshooting

### 🔄 **src/pages/MIGRATION_SYSTEM.md**
**Sistema de migração de dados**
- Migração de tenantId
- Análise de dados legados
- Exportação para CSV
- Ferramentas administrativas

### 🏗️ **src/pages/PROVISIONING_SYSTEM.md**
**Sistema de provisionamento físico**
- Criação de projetos Convex
- Cliente dinâmico
- Feature flags
- Monitoramento

## 🔐 Documentação de Autenticação e Permissões

### 🔑 **SISTEMA_PERMISSOES.md**
**Sistema de permissões**
- Roles e permissões
- Controle de acesso
- Validação de usuários
- Segurança

### 👤 **CONFIGURACAO_MASTER.md**
**Configuração do usuário master**
- Setup inicial
- Permissões administrativas
- Configuração de root admin

### 🏢 **src/pages/root/README.md**
**Painel administrativo root**
- Funcionalidades administrativas
- Gerenciamento de tenants
- Monitoramento do sistema

## 🚀 Documentação de Deploy

### 🌐 **DEPLOY_VERCEL.md**
**Deploy na Vercel**
- Configuração de produção
- Variáveis de ambiente
- Deploy automático
- Monitoramento

### 📦 **vercel.json**
**Configuração do Vercel**
- Build settings
- Environment variables
- Redirects
- Headers

## 🧩 Documentação de Componentes

### 🎨 **src/components/README_ONBOARDING.md**
**Sistema de onboarding**
- Modal de vínculo ao CNPJ
- Fluxo de primeiro acesso
- Validação de CNPJ
- Configuração

### 🔄 **src/components/README_TENANT_SWITCHER.md**
**Seletor de tenant**
- Alternância entre tenants
- Contexto global
- Interface de usuário
- Configuração

### 🏗️ **src/contexts/README.md**
**Contextos React**
- TenantContext
- Gerenciamento de estado
- Hooks customizados
- Configuração

### 🎣 **src/hooks/README.md**
**Hooks customizados**
- useProducts
- useSales
- useTenantExpiration
- useTenantConvex

## 🔧 Documentação Técnica

### 🗄️ **convex/README.md**
**Backend Convex**
- Schema do banco
- Funções e mutations
- Queries e actions
- Configuração

### 🧪 **src/pages/TEST_*.md**
**Guias de teste**
- TEST_EXPIRATION.md
- TEST_CRON.md
- TEST_MIGRATION.md
- TEST_PROVISIONING.md

## 📊 Documentação de Dados

### 🌱 **convex/seed.ts**
**Seeds de desenvolvimento**
- Dados de teste
- Configuração inicial
- Usuários demo
- Tenants de exemplo

### 🔄 **convex/admin/migrateTenantId.ts**
**Migração de dados**
- Análise de dados legados
- Migração automática
- Exportação para CSV
- Ferramentas administrativas

## 🛠️ Scripts e Ferramentas

### 🧪 **scripts/test-e2e.js**
**Script de testes E2E**
- Execução automatizada
- Verificação de dependências
- Relatórios de resultado

### 🏗️ **scripts/provision/convex-provision-tenant.ts**
**Script de provisionamento**
- Criação de projetos Convex
- Configuração automática
- Monitoramento

## 📋 Como Usar Esta Documentação

### 🚀 **Para Desenvolvedores Novos**
1. Comece com `QUICK_START.md`
2. Leia `README.md` para visão geral
3. Consulte `TESTING_GUIDE.md` para testes
4. Use `OPERATION_GUIDE.md` para operação

### 🔧 **Para Operação**
1. Consulte `OPERATION_GUIDE.md`
2. Use `src/pages/*.md` para funcionalidades específicas
3. Verifique `SISTEMA_PERMISSOES.md` para segurança
4. Use `DEPLOY_VERCEL.md` para deploy

### 🧪 **Para Testes**
1. Leia `TESTING_GUIDE.md`
2. Consulte `tests/README.md`
3. Use `src/pages/TEST_*.md` para testes específicos
4. Execute `scripts/test-e2e.js`

### 🏢 **Para Sistema Multi-Tenant**
1. Leia `README.md` seção multi-tenant
2. Consulte `src/pages/EXPIRATION_SYSTEM.md`
3. Use `src/pages/CRON_SYSTEM.md`
4. Verifique `src/pages/MIGRATION_SYSTEM.md`

## 🔍 Busca Rápida

### **Problemas Comuns**
- **Setup**: `QUICK_START.md`
- **Autenticação**: `SISTEMA_PERMISSOES.md`
- **Tenant não encontrado**: `OPERATION_GUIDE.md`
- **Acesso negado**: `src/pages/EXPIRATION_SYSTEM.md`
- **Dados não carregam**: `src/pages/MIGRATION_SYSTEM.md`

### **Funcionalidades**
- **Onboarding**: `src/components/README_ONBOARDING.md`
- **Alternância de tenant**: `src/components/README_TENANT_SWITCHER.md`
- **Cron jobs**: `src/pages/CRON_SYSTEM.md`
- **Migração**: `src/pages/MIGRATION_SYSTEM.md`
- **Provisionamento**: `src/pages/PROVISIONING_SYSTEM.md`

### **Deploy e Produção**
- **Deploy**: `DEPLOY_VERCEL.md`
- **Configuração**: `README.md`
- **Monitoramento**: `OPERATION_GUIDE.md`
- **Segurança**: `SISTEMA_PERMISSOES.md`

---

**HotDog Manager** - Índice de Documentação 📚
