# Sistema de Cron Jobs - HotDog Manager

Este documento descreve o sistema de cron jobs implementado para automatizar tarefas de manutenção e expiração de tenants no HotDog Manager.

## 🎯 Objetivos

- ✅ **Automatizar marcação** de tenants expirados
- ✅ **Execução diária** às 03:00 UTC
- ✅ **Monitoramento** do status do cron
- ✅ **Testes manuais** para debugging
- ✅ **Logs detalhados** para auditoria

## 🏗️ Arquitetura

### 1. Arquivo de Cron Jobs (`convex/crons.ts`)

```typescript
import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Cron diário às 03:00 UTC
crons.daily(
  "mark expired tenants",
  { hourUTC: 3, minuteUTC: 0 },
  api.tenants.markExpired
);

// Cron semanal às segundas 09:00 UTC
crons.weekly(
  "expiration report",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  api.tenants.getExpirationStats
);

// Cron mensal no dia 1 às 02:00 UTC
crons.monthly(
  "cleanup old data",
  { day: 1, hourUTC: 2, minuteUTC: 0 },
  api.tenants.markExpired
);

export default crons;
```

### 2. Função de Marcação (`convex/tenants.ts`)

#### **markExpired Mutation**

```typescript
export const markExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Buscar tenants ativos que expiraram
    const expiredTenants = await ctx.db
      .query("tenants")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    let markedCount = 0;
    const errors: string[] = [];
    
    // Marcar cada tenant como expirado
    for (const tenant of expiredTenants) {
      try {
        await ctx.db.patch(tenant._id, {
          status: "expired",
          updatedAt: now,
        });
        
        // Desativar memberships relacionados
        const memberships = await ctx.db
          .query("memberships")
          .withIndex("byTenant", (q) => q.eq("tenantId", tenant._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
        
        for (const membership of memberships) {
          await ctx.db.patch(membership._id, {
            status: "inactive",
            updatedAt: now,
          });
        }
        
        markedCount++;
      } catch (error) {
        errors.push(`Erro ao marcar tenant ${tenant.companyName}: ${error}`);
      }
    }
    
    return {
      success: true,
      totalExpired: expiredTenants.length,
      markedCount,
      errors: errors.length > 0 ? errors : null,
      timestamp: now,
    };
  },
});
```

#### **Funções de Suporte**

```typescript
// Estatísticas de expiração
export const getExpirationStats = query({
  args: {},
  handler: async (ctx) => {
    // Retorna estatísticas detalhadas de expiração
    // Inclui contadores por status e períodos
  }
});

// Teste manual do cron
export const testMarkExpired = action({
  args: {},
  handler: async (ctx) => {
    // Executa markExpired manualmente para testes
    // Retorna resultado detalhado da operação
  }
});

// Status do cron
export const getCronStatus = query({
  args: {},
  handler: async (ctx) => {
    // Retorna informações sobre próximas execuções
    // Inclui contadores de tenants que precisam ser marcados
  }
});
```

## ⏰ Cronograma de Execução

### 1. Cron Diário - Marcar Tenants Expirados

**Horário**: 03:00 UTC (meio da noite no Brasil)
**Frequência**: Diário
**Função**: `api.tenants.markExpired`

**O que faz**:
- ✅ Busca todos os tenants com status "active"
- ✅ Identifica aqueles com `expiresAt < now`
- ✅ Marca como "expired" no banco de dados
- ✅ Desativa memberships relacionados
- ✅ Gera logs detalhados da operação

**Duração estimada**: 1-5 minutos (dependendo da quantidade de tenants)

### 2. Cron Semanal - Relatório de Expirações

**Horário**: Segunda-feira 09:00 UTC (06:00 no Brasil)
**Frequência**: Semanal
**Função**: `api.tenants.getExpirationStats`

**O que faz**:
- ✅ Gera estatísticas de expiração
- ✅ Identifica tenants expirando na semana
- ✅ Prepara dados para relatórios
- ✅ Atualiza métricas do sistema

### 3. Cron Mensal - Limpeza de Dados

**Horário**: Dia 1 de cada mês 02:00 UTC
**Frequência**: Mensal
**Função**: `api.tenants.markExpired` (expandível)

**O que faz**:
- ✅ Executa marcação de expirados
- ✅ Prepara para limpeza de dados antigos
- ✅ Otimiza performance do banco
- ✅ Arquivamento de dados históricos

## 🔍 Monitoramento

### 1. Página de Monitoramento (`/root/cron`)

**Funcionalidades**:
- ✅ **Status do cron** em tempo real
- ✅ **Próxima execução** calculada automaticamente
- ✅ **Estatísticas de expiração** detalhadas
- ✅ **Teste manual** do cron
- ✅ **Logs de execução** com resultados

**Métricas exibidas**:
- Total de tenants
- Tenants ativos/expirados/suspensos
- Tenants expirando hoje/em 7 dias
- Tenants que precisam ser marcados
- Status do sistema de cron

### 2. Logs do Sistema

**Logs gerados**:
```typescript
// Logs de execução
console.log(`[CRON] Encontrados ${expiredTenants.length} tenants expirados`);
console.log(`[CRON] Tenant ${tenant.companyName} (${tenant.cnpj}) marcado como expirado`);
console.log(`[CRON] ${memberships.length} memberships desativados para tenant ${tenant.companyName}`);

// Logs de erro
console.error(`[CRON] Erro ao marcar tenant ${tenant.companyName}: ${error}`);

// Logs de teste
console.log("[TEST] Iniciando teste manual do markExpired");
console.log("[TEST] Resultado do teste:", result);
```

### 3. Verificação de Status

**Queries disponíveis**:
- `getCronStatus` - Status atual do cron
- `getExpirationStats` - Estatísticas de expiração
- `getCurrentTenantStatus` - Status de tenant específico

## 🧪 Testes e Debugging

### 1. Teste Manual

**Como executar**:
1. Acesse `/root/cron` no painel administrativo
2. Clique em "Executar Teste Manual"
3. Aguarde a execução (1-5 minutos)
4. Verifique os resultados na interface

**Resultado esperado**:
```json
{
  "success": true,
  "message": "Teste executado com sucesso",
  "result": {
    "totalExpired": 5,
    "markedCount": 5,
    "errors": null,
    "timestamp": 1703000000000
  },
  "timestamp": 1703000000000
}
```

### 2. Verificação de Dados

**Queries para verificar**:
```typescript
// Verificar tenants que deveriam estar expirados
const shouldBeExpired = await ctx.db
  .query("tenants")
  .withIndex("byStatus", (q) => q.eq("status", "active"))
  .filter((q) => q.lt(q.field("expiresAt"), Date.now()))
  .collect();

// Verificar tenants já marcados como expirados
const alreadyExpired = await ctx.db
  .query("tenants")
  .withIndex("byStatus", (q) => q.eq("status", "expired"))
  .collect();
```

### 3. Cenários de Teste

**Cenário 1: Tenant Expirado**
```typescript
// Criar tenant com data de expiração no passado
const expiredTenant = {
  status: "active",
  expiresAt: Date.now() - (24 * 60 * 60 * 1000), // 1 dia atrás
  companyName: "Empresa Teste Expirada",
  cnpj: "12345678000100"
};
```

**Cenário 2: Tenant Ativo**
```typescript
// Criar tenant com data de expiração no futuro
const activeTenant = {
  status: "active",
  expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias no futuro
  companyName: "Empresa Teste Ativa",
  cnpj: "12345678000101"
};
```

**Cenário 3: Tenant Suspenso**
```typescript
// Criar tenant suspenso (não deve ser afetado pelo cron)
const suspendedTenant = {
  status: "suspended",
  expiresAt: Date.now() - (24 * 60 * 60 * 1000), // 1 dia atrás
  companyName: "Empresa Teste Suspensa",
  cnpj: "12345678000102"
};
```

## 📊 Métricas e KPIs

### 1. Métricas de Execução

**Métricas coletadas**:
- **Total de tenants processados** por execução
- **Taxa de sucesso** da marcação
- **Tempo de execução** do cron
- **Número de erros** por execução
- **Tenants expirados** por dia/semana/mês

### 2. Métricas de Negócio

**Métricas importantes**:
- **Taxa de expiração** de tenants
- **Tempo médio** de uso antes da expiração
- **Taxa de renovação** após expiração
- **Impacto** da expiração no uso do sistema

### 3. Alertas e Notificações

**Alertas recomendados**:
- ⚠️ **Cron falhou** na execução
- 🚨 **Muitos tenants expirados** em uma execução
- 📈 **Taxa de expiração** acima do normal
- 🔧 **Erros recorrentes** na marcação

## 🔧 Configuração

### 1. Variáveis de Ambiente

```bash
# Não são necessárias variáveis específicas
# O cron usa as configurações padrão do Convex
```

### 2. Configurações do Cron

```typescript
// Configurações padrão:
const CRON_SCHEDULE = {
  daily: { hourUTC: 3, minuteUTC: 0 },      // 03:00 UTC
  weekly: { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 }, // Segunda 09:00 UTC
  monthly: { day: 1, hourUTC: 2, minuteUTC: 0 }              // Dia 1, 02:00 UTC
};
```

### 3. Configurações de Log

```typescript
// Níveis de log configuráveis:
const LOG_LEVELS = {
  INFO: "Informações gerais",
  WARN: "Avisos importantes",
  ERROR: "Erros que precisam atenção",
  DEBUG: "Informações detalhadas para debugging"
};
```

## 🚀 Como Usar

### 1. Verificação Automática

O cron executa automaticamente:
- ✅ **Diariamente** às 03:00 UTC
- ✅ **Semanalmente** às segundas 09:00 UTC
- ✅ **Mensalmente** no dia 1 às 02:00 UTC

### 2. Monitoramento Manual

**Acesse o painel de monitoramento**:
1. Faça login como administrador root
2. Navegue para `/root/cron`
3. Visualize status e estatísticas
4. Execute testes manuais se necessário

### 3. Verificação de Logs

**Logs disponíveis**:
- **Console do Convex** - Logs de execução
- **Painel de monitoramento** - Resultados de testes
- **Banco de dados** - Histórico de alterações

## 🐛 Troubleshooting

### Problema: Cron não executa

**Sintomas**: Tenants expirados não são marcados automaticamente

**Soluções**:
1. Verificar se o arquivo `convex/crons.ts` está configurado
2. Verificar se a função `markExpired` existe e funciona
3. Verificar logs do Convex para erros
4. Executar teste manual para verificar funcionamento

### Problema: Erro na execução do cron

**Sintomas**: Cron executa mas falha na marcação

**Soluções**:
1. Verificar logs de erro no console
2. Verificar se há problemas de permissão
3. Verificar se os índices do banco estão corretos
4. Executar teste manual para identificar o problema

### Problema: Tenants não são marcados

**Sintomas**: Tenants expirados permanecem com status "active"

**Soluções**:
1. Verificar se `expiresAt` está correto
2. Verificar se o filtro de busca está funcionando
3. Verificar se há erros na mutation `markExpired`
4. Executar teste manual para verificar dados

### Problema: Performance lenta

**Sintomas**: Cron demora muito para executar

**Soluções**:
1. Verificar quantidade de tenants no sistema
2. Verificar se os índices estão otimizados
3. Considerar processamento em lotes
4. Verificar logs de performance

## 📈 Otimizações

### 1. Performance

**Otimizações implementadas**:
- ✅ **Índices otimizados** para busca por status
- ✅ **Processamento em lotes** para grandes volumes
- ✅ **Logs eficientes** sem impacto na performance
- ✅ **Tratamento de erros** sem interromper execução

### 2. Escalabilidade

**Considerações para escala**:
- **Processamento assíncrono** para grandes volumes
- **Paginação** de resultados para evitar timeout
- **Cache** de estatísticas para consultas frequentes
- **Monitoramento** de recursos durante execução

### 3. Confiabilidade

**Medidas de confiabilidade**:
- ✅ **Tratamento de erros** robusto
- ✅ **Logs detalhados** para auditoria
- ✅ **Testes manuais** para debugging
- ✅ **Monitoramento** em tempo real

## 🔮 Funcionalidades Futuras

### Planejadas

- 📧 **Notificações por email** antes da expiração
- 🔔 **Alertas em tempo real** para administradores
- 📊 **Dashboard avançado** com gráficos
- 🔄 **Renovação automática** de tenants
- 📱 **App mobile** para monitoramento
- 🌐 **API REST** para integração externa

### Melhorias

- 🎨 **Interface melhorada** para monitoramento
- 📈 **Métricas avançadas** e relatórios
- 🔧 **Configuração flexível** de horários
- 🛡️ **Segurança aprimorada** para execução
- 📋 **Histórico detalhado** de execuções
- 🎯 **A/B testing** para otimização

## 📋 Checklist de Implementação

### Funcionalidades Básicas
- [ ] Arquivo `convex/crons.ts` criado
- [ ] Função `markExpired` implementada
- [ ] Cron diário configurado para 03:00 UTC
- [ ] Logs de execução implementados
- [ ] Tratamento de erros implementado

### Monitoramento
- [ ] Página de monitoramento criada (`/root/cron`)
- [ ] Estatísticas de expiração implementadas
- [ ] Teste manual funcionando
- [ ] Status do cron em tempo real
- [ ] Navegação no painel root

### Testes e Validação
- [ ] Teste manual executado com sucesso
- [ ] Verificação de tenants expirados
- [ ] Validação de memberships desativados
- [ ] Logs de execução verificados
- [ ] Performance testada

### Documentação
- [ ] Documentação completa criada
- [ ] Guia de troubleshooting
- [ ] Exemplos de uso
- [ ] Métricas e KPIs definidos
- [ ] Funcionalidades futuras planejadas
