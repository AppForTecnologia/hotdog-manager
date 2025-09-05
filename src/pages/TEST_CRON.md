# Teste do Sistema de Cron Jobs

Este documento descreve como testar o sistema de cron jobs implementado na Etapa 11.

## 🧪 Cenários de Teste

### 1. Teste de Configuração do Cron

**Objetivo**: Verificar se o cron está configurado corretamente

**Passos**:
1. Verificar se o arquivo `convex/crons.ts` existe
2. Verificar se as funções estão exportadas corretamente
3. Verificar se os horários estão configurados
4. Verificar se não há erros de sintaxe

**Resultado Esperado**:
- ✅ Arquivo `convex/crons.ts` existe e está configurado
- ✅ Cron diário configurado para 03:00 UTC
- ✅ Função `markExpired` está sendo chamada
- ✅ Nenhum erro de linting ou compilação

### 2. Teste da Função markExpired

**Objetivo**: Verificar se a função marca tenants expirados corretamente

**Preparação**:
```typescript
// Criar tenant expirado para teste
const expiredTenant = {
  status: "active",
  expiresAt: Date.now() - (24 * 60 * 60 * 1000), // 1 dia atrás
  companyName: "Empresa Teste Expirada",
  cnpj: "12345678000100"
};
```

**Passos**:
1. Executar teste manual no painel `/root/cron`
2. Verificar se o tenant foi marcado como "expired"
3. Verificar se memberships foram desativados
4. Verificar logs de execução

**Resultado Esperado**:
- ✅ Tenant marcado como "expired"
- ✅ Memberships desativados
- ✅ Logs de execução gerados
- ✅ Resultado retornado com sucesso

### 3. Teste de Tenants Ativos (Não Afetados)

**Objetivo**: Verificar se tenants ativos não são afetados

**Preparação**:
```typescript
// Criar tenant ativo para teste
const activeTenant = {
  status: "active",
  expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 dias no futuro
  companyName: "Empresa Teste Ativa",
  cnpj: "12345678000101"
};
```

**Passos**:
1. Executar teste manual
2. Verificar se o tenant permanece "active"
3. Verificar se memberships permanecem ativos
4. Verificar logs de execução

**Resultado Esperado**:
- ✅ Tenant permanece "active"
- ✅ Memberships permanecem ativos
- ✅ Nenhuma alteração nos dados
- ✅ Logs indicam que não foi processado

### 4. Teste de Tenants Suspensos (Não Afetados)

**Objetivo**: Verificar se tenants suspensos não são afetados

**Preparação**:
```typescript
// Criar tenant suspenso para teste
const suspendedTenant = {
  status: "suspended",
  expiresAt: Date.now() - (24 * 60 * 60 * 1000), // 1 dia atrás
  companyName: "Empresa Teste Suspensa",
  cnpj: "12345678000102"
};
```

**Passos**:
1. Executar teste manual
2. Verificar se o tenant permanece "suspended"
3. Verificar se memberships não são afetados
4. Verificar logs de execução

**Resultado Esperado**:
- ✅ Tenant permanece "suspended"
- ✅ Memberships não são afetados
- ✅ Nenhuma alteração nos dados
- ✅ Logs indicam que não foi processado

### 5. Teste de Múltiplos Tenants

**Objetivo**: Verificar processamento de múltiplos tenants

**Preparação**:
```typescript
// Criar múltiplos tenants expirados
const expiredTenants = [
  { status: "active", expiresAt: Date.now() - (1 * 24 * 60 * 60 * 1000), companyName: "Empresa 1" },
  { status: "active", expiresAt: Date.now() - (2 * 24 * 60 * 60 * 1000), companyName: "Empresa 2" },
  { status: "active", expiresAt: Date.now() - (3 * 24 * 60 * 60 * 1000), companyName: "Empresa 3" }
];
```

**Passos**:
1. Executar teste manual
2. Verificar se todos foram marcados como "expired"
3. Verificar se todos os memberships foram desativados
4. Verificar logs de execução

**Resultado Esperado**:
- ✅ Todos os tenants marcados como "expired"
- ✅ Todos os memberships desativados
- ✅ Logs indicam processamento de todos
- ✅ Resultado retornado com sucesso

### 6. Teste de Erro na Execução

**Objetivo**: Verificar tratamento de erros

**Preparação**:
```typescript
// Simular erro na execução (ex: tenant com dados inválidos)
const problematicTenant = {
  status: "active",
  expiresAt: Date.now() - (24 * 60 * 60 * 1000),
  companyName: null, // Dado inválido
  cnpj: "12345678000103"
};
```

**Passos**:
1. Executar teste manual
2. Verificar se o erro foi tratado
3. Verificar se outros tenants foram processados
4. Verificar logs de erro

**Resultado Esperado**:
- ✅ Erro tratado sem interromper execução
- ✅ Outros tenants processados normalmente
- ✅ Logs de erro gerados
- ✅ Resultado retornado com informações de erro

## 🔍 Verificações Técnicas

### 1. Verificar Configuração do Cron

**No Console do Convex**:
```javascript
// Verificar se o cron está registrado
// Logs devem aparecer:
// "Cron job 'mark expired tenants' scheduled for daily execution at 03:00 UTC"
```

### 2. Verificar Função markExpired

**No Console do Convex**:
```javascript
// Verificar se a função está funcionando
// Logs devem aparecer:
// "[CRON] Encontrados X tenants expirados"
// "[CRON] Tenant [nome] ([cnpj]) marcado como expirado"
// "[CRON] X memberships desativados para tenant [nome]"
```

### 3. Verificar Teste Manual

**No Painel de Monitoramento**:
```javascript
// Verificar se o teste manual funciona
// Resultado deve incluir:
// {
//   success: true,
//   result: {
//     totalExpired: X,
//     markedCount: X,
//     errors: null
//   }
// }
```

### 4. Verificar Banco de Dados

**No Console do Convex**:
```javascript
// Verificar se os dados foram atualizados
const expiredTenants = await ctx.db
  .query("tenants")
  .withIndex("byStatus", (q) => q.eq("status", "expired"))
  .collect();

const inactiveMemberships = await ctx.db
  .query("memberships")
  .withIndex("byStatus", (q) => q.eq("status", "inactive"))
  .collect();
```

## 📋 Checklist de Testes

### Configuração
- [ ] Arquivo `convex/crons.ts` existe
- [ ] Cron diário configurado para 03:00 UTC
- [ ] Função `markExpired` exportada
- [ ] Nenhum erro de compilação
- [ ] Navegação no painel root funciona

### Funcionalidade
- [ ] Teste manual executa com sucesso
- [ ] Tenants expirados são marcados
- [ ] Memberships são desativados
- [ ] Tenants ativos não são afetados
- [ ] Tenants suspensos não são afetados

### Monitoramento
- [ ] Página de monitoramento carrega
- [ ] Estatísticas são exibidas
- [ ] Status do cron é mostrado
- [ ] Próxima execução é calculada
- [ ] Logs de execução são exibidos

### Tratamento de Erros
- [ ] Erros são tratados sem interromper execução
- [ ] Logs de erro são gerados
- [ ] Resultado inclui informações de erro
- [ ] Outros tenants são processados normalmente
- [ ] Sistema continua funcionando após erro

### Performance
- [ ] Execução completa em tempo razoável
- [ ] Não há timeout na execução
- [ ] Logs são gerados eficientemente
- [ ] Banco de dados não é sobrecarregado
- [ ] Sistema responde normalmente durante execução

## 🐛 Problemas Comuns e Soluções

### Problema: Cron não executa

**Sintomas**: Tenants expirados não são marcados automaticamente

**Soluções**:
1. Verificar se `convex/crons.ts` está configurado corretamente
2. Verificar se a função `markExpired` existe e funciona
3. Verificar logs do Convex para erros
4. Executar teste manual para verificar funcionamento

### Problema: Teste manual falha

**Sintomas**: Botão de teste manual não funciona ou retorna erro

**Soluções**:
1. Verificar se a função `testMarkExpired` está implementada
2. Verificar se há erros de permissão
3. Verificar se o banco de dados está acessível
4. Verificar logs de erro no console

### Problema: Tenants não são marcados

**Sintomas**: Tenants expirados permanecem com status "active"

**Soluções**:
1. Verificar se `expiresAt` está correto
2. Verificar se o filtro de busca está funcionando
3. Verificar se há erros na mutation `markExpired`
4. Verificar se os índices do banco estão corretos

### Problema: Memberships não são desativados

**Sintomas**: Tenants são marcados como expirados mas memberships permanecem ativos

**Soluções**:
1. Verificar se a query de memberships está funcionando
2. Verificar se o índice `byTenant` existe
3. Verificar se há erros na atualização de memberships
4. Verificar se os dados de membership estão corretos

### Problema: Performance lenta

**Sintomas**: Teste manual demora muito para executar

**Soluções**:
1. Verificar quantidade de tenants no sistema
2. Verificar se os índices estão otimizados
3. Verificar se há problemas de rede
4. Considerar processamento em lotes

## 📊 Dados de Teste

### Tenant Expirado (Deve ser marcado)
```json
{
  "status": "active",
  "expiresAt": 1700000000000, // Data no passado
  "companyName": "Empresa Teste Expirada",
  "cnpj": "12345678000100",
  "plan": "basic"
}
```

### Tenant Ativo (Não deve ser afetado)
```json
{
  "status": "active",
  "expiresAt": 1735689600000, // Data no futuro
  "companyName": "Empresa Teste Ativa",
  "cnpj": "12345678000101",
  "plan": "premium"
}
```

### Tenant Suspenso (Não deve ser afetado)
```json
{
  "status": "suspended",
  "expiresAt": 1700000000000, // Data no passado
  "companyName": "Empresa Teste Suspensa",
  "cnpj": "12345678000102",
  "plan": "enterprise"
}
```

### Membership Ativo (Deve ser desativado)
```json
{
  "tenantId": "tenant_id_expirado",
  "userId": "user_id",
  "role": "admin",
  "status": "active",
  "accessCount": 10
}
```

## 🎯 Critérios de Sucesso

### Funcionais
- ✅ **Cron configurado**: Executa diariamente às 03:00 UTC
- ✅ **Marcação efetiva**: Tenants expirados são marcados corretamente
- ✅ **Desativação de memberships**: Memberships são desativados
- ✅ **Não afeta ativos**: Tenants ativos não são afetados
- ✅ **Tratamento de erros**: Erros são tratados sem interromper execução

### Técnicos
- ✅ **Configuração correta**: Arquivo de cron configurado
- ✅ **Função implementada**: `markExpired` funciona corretamente
- ✅ **Logs gerados**: Logs de execução são gerados
- ✅ **Teste manual**: Teste manual funciona
- ✅ **Monitoramento**: Página de monitoramento funciona

### Experiência do Usuário
- ✅ **Interface clara**: Página de monitoramento é intuitiva
- ✅ **Informações completas**: Estatísticas são exibidas
- ✅ **Feedback visual**: Resultados de testes são claros
- ✅ **Navegação fácil**: Acesso através do painel root
- ✅ **Responsividade**: Interface funciona em todos os dispositivos

## 📈 Métricas de Sucesso

### Quantitativas
- **100%** de tenants expirados marcados corretamente
- **0%** de tenants ativos afetados incorretamente
- **< 5 minutos** de tempo de execução
- **> 95%** de taxa de sucesso na execução
- **0** erros críticos na execução

### Qualitativas
- **Feedback positivo** dos administradores sobre monitoramento
- **Redução de trabalho manual** na marcação de expirados
- **Melhoria na confiabilidade** do sistema
- **Aumento na automação** de processos
- **Facilidade de debugging** com logs detalhados
