# Painel Administrativo Root

Este diretório contém as páginas do painel administrativo root, acessível apenas para usuários autorizados na allowlist.

## 🔒 Controle de Acesso

O painel root é protegido por um sistema de allowlist baseado em email:

- **Variável de ambiente**: `VITE_ROOT_ALLOWLIST`
- **Valor padrão**: `appfortecnologia@gmail.com`
- **Formato**: Emails separados por vírgula
- **Exemplo**: `admin1@empresa.com,admin2@empresa.com`

### Configuração

```bash
# .env
VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com,admin@empresa.com
```

## 📁 Estrutura de Arquivos

```
src/pages/root/
├── README.md                 # Esta documentação
├── RootDashboard.jsx         # Dashboard principal
├── RootTenants.jsx          # Gerenciamento de tenants
└── RootReports.jsx          # Relatórios do sistema

src/components/
├── RootGuard.tsx            # Proteção de rotas
└── RootLayout.jsx           # Layout do painel root
```

## 🚀 Funcionalidades

### 1. Dashboard Principal (`/root`)

**Funcionalidades:**
- ✅ Estatísticas gerais dos tenants
- ✅ Cards com métricas principais
- ✅ Lista de tenants recentes
- ✅ Ações rápidas
- ✅ Visão geral do sistema

**Métricas exibidas:**
- Total de tenants
- Tenants ativos
- Tenants suspensos
- Tenants expirando em 7 dias

### 2. Gerenciamento de Tenants (`/root/tenants`)

**Funcionalidades:**
- ✅ **CRUD completo** de tenants
- ✅ **Busca por CNPJ** ou nome da empresa
- ✅ **Filtro por status** (todos, ativos, suspensos)
- ✅ **Criação de novos tenants**
- ✅ **Renovação de dias** de validade
- ✅ **Suspensão/reativação** de tenants
- ✅ **Visualização detalhada** de cada tenant

**Operações disponíveis:**
- ➕ Criar novo tenant
- 🔄 Renovar tenant (adicionar dias)
- ⏸️ Suspender tenant
- ▶️ Reativar tenant
- 🔍 Buscar tenants
- 📊 Visualizar estatísticas

### 3. Relatórios (`/root/reports`)

**Funcionalidades:**
- ✅ **Estatísticas detalhadas** do sistema
- ✅ **Distribuição por plano** (básico, premium, enterprise)
- ✅ **Tenants mais antigos** do sistema
- ✅ **Tenants com mais acessos**
- ✅ **Análise de status** dos tenants
- ✅ **Ações recomendadas** baseadas nos dados
- ✅ **Filtros por período** (7, 30, 90, 365 dias)

**Relatórios disponíveis:**
- Taxa de ativação dos tenants
- Tenants que nunca acessaram
- Tenants expirando em breve
- Distribuição por planos
- Ranking de acessos
- Análise de retenção

## 🛡️ Segurança

### RootGuard

O componente `RootGuard` protege todas as rotas do painel root:

```typescript
// Verificação automática de permissão
const isAuthorized = userEmail && config.root.allowlist.includes(userEmail);

// Se não autorizado, mostra erro 404
if (!isAuthorized) {
  return <NotFoundPage />;
}
```

**Funcionalidades de segurança:**
- ✅ Verificação de usuário logado
- ✅ Validação de email na allowlist
- ✅ Exibição de erro 404 para não autorizados
- ✅ Debug de emails autorizados vs detectado
- ✅ Redirecionamento para página inicial

### Hooks de Segurança

```typescript
// Verificar se é admin root
const isRootAdmin = useIsRootAdmin();

// Obter informações do usuário root
const { user, isLoaded, isRootAdmin, userEmail, allowlist } = useRootUserInfo();
```

## 🎨 Interface

### RootLayout

Layout específico para o painel root com:

- ✅ **Sidebar de navegação** com ícones
- ✅ **Header com busca** e informações do usuário
- ✅ **Design responsivo** (mobile + desktop)
- ✅ **Navegação entre páginas** do painel
- ✅ **Link para voltar** ao app principal

### Componentes UI

Todos os componentes seguem o design system do projeto:

- ✅ **Cards** para exibir informações
- ✅ **Badges** para status e indicadores
- ✅ **Buttons** para ações
- ✅ **Dialogs** para modais
- ✅ **Inputs** para formulários
- ✅ **Tabelas** para listagens

## 📊 Dados e Queries

### Queries Convex Utilizadas

```typescript
// Estatísticas dos tenants
const tenantStats = useQuery(api.tenants.getTenantStats);

// Lista de tenants
const tenants = useQuery(api.tenants.listTenants, { status: undefined });

// Buscar tenant por CNPJ
const tenant = useQuery(api.tenants.getTenantByCnpj, { cnpj: '12345678000100' });
```

### Mutations Convex Utilizadas

```typescript
// Criar tenant
const createTenant = useMutation(api.tenants.createTenant);

// Renovar tenant
const renewTenant = useMutation(api.tenants.renewTenant);

// Suspender tenant
const suspendTenant = useMutation(api.tenants.suspendTenant);

// Reativar tenant
const reactivateTenant = useMutation(api.tenants.reactivateTenant);
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env
VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com,admin@empresa.com
```

### Configuração no Código

```javascript
// src/config.js
export const config = {
  root: {
    allowlist: (import.meta.env.VITE_ROOT_ALLOWLIST || 'appfortecnologia@gmail.com')
      .split(',')
      .map(email => email.trim())
  }
};
```

## 🚀 Como Usar

### 1. Acessar o Painel

1. Faça login com um email autorizado
2. Navegue para `/root`
3. O sistema verificará automaticamente suas permissões

### 2. Gerenciar Tenants

1. Acesse `/root/tenants`
2. Use a busca para encontrar tenants específicos
3. Filtre por status se necessário
4. Clique em "Criar Tenant" para adicionar novos
5. Use os botões de ação para gerenciar tenants existentes

### 3. Visualizar Relatórios

1. Acesse `/root/reports`
2. Use os filtros de período
3. Analise as métricas e estatísticas
4. Siga as ações recomendadas

## 🐛 Troubleshooting

### Erro: "404 - Página Não Encontrada"

**Causa**: Email não está na allowlist

**Solução**: 
1. Verificar se o email está em `VITE_ROOT_ALLOWLIST`
2. Verificar se não há espaços extras no email
3. Verificar se a variável de ambiente está carregada

### Erro: "Nenhum tenant encontrado"

**Causa**: Não há tenants cadastrados no sistema

**Solução**: Criar pelo menos um tenant usando o botão "Criar Tenant"

### Erro: "Erro ao criar tenant"

**Causa**: Dados inválidos ou CNPJ duplicado

**Solução**: 
1. Verificar se o CNPJ é válido
2. Verificar se o CNPJ não já existe
3. Verificar se todos os campos obrigatórios estão preenchidos

## 📈 Métricas e KPIs

### Métricas Principais

- **Total de Tenants**: Número total de empresas cadastradas
- **Taxa de Ativação**: Percentual de tenants ativos
- **Taxa de Retenção**: Percentual de tenants que acessam regularmente
- **Tempo Médio de Uso**: Tempo médio desde a criação até o primeiro acesso

### Alertas Automáticos

- ⚠️ **Tenants expirando**: Alertas para tenants que expiram em 7 dias
- 🚫 **Nunca acessaram**: Identificação de tenants inativos
- ⏸️ **Suspensos**: Lista de tenants suspensos que podem precisar de atenção

## 🔮 Funcionalidades Futuras

### Planejadas

- 📧 **Notificações por email** para tenants expirando
- 📊 **Exportação de relatórios** em PDF/Excel
- 🔄 **Renovação automática** de tenants
- 📱 **App mobile** para administradores
- 🔔 **Sistema de alertas** em tempo real
- 📈 **Dashboard em tempo real** com WebSockets

### Melhorias

- 🎨 **Temas personalizáveis** para o painel
- 🔍 **Busca avançada** com múltiplos filtros
- 📋 **Templates de tenant** para criação rápida
- 🏷️ **Tags e categorias** para organizar tenants
- 📊 **Gráficos interativos** nos relatórios
- 🔐 **Logs de auditoria** para todas as ações
