# 🌭 HotDog Manager

Sistema SaaS completo de gerenciamento multi-tenant para lanchonetes e food trucks, desenvolvido com React, Vite e Convex.

## 🏢 Sistema Multi-Tenant

O HotDog Manager é um sistema SaaS que permite múltiplas empresas (tenants) utilizarem a mesma aplicação com isolamento completo de dados. Cada empresa possui seu próprio CNPJ e dados isolados.

### 🔐 Arquitetura Multi-Tenant

- **Isolamento de Dados**: Cada tenant possui dados completamente separados
- **Autenticação Centralizada**: Clerk gerencia usuários globalmente
- **Controle de Acesso**: Sistema de permissões baseado em roles
- **Expiração de Planos**: Controle automático de acesso por data
- **Painel Administrativo**: Gerenciamento centralizado de tenants

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: Tailwind CSS + Radix UI
- **Backend**: Convex (Database + Functions)
- **Autenticação**: Clerk
- **Animações**: Framer Motion
- **Testes**: Playwright E2E
- **Multi-tenancy**: Convex + React Context

## 📋 Funcionalidades

### 🏪 **Funcionalidades por Tenant**
- ✅ **Dashboard** - Visão geral do negócio
- ✅ **Produtos** - Cadastro e gerenciamento
- ✅ **Categorias** - Organização de produtos
- ✅ **Vendas** - Sistema de pedidos
- ✅ **Pagamentos** - Processamento com múltiplas formas
- ✅ **Relatórios** - Análise de desempenho
- ✅ **Produção** - Controle de pedidos
- ✅ **Caixa** - Gestão financeira
- ✅ **Clientes** - Cadastro de clientes

### 🔧 **Funcionalidades Administrativas**
- ✅ **Painel Root** - Gerenciamento de tenants
- ✅ **Cron Jobs** - Automação de tarefas
- ✅ **Migração de Dados** - Ferramentas de migração
- ✅ **Provisionamento** - Criação de projetos Convex
- ✅ **Monitoramento** - Acompanhamento do sistema

## 🛠️ Instalação

### 1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/hotdog-manager.git
cd hotdog-manager
```

### 2. Instale as dependências:
```bash
npm install
```

### 3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto baseado no `env.example`:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
VITE_CLERK_SECRET_KEY=sk_test_sua_chave_aqui

# Convex Database
VITE_CONVEX_URL=https://sua_url_convex_aqui

# Environment
NODE_ENV=development

# Root Admin Allowlist (emails separados por vírgula)
VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com
```

### 4. Configure o Convex:
```bash
npx convex dev
```

### 5. Execute o seed inicial:
```bash
# No console do Convex, execute:
# api.seed.seed()
```

### 6. Execute o projeto:
```bash
npm run dev
```

### 7. Acesse a aplicação:
- **URL**: http://localhost:5173
- **Login**: Use o email configurado no seed

## 🔑 Obter as Chaves

### Clerk (Autenticação)
1. Acesse [clerk.com](https://clerk.com)
2. Crie uma conta e um novo projeto
3. Copie as chaves para o `.env`
4. Configure as URLs de redirecionamento:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://seu-dominio.com`

### Convex (Banco de Dados)
1. Execute `npx convex dev`
2. Faça login e crie um projeto
3. Copie a URL para o `.env`
4. Configure o schema automaticamente

## 🏢 Sistema Multi-Tenant

### 📋 Conceitos Básicos

**Tenant**: Uma empresa ou organização que usa o sistema
**CNPJ**: Identificador único de cada tenant
**Membership**: Vínculo entre usuário e tenant
**Root Admin**: Usuário com acesso administrativo global

### 🔐 Fluxo de Onboarding

1. **Login**: Usuário faz login com Clerk
2. **Modal de Vínculo**: Sistema exibe modal para vincular ao CNPJ
3. **Validação**: CNPJ é validado e tenant é encontrado
4. **Membership**: Usuário é vinculado ao tenant
5. **Acesso**: Usuário pode acessar dados do tenant

### 🔄 Alternância de Tenants

- **Tenant Switcher**: Dropdown na navbar para trocar de tenant
- **Contexto Global**: React Context gerencia tenant atual
- **Isolamento**: Dados são filtrados automaticamente por tenant
- **Permissões**: Usuário só vê tenants aos quais tem acesso

### ⏰ Controle de Expiração

- **Expiração Automática**: Cron job marca tenants expirados
- **Bloqueio de Acesso**: Tenants expirados não podem acessar dados
- **Página de Aviso**: Interface clara para renovação
- **Exceção Root**: Root admins podem acessar mesmo com tenant expirado

## 📝 Scripts Disponíveis

### 🚀 Desenvolvimento
- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview da build

### 🧪 Testes
- `npm test` - Executa testes E2E
- `npm run test:ui` - Interface visual dos testes
- `npm run test:debug` - Modo debug dos testes
- `npm run test:headed` - Testes com navegador visível
- `npm run test:report` - Relatório de testes
- `npm run test:install` - Instala navegadores do Playwright

### 🔧 Convex
- `npx convex dev` - Modo desenvolvimento do Convex
- `npx convex deploy` - Deploy para produção
- `npx convex logs` - Visualizar logs

## 🎨 Estrutura do Projeto

```
hotdog-manager/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   │   ├── ui/         # Componentes de UI (Radix)
│   │   ├── Layout.jsx  # Layout principal
│   │   ├── TenantSwitcher.tsx  # Seletor de tenant
│   │   ├── ModalVinculoCnpj.tsx  # Modal de onboarding
│   │   └── RootGuard.tsx  # Proteção do painel root
│   ├── pages/         # Páginas da aplicação
│   │   ├── Dashboard.jsx  # Dashboard principal
│   │   ├── Products.jsx   # Gerenciamento de produtos
│   │   ├── Sales.jsx      # Sistema de vendas
│   │   └── root/          # Páginas administrativas
│   ├── contexts/      # React Contexts
│   │   └── TenantContext.tsx  # Contexto do tenant atual
│   ├── hooks/         # Custom hooks
│   │   ├── useProducts.ts  # Hook para produtos
│   │   ├── useSales.ts    # Hook para vendas
│   │   └── useTenantExpiration.ts  # Hook para expiração
│   ├── lib/           # Utilitários e configurações
│   │   ├── convex.tsx     # Cliente Convex
│   │   └── convexClient.ts # Cliente dinâmico
│   └── config.js      # Configurações da aplicação
├── convex/            # Backend (database + functions)
│   ├── schema.ts      # Estrutura do banco
│   ├── tenants.ts     # Funções de tenants
│   ├── memberships.ts # Funções de memberships
│   ├── products.ts    # Funções de produtos
│   ├── sales.ts       # Funções de vendas
│   ├── crons.ts       # Cron jobs
│   ├── seed.ts        # Seeds de desenvolvimento
│   ├── utils/         # Utilitários do backend
│   │   ├── auth.ts    # Autenticação e autorização
│   │   └── cnpj.ts    # Validação de CNPJ
│   └── admin/         # Funções administrativas
│       └── migrateTenantId.ts  # Migração de dados
├── tests/             # Testes E2E
│   ├── e2e/           # Testes end-to-end
│   └── playwright.config.ts  # Configuração Playwright
├── scripts/           # Scripts utilitários
│   ├── provision/     # Scripts de provisionamento
│   └── test-e2e.js   # Script de testes
└── public/            # Arquivos públicos
```

## 🌱 Seeds de Desenvolvimento

### Seed Básico
```bash
# No console do Convex, execute:
api.seed.seed()
```

**Cria:**
- Usuário Master (pedrinhocornetti@gmail.com)
- Tenant principal (12.345.678/0001-90)
- Membership vinculando usuário ao tenant

### Seed de Desenvolvimento
```bash
# No console do Convex, execute:
api.seed.seedDev()
```

**Cria:**
- 2 usuários demo (admin e employee)
- 2 tenants (1 ativo, 1 expirado)
- 3 registros por coleção para cada tenant
- Dados realistas para testes

## ⏰ Cron Jobs

### Configuração Automática
Os cron jobs são configurados automaticamente no arquivo `convex/crons.ts`:

```typescript
// Cron diário às 03:00 UTC
cronDaily("mark-expired-tenants", "0 3 * * *", api.tenants.markExpired, {});

// Cron semanal
cronWeekly("expiration-report", "0 9 * * 1", api.tenants.getExpirationStats, {});

// Cron mensal
cronMonthly("data-cleanup", "0 2 1 * *", api.admin.cleanupLegacyData, {});
```

### Monitoramento
- **Painel Root**: `/root/cron` - Monitor de cron jobs
- **Logs**: `npx convex logs` - Visualizar logs
- **Status**: Verificar status dos jobs em tempo real

## 🔄 Migração de Dados

### Migração de TenantId
Para migrar dados legados que não possuem `tenantId`:

```bash
# No console do Convex, execute:
api.admin.migrateTenantId.analyzeLegacyData()
api.admin.migrateTenantId.migrateLegacyData({
  targetTenantId: "tenant_id_aqui",
  collections: ["products", "sales"],
  dryRun: true
})
```

### Painel de Migração
- **URL**: `/root/migration`
- **Funcionalidades**:
  - Análise de dados legados
  - Migração automática
  - Exportação para CSV
  - Relatórios de progresso

## 🔧 Operação e Manutenção

### Painel Root Admin
- **URL**: `/root`
- **Acesso**: Apenas emails em `VITE_ROOT_ALLOWLIST`
- **Funcionalidades**:
  - Gerenciamento de tenants
  - Monitoramento de cron jobs
  - Migração de dados
  - Provisionamento físico
  - Relatórios administrativos

### Monitoramento
- **Logs**: `npx convex logs`
- **Métricas**: Painel root com estatísticas
- **Alertas**: Sistema de notificações
- **Backup**: Automático via Convex

### Troubleshooting
- **Tenant não encontrado**: Verificar CNPJ e membership
- **Acesso negado**: Verificar permissões e expiração
- **Erro de autenticação**: Verificar configuração do Clerk
- **Dados não carregam**: Verificar tenantId nas queries

## 🚀 Deploy e Produção

### Vercel (Recomendado)
1. **Configure as variáveis de ambiente** no Vercel:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
   VITE_CLERK_SECRET_KEY=sk_live_sua_chave_aqui
   VITE_CONVEX_URL=https://sua_url_convex_production
   VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com
   ```

2. **Deploy do Convex**:
   ```bash
   npx convex deploy --prod
   ```

3. **Deploy do Frontend**:
   ```bash
   npm run build
   # Upload para Vercel ou execute: vercel --prod
   ```

### Configuração de Produção
- **Clerk**: Use chaves de produção (`pk_live_` e `sk_live_`)
- **Convex**: Deploy para ambiente de produção
- **URLs**: Configure URLs de produção no Clerk
- **Root Allowlist**: Configure emails administrativos

## 🧪 Testes em Produção

### Executar Testes E2E
```bash
# Instalar navegadores
npm run test:install

# Executar testes
npm test

# Ver relatório
npm run test:report
```

### Validar Sistema Multi-Tenant
1. **Teste de Onboarding**: Login → Modal de vínculo → Seleção de tenant
2. **Teste de Alternância**: Trocar entre tenants
3. **Teste de Expiração**: Acessar tenant expirado
4. **Teste Root Admin**: Acessar painel administrativo

## 📚 Documentação Adicional

### Arquivos de Documentação
- `TESTING_GUIDE.md` - Guia completo de testes
- `CONFIGURACAO_MASTER.md` - Configuração do usuário master
- `SISTEMA_PERMISSOES.md` - Sistema de permissões
- `DEPLOY_VERCEL.md` - Deploy na Vercel

### Documentação por Etapa
- `src/pages/EXPIRATION_SYSTEM.md` - Sistema de expiração
- `src/pages/CRON_SYSTEM.md` - Sistema de cron jobs
- `src/pages/MIGRATION_SYSTEM.md` - Sistema de migração
- `src/pages/PROVISIONING_SYSTEM.md` - Sistema de provisionamento

## 🔒 Segurança

### Configurações de Segurança
- **Isolamento de Dados**: Cada tenant possui dados separados
- **Autenticação**: Clerk com JWT e sessões seguras
- **Autorização**: Sistema de roles e permissões
- **Validação**: CNPJ e dados validados no backend
- **Expiração**: Controle automático de acesso

### Boas Práticas
- **Nunca** commite chaves de produção
- **Sempre** use HTTPS em produção
- **Configure** CORS adequadamente
- **Monitore** logs e métricas
- **Faça** backup regular dos dados

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Execute os testes (`npm test`)
5. Push para a branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

### Padrões de Código
- **TypeScript**: Use tipagem forte
- **ESLint**: Siga as regras de linting
- **Prettier**: Formatação consistente
- **Commits**: Use conventional commits
- **Testes**: Mantenha cobertura de testes

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Pedro Cornetti - [@pedrinhocornetti](https://github.com/pedrinhocornetti)

---

⭐ Se este projeto te ajudou, considere dar uma estrela!

## 🆘 Suporte

### Problemas Comuns
- **Erro de autenticação**: Verifique configuração do Clerk
- **Tenant não encontrado**: Execute seed de desenvolvimento
- **Acesso negado**: Verifique permissões e expiração
- **Dados não carregam**: Verifique tenantId nas queries

### Contato
- **Email**: appfortecnologia@gmail.com
- **Issues**: [GitHub Issues](https://github.com/seu_usuario/hotdog-manager/issues)
- **Documentação**: Consulte os arquivos de documentação

---

**HotDog Manager** - Sistema SaaS Multi-Tenant para Lanchonetes 🚀