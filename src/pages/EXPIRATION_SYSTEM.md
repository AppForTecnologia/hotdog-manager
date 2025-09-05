# Sistema de Bloqueio por Expiração

Este documento descreve o sistema implementado para bloquear acesso a tenants expirados e suspensos, garantindo que apenas tenants ativos e válidos possam acessar os dados do sistema.

## 🎯 Objetivos

- ✅ **Bloquear acesso** a tenants expirados no servidor
- ✅ **Redirecionar automaticamente** para página de aviso
- ✅ **Exibir avisos claros** sobre status do plano
- ✅ **Oferecer opções** de contato e renovação
- ✅ **Prevenir vazamento** de dados de tenants expirados

## 🏗️ Arquitetura

### 1. Servidor (Convex)

#### **withTenantAuth Atualizado**

```typescript
// convex/utils/auth.ts
export async function withTenantAuth<T>(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  fn: (userId: string, tenant: Doc<"tenants">, membership: Doc<"memberships">) => Promise<T>
): Promise<T> {
  // ... validações existentes ...
  
  // 3. Verificar se o tenant está ativo
  if (tenant.status !== "active") {
    throw new ConvexError(`TENANT_SUSPENDED: Tenant está ${tenant.status}. Acesso negado.`);
  }
  
  // 4. Verificar se o tenant não expirou
  const now = Date.now();
  if (tenant.expiresAt < now) {
    throw new ConvexError(`TENANT_EXPIRED: Tenant expirado em ${new Date(tenant.expiresAt).toLocaleDateString('pt-BR')}. Renovação necessária.`);
  }
  
  // ... resto da validação ...
}
```

**Funcionalidades:**
- ✅ **Verificação de status** do tenant (ativo/suspenso)
- ✅ **Verificação de expiração** por data
- ✅ **Erros específicos** com prefixos identificáveis
- ✅ **Informações detalhadas** sobre o problema

#### **Novas Funções Utilitárias**

```typescript
// Verificar status sem bloquear acesso
export async function getTenantStatus(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">
): Promise<'active' | 'expired' | 'suspended' | 'not_found'>

// Verificar se está próximo do vencimento
export async function isTenantExpiringSoon(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  daysThreshold: number = 7
): Promise<boolean>
```

#### **Query de Status Detalhado**

```typescript
// convex/tenants.ts
export const getCurrentTenantStatus = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // Retorna informações completas sobre:
    // - Status do tenant (active/expired/suspended/expiring_soon)
    // - Informações do tenant e membership
    // - Datas de expiração
    // - Dias até expiração
    // - Flags de status
  }
});
```

### 2. Frontend (React)

#### **Página de Plano Expirado**

```typescript
// src/pages/PlanoExpirado.tsx
export default function PlanoExpirado() {
  // Funcionalidades:
  // ✅ Exibe informações detalhadas do tenant
  // ✅ Mostra status (expirado/suspenso/expirando)
  // ✅ Oferece botão de contato por email
  // ✅ Permite trocar de tenant
  // ✅ Informações de contato do suporte
  // ✅ Design responsivo e intuitivo
}
```

**Características:**
- ✅ **Interface clara** com ícones e cores apropriadas
- ✅ **Informações completas** do tenant e plano
- ✅ **Ações disponíveis** (contato, trocar tenant, tentar novamente)
- ✅ **Informações de suporte** (email, horário, WhatsApp)
- ✅ **Design responsivo** para mobile e desktop

#### **Hooks de Expiração**

```typescript
// src/hooks/useTenantExpiration.ts

// Hook principal para detectar expiração
export function useTenantExpiration() {
  // Monitora status do tenant atual
  // Redireciona automaticamente quando necessário
  // Retorna informações de expiração
}

// Hook para interceptar erros do Convex
export function useConvexErrorHandler() {
  // Captura erros TENANT_EXPIRED e TENANT_SUSPENDED
  // Redireciona automaticamente para /plano-expirado
}

// Hook para avisos de expiração próxima
export function useTenantExpirationWarning() {
  // Exibe notificações quando próximo do vencimento
  // Mostra alertas visuais na interface
}

// Hook consolidado com todas as informações
export function useTenantExpirationStatus() {
  // Combina todos os hooks em uma interface única
  // Retorna status completo e ações disponíveis
}
```

#### **Componentes de Proteção**

```typescript
// src/components/TenantExpirationGuard.tsx

// Guard principal para proteger rotas
export function TenantExpirationGuard({ children, fallback }) {
  // Verifica status do tenant
  // Redireciona se expirado/suspenso
  // Mostra loading durante verificação
}

// Banner de aviso para expiração próxima
export function ExpirationWarningBanner({ className }) {
  // Exibe aviso quando próximo do vencimento
  // Oferece link para renovação
  // Design discreto mas visível
}

// Indicador de status na interface
export function TenantStatusIndicator({ showDetails, className }) {
  // Mostra status atual do tenant
  // Badge colorido com informações
  // Link para página de detalhes
}
```

#### **Integração com TenantContext**

```typescript
// src/contexts/TenantContext.tsx
interface TenantContextType {
  // ... campos existentes ...
  
  // Informações de expiração
  isExpired: boolean;
  isSuspended: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  tenantStatus: any;
}
```

**Funcionalidades:**
- ✅ **Verificação automática** de status do tenant
- ✅ **Informações de expiração** disponíveis globalmente
- ✅ **Integração transparente** com sistema existente
- ✅ **Atualizações em tempo real** quando status muda

## 🔄 Fluxo de Funcionamento

### 1. Acesso Normal (Tenant Ativo)

```
Usuário acessa app → TenantContext verifica status → Status: "active" → Acesso liberado
```

### 2. Tenant Expirado

```
Usuário acessa app → withTenantAuth verifica → Status: "expired" → 
Erro TENANT_EXPIRED → useConvexErrorHandler captura → 
Redireciona para /plano-expirado → Página exibe aviso e opções
```

### 3. Tenant Suspenso

```
Usuário acessa app → withTenantAuth verifica → Status: "suspended" → 
Erro TENANT_SUSPENDED → useConvexErrorHandler captura → 
Redireciona para /plano-expirado → Página exibe aviso e opções
```

### 4. Tenant Expirando em Breve

```
Usuário acessa app → TenantContext detecta → Status: "expiring_soon" → 
ExpirationWarningBanner exibe aviso → Usuário pode renovar proativamente
```

## 🛡️ Segurança

### Bloqueio no Servidor

**Todas as queries/mutations protegidas:**
- ✅ **withTenantAuth** em todas as operações de dados
- ✅ **Verificação de expiração** antes de qualquer acesso
- ✅ **Erros específicos** para diferentes tipos de bloqueio
- ✅ **Impossível burlar** a proteção no frontend

### Validações Implementadas

```typescript
// Verificações no withTenantAuth:
1. Usuário autenticado ✓
2. Tenant existe ✓
3. Tenant está ativo ✓
4. Tenant não expirou ✓
5. Usuário tem membership ✓
6. Membership está ativo ✓
```

### Tipos de Erro

- **TENANT_EXPIRED**: Tenant expirou por data
- **TENANT_SUSPENDED**: Tenant foi suspenso administrativamente
- **NO_ACCESS**: Usuário não tem membership no tenant
- **NOT_FOUND**: Tenant não existe

## 🎨 Interface do Usuário

### Página de Plano Expirado

**Seções principais:**
1. **Header com ícone e título** apropriado ao status
2. **Informações do plano** (empresa, CNPJ, plano, status, datas)
3. **Ações disponíveis** (contato, trocar tenant, tentar novamente)
4. **Informações de contato** (email, horário, WhatsApp)
5. **Aviso importante** com explicação do problema
6. **Rodapé** com informações da empresa

**Estados visuais:**
- 🔴 **Expirado**: Cores vermelhas, ícone de relógio
- 🟡 **Suspenso**: Cores amarelas, ícone de pausa
- 🟠 **Expirando**: Cores laranja, ícone de aviso

### Banner de Aviso

**Características:**
- ✅ **Design discreto** mas visível
- ✅ **Cores laranja** para chamar atenção
- ✅ **Informação clara** sobre dias restantes
- ✅ **Link direto** para renovação
- ✅ **Posicionamento** no topo das páginas

### Indicadores de Status

**Tipos de indicador:**
- 🏷️ **Badge simples**: Status em uma linha
- 📊 **Badge com detalhes**: Status + link para detalhes
- 🚨 **Banner completo**: Aviso destacado

## 📱 Responsividade

### Mobile

- ✅ **Layout adaptado** para telas pequenas
- ✅ **Botões grandes** para fácil toque
- ✅ **Texto legível** em qualquer tamanho
- ✅ **Navegação simplificada**

### Desktop

- ✅ **Layout em colunas** para melhor uso do espaço
- ✅ **Informações organizadas** em grid
- ✅ **Hover effects** para melhor UX
- ✅ **Navegação completa** com sidebar

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Não são necessárias variáveis específicas
# O sistema usa as configurações existentes do tenant
```

### Configurações do Sistema

```typescript
// Configurações padrão:
const EXPIRATION_WARNING_DAYS = 7; // Avisar 7 dias antes
const NOTIFICATION_THRESHOLD = 3;  // Notificar quando restam 3 dias
```

## 🚀 Como Usar

### 1. Verificação Automática

O sistema funciona automaticamente:

```typescript
// Em qualquer componente:
const { isExpired, isSuspended, isExpiringSoon } = useTenant();

if (isExpired) {
  // Usuário será redirecionado automaticamente
}
```

### 2. Proteção Manual de Rotas

```typescript
// Proteger uma rota específica:
<Route path="/protected" element={
  <TenantExpirationGuard>
    <ProtectedComponent />
  </TenantExpirationGuard>
} />
```

### 3. Exibir Avisos

```typescript
// Banner de aviso automático:
<ExpirationWarningBanner />

// Indicador de status:
<TenantStatusIndicator showDetails={true} />
```

### 4. Interceptar Erros

```typescript
// Em um componente:
useConvexErrorHandler(); // Intercepta erros automaticamente

// Ou manualmente:
try {
  await someConvexMutation();
} catch (error) {
  if (error.message.includes('TENANT_EXPIRED')) {
    navigate('/plano-expirado');
  }
}
```

## 🐛 Troubleshooting

### Problema: Usuário não é redirecionado

**Causa**: Hook não está sendo usado ou erro não está sendo capturado

**Solução**: 
1. Verificar se `useConvexErrorHandler()` está sendo chamado
2. Verificar se a rota `/plano-expirado` existe
3. Verificar se o TenantContext está configurado

### Problema: Página de plano expirado não carrega

**Causa**: Tenant não encontrado ou erro na query

**Solução**:
1. Verificar se `currentTenantId` está definido
2. Verificar se a query `getCurrentTenantStatus` está funcionando
3. Verificar logs do Convex

### Problema: Avisos não aparecem

**Causa**: Status não está sendo detectado corretamente

**Solução**:
1. Verificar se `tenantStatus` está sendo retornado
2. Verificar se `isExpiringSoon` está sendo calculado corretamente
3. Verificar se o componente `ExpirationWarningBanner` está sendo renderizado

## 📊 Métricas e Monitoramento

### Logs Importantes

```typescript
// Logs que devem ser monitorados:
- "TENANT_EXPIRED: Tenant expirado em [data]"
- "TENANT_SUSPENDED: Tenant está [status]"
- Redirecionamentos para /plano-expirado
- Acessos à página de plano expirado
- Cliques em botões de contato
```

### Métricas Recomendadas

- **Tenants expirados** por dia/semana
- **Taxa de renovação** após expiração
- **Tempo médio** para renovação
- **Acessos bloqueados** por expiração
- **Conversão** de avisos para renovação

## 🔮 Funcionalidades Futuras

### Planejadas

- 📧 **Notificações por email** antes da expiração
- 🔔 **Notificações push** no navegador
- 📱 **SMS** para avisos críticos
- 💳 **Renovação online** direta na página
- 📊 **Dashboard de expirações** para administradores
- 🔄 **Renovação automática** com cartão salvo

### Melhorias

- 🎨 **Temas personalizáveis** para a página de expiração
- 🌐 **Múltiplos idiomas** para suporte internacional
- 📞 **Chat online** integrado
- 💬 **WhatsApp Business** para contato direto
- 📋 **Formulários de renovação** integrados
- 🎯 **A/B testing** para otimizar conversão
