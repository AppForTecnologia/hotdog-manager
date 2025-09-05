# Teste do Sistema de Bloqueio por Expiração

Este documento descreve como testar o sistema de bloqueio por expiração implementado na Etapa 10.

## 🧪 Cenários de Teste

### 1. Teste de Tenant Ativo (Funcionamento Normal)

**Objetivo**: Verificar que tenants ativos funcionam normalmente

**Passos**:
1. Acesse o sistema com um tenant ativo
2. Navegue pelas páginas normalmente
3. Execute operações (criar produto, venda, etc.)
4. Verifique que não há avisos de expiração

**Resultado Esperado**:
- ✅ Acesso liberado a todas as funcionalidades
- ✅ Nenhum aviso de expiração
- ✅ Operações funcionam normalmente
- ✅ Status do tenant mostra "ativo"

### 2. Teste de Tenant Expirado

**Objetivo**: Verificar bloqueio de tenant expirado

**Preparação**:
```typescript
// No painel root (/root/tenants), altere a data de expiração para ontem:
// expiresAt: Date.now() - (24 * 60 * 60 * 1000) // 1 dia atrás
```

**Passos**:
1. Acesse o sistema com o tenant expirado
2. Tente navegar para qualquer página
3. Tente executar qualquer operação

**Resultado Esperado**:
- ✅ Redirecionamento automático para `/plano-expirado`
- ✅ Página exibe "Plano Expirado" com ícone vermelho
- ✅ Informações do tenant são exibidas corretamente
- ✅ Botões de ação estão disponíveis (contato, trocar tenant)
- ✅ Impossível acessar dados do sistema

### 3. Teste de Tenant Suspenso

**Objetivo**: Verificar bloqueio de tenant suspenso

**Preparação**:
```typescript
// No painel root (/root/tenants), altere o status para "suspended":
// status: "suspended"
```

**Passos**:
1. Acesse o sistema com o tenant suspenso
2. Tente navegar para qualquer página
3. Tente executar qualquer operação

**Resultado Esperado**:
- ✅ Redirecionamento automático para `/plano-expirado`
- ✅ Página exibe "Plano Suspenso" com ícone amarelo
- ✅ Informações do tenant são exibidas corretamente
- ✅ Botões de ação estão disponíveis
- ✅ Impossível acessar dados do sistema

### 4. Teste de Tenant Expirando em Breve

**Objetivo**: Verificar avisos para tenant próximo do vencimento

**Preparação**:
```typescript
// No painel root (/root/tenants), altere a data de expiração para 3 dias:
// expiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 dias no futuro
```

**Passos**:
1. Acesse o sistema com o tenant expirando
2. Navegue pelas páginas
3. Verifique se há avisos de expiração

**Resultado Esperado**:
- ✅ Banner laranja aparece no topo das páginas
- ✅ Texto: "Seu plano expira em 3 dias!"
- ✅ Link para renovação está disponível
- ✅ Acesso às funcionalidades ainda liberado
- ✅ Indicador de status mostra "Expirando"

### 5. Teste de Interceptação de Erros

**Objetivo**: Verificar que erros do Convex são interceptados

**Passos**:
1. Abra o console do navegador (F12)
2. Execute uma operação que gere erro TENANT_EXPIRED
3. Verifique se o erro é capturado e redireciona

**Resultado Esperado**:
- ✅ Erro aparece no console com prefixo "TENANT_EXPIRED"
- ✅ Redirecionamento automático para `/plano-expirado`
- ✅ Não há crash da aplicação

### 6. Teste de Troca de Tenant

**Objetivo**: Verificar funcionalidade de trocar tenant

**Passos**:
1. Na página `/plano-expirado`, clique em "Trocar de Empresa"
2. Verifique se volta para a seleção de tenant
3. Selecione um tenant ativo
4. Verifique se o acesso é liberado

**Resultado Esperado**:
- ✅ Redirecionamento para página inicial
- ✅ Modal de seleção de tenant aparece
- ✅ Seleção de tenant ativo funciona normalmente
- ✅ Acesso às funcionalidades é liberado

### 7. Teste de Contato por Email

**Objetivo**: Verificar funcionalidade de contato

**Passos**:
1. Na página `/plano-expirado`, clique em "Entrar em Contato"
2. Verifique se o email é aberto com dados preenchidos
3. Verifique se as informações do tenant estão corretas

**Resultado Esperado**:
- ✅ Cliente de email abre automaticamente
- ✅ Assunto: "Renovação de Plano - HotDog Manager"
- ✅ Corpo do email contém dados do tenant
- ✅ Email de destino: suporte@appfortecnologia.com

## 🔍 Verificações Técnicas

### 1. Verificar withTenantAuth

**No Console do Convex**:
```javascript
// Verificar se a função está bloqueando corretamente
// Logs devem aparecer:
// "TENANT_EXPIRED: Tenant expirado em [data]"
// "TENANT_SUSPENDED: Tenant está [status]"
```

### 2. Verificar Queries

**No Console do Navegador**:
```javascript
// Verificar se as queries estão funcionando:
console.log('Tenant Status:', tenantStatus);
console.log('Is Expired:', isExpired);
console.log('Days Until Expiry:', daysUntilExpiry);
```

### 3. Verificar Redirecionamentos

**No Console do Navegador**:
```javascript
// Verificar se os redirecionamentos estão funcionando:
// Deve aparecer no console:
// "Redirecionando para /plano-expirado devido a: TENANT_EXPIRED"
```

### 4. Verificar TenantContext

**No Console do Navegador**:
```javascript
// Verificar se o contexto está atualizado:
const { isExpired, isSuspended, tenantStatus } = useTenant();
console.log('Context Status:', { isExpired, isSuspended, tenantStatus });
```

## 📋 Checklist de Testes

### Funcionalidades Básicas
- [ ] Tenant ativo funciona normalmente
- [ ] Tenant expirado é bloqueado
- [ ] Tenant suspenso é bloqueado
- [ ] Tenant expirando mostra avisos
- [ ] Redirecionamento automático funciona

### Interface do Usuário
- [ ] Página de plano expirado carrega corretamente
- [ ] Informações do tenant são exibidas
- [ ] Botões de ação funcionam
- [ ] Banner de aviso aparece quando necessário
- [ ] Design é responsivo (mobile/desktop)

### Integração
- [ ] TenantContext atualiza corretamente
- [ ] Hooks de expiração funcionam
- [ ] Componentes de proteção funcionam
- [ ] Interceptação de erros funciona
- [ ] Rotas são protegidas

### Casos Extremos
- [ ] Tenant não encontrado
- [ ] Usuário sem membership
- [ ] Erro de rede durante verificação
- [ ] Múltiplos tenants com status diferentes
- [ ] Troca rápida entre tenants

## 🐛 Problemas Comuns e Soluções

### Problema: Redirecionamento não funciona

**Sintomas**: Usuário fica preso em página de erro

**Soluções**:
1. Verificar se `useConvexErrorHandler()` está sendo chamado
2. Verificar se a rota `/plano-expirado` existe no App.jsx
3. Verificar se o hook está dentro do TenantProvider

### Problema: Página de plano expirado não carrega

**Sintomas**: Página em branco ou erro 404

**Soluções**:
1. Verificar se `currentTenantId` está definido
2. Verificar se a query `getCurrentTenantStatus` está funcionando
3. Verificar se o componente `PlanoExpirado` está importado

### Problema: Avisos não aparecem

**Sintomas**: Tenant expirando mas sem avisos

**Soluções**:
1. Verificar se `ExpirationWarningBanner` está sendo renderizado
2. Verificar se `tenantStatus.status === 'expiring_soon'`
3. Verificar se `daysUntilExpiry <= 7`

### Problema: Tenant ativo é bloqueado

**Sintomas**: Tenant válido mas acesso negado

**Soluções**:
1. Verificar se `tenant.status === 'active'`
2. Verificar se `tenant.expiresAt > Date.now()`
3. Verificar se `membership.status === 'active'`

## 📊 Dados de Teste

### Tenant Ativo (Válido)
```json
{
  "status": "active",
  "expiresAt": 1735689600000, // 1 ano no futuro
  "plan": "premium",
  "companyName": "Empresa Teste Ativa"
}
```

### Tenant Expirado
```json
{
  "status": "active",
  "expiresAt": 1700000000000, // Data no passado
  "plan": "basic",
  "companyName": "Empresa Teste Expirada"
}
```

### Tenant Suspenso
```json
{
  "status": "suspended",
  "expiresAt": 1735689600000, // Data no futuro
  "plan": "enterprise",
  "companyName": "Empresa Teste Suspensa"
}
```

### Tenant Expirando
```json
{
  "status": "active",
  "expiresAt": 1703000000000, // 3 dias no futuro
  "plan": "basic",
  "companyName": "Empresa Teste Expirando"
}
```

## 🎯 Critérios de Sucesso

### Funcionais
- ✅ **Bloqueio efetivo**: Tenants expirados não acessam dados
- ✅ **Redirecionamento automático**: Usuários são direcionados para página de aviso
- ✅ **Interface clara**: Página de aviso é intuitiva e informativa
- ✅ **Ações disponíveis**: Usuários podem contatar suporte ou trocar tenant
- ✅ **Avisos proativos**: Tenants próximos do vencimento recebem avisos

### Técnicos
- ✅ **Segurança no servidor**: `withTenantAuth` bloqueia efetivamente
- ✅ **Interceptação de erros**: Erros são capturados e tratados
- ✅ **Estado consistente**: TenantContext reflete status real
- ✅ **Performance**: Verificações não impactam performance
- ✅ **Responsividade**: Interface funciona em todos os dispositivos

### Experiência do Usuário
- ✅ **Clareza**: Usuário entende o problema e soluções
- ✅ **Facilidade**: Ações de contato são simples e diretas
- ✅ **Consistência**: Design mantém identidade visual do app
- ✅ **Acessibilidade**: Interface é acessível para todos os usuários
- ✅ **Feedback**: Usuário recebe feedback claro sobre ações

## 📈 Métricas de Sucesso

### Quantitativas
- **0%** de acesso a dados de tenants expirados
- **100%** de redirecionamento para página de aviso
- **< 1s** de tempo de resposta para verificação de status
- **> 90%** de taxa de cliques em botões de contato

### Qualitativas
- **Feedback positivo** dos usuários sobre clareza da interface
- **Redução de tickets** de suporte sobre acesso negado
- **Melhoria na experiência** de renovação de planos
- **Aumento na taxa** de renovação antecipada
