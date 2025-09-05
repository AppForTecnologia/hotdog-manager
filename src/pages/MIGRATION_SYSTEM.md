# Sistema de Migração de Dados Legados

Este documento descreve o sistema de migração implementado para atribuir tenantId aos registros antigos que não possuem essa informação, garantindo compatibilidade com o novo modelo multi-tenant.

## 🎯 Objetivos

- ✅ **Analisar dados legados** que precisam de migração
- ✅ **Migração automática** baseada em regras temporárias
- ✅ **Exportação CSV** para migração manual
- ✅ **Monitoramento** do progresso da migração
- ✅ **Compatibilidade** com o novo modelo multi-tenant

## 🏗️ Arquitetura

### 1. Sistema de Análise (`convex/admin/migrateTenantId.ts`)

#### **Análise de Dados Legados**

```typescript
export const analyzeLegacyData = query({
  args: {},
  handler: async (ctx) => {
    // Analisa todas as coleções que precisam de tenantId
    // Retorna estatísticas detalhadas sobre registros sem tenantId
    // Inclui exemplos de registros para análise
  }
});
```

**Funcionalidades:**
- ✅ **Análise completa** de todas as coleções
- ✅ **Contagem de registros** com e sem tenantId
- ✅ **Percentual de migração** por coleção
- ✅ **Exemplos de registros** para análise
- ✅ **Identificação** de coleções que precisam migração

#### **Migração Automática**

```typescript
export const migrateLegacyData = mutation({
  args: {
    targetTenantId: v.id("tenants"),
    collections: v.array(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Migra registros legados para um tenant específico
    // Suporta modo dry run para testes
    // Retorna resultado detalhado da operação
  }
});
```

**Funcionalidades:**
- ✅ **Migração em lote** para múltiplas coleções
- ✅ **Modo dry run** para testes seguros
- ✅ **Validação** do tenant de destino
- ✅ **Tratamento de erros** robusto
- ✅ **Logs detalhados** da operação

#### **Exportação CSV**

```typescript
export const exportLegacyDataToCSV = action({
  args: {
    collections: v.array(v.string()),
    includeHeaders: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Exporta dados legados para CSV
    // Permite migração manual externa
    // Gera arquivos prontos para download
  }
});
```

**Funcionalidades:**
- ✅ **Exportação seletiva** por coleção
- ✅ **Formato CSV** padrão
- ✅ **Cabeçalhos** opcionais
- ✅ **Escape de caracteres** especiais
- ✅ **Download automático** dos arquivos

### 2. Interface de Migração (`src/pages/RootMigration.jsx`)

#### **Dashboard de Migração**

**Funcionalidades Implementadas:**
- ✅ **Status geral** da migração
- ✅ **Análise detalhada** por coleção
- ✅ **Seleção de tenant** de destino
- ✅ **Seleção de coleções** para migração
- ✅ **Execução de migração** com feedback visual
- ✅ **Exportação CSV** com download
- ✅ **Monitoramento** do progresso

**Métricas Exibidas:**
- **Total de Registros**: Número total no sistema
- **Sem TenantId**: Registros que precisam migração
- **Progresso**: Percentual de migração concluída
- **Tenants Disponíveis**: Opções para migração

#### **Análise por Coleção**

**Coleções Analisadas:**
- **categories**: Categorias de produtos
- **products**: Produtos cadastrados
- **sales**: Vendas realizadas
- **saleItems**: Itens individuais das vendas
- **cashRegister**: Registros de fechamento
- **paymentMethods**: Formas de pagamento
- **productionItems**: Controle de produção
- **productGroups**: Agrupamentos de produtos
- **saleGroups**: Agrupamentos de vendas
- **customers**: Clientes cadastrados

**Informações por Coleção:**
- Total de registros
- Registros sem tenantId
- Registros com tenantId
- Percentual de migração
- Exemplos de registros

## 🔄 Fluxo de Migração

### 1. Análise Inicial

```
Usuário acessa /root/migration → analyzeLegacyData executa → 
Exibe estatísticas por coleção → Identifica registros sem tenantId → 
Mostra exemplos para análise
```

### 2. Migração Automática

```
Usuário seleciona tenant e coleções → migrateLegacyData executa → 
Valida tenant de destino → Processa registros sem tenantId → 
Atualiza com tenantId → Retorna resultado detalhado
```

### 3. Exportação CSV

```
Usuário seleciona coleções → exportLegacyDataToCSV executa → 
Gera arquivos CSV → Disponibiliza para download → 
Usuário baixa arquivos para análise externa
```

### 4. Monitoramento

```
getMigrationStatus executa → Calcula progresso geral → 
Atualiza estatísticas por coleção → Exibe status atual → 
Permite acompanhar evolução da migração
```

## 🛠️ Funcionalidades Avançadas

### 1. Migração Seletiva

```typescript
export const migrateSelectiveData = mutation({
  args: {
    targetTenantId: v.id("tenants"),
    collection: v.string(),
    criteria: v.object({
      field: v.string(),
      operator: v.string(), // 'equals', 'contains', 'greaterThan', 'lessThan'
      value: v.any(),
    }),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Migra apenas registros que atendem a critérios específicos
    // Útil para migração baseada em regras de negócio
  }
});
```

**Operadores Suportados:**
- **equals**: Valor exato
- **contains**: Contém texto
- **greaterThan**: Maior que valor
- **lessThan**: Menor que valor

### 2. Validação de Dados

**Validações Implementadas:**
- ✅ **Tenant de destino** existe e está ativo
- ✅ **Coleções válidas** para migração
- ✅ **Registros sem tenantId** encontrados
- ✅ **Permissões** do usuário
- ✅ **Integridade** dos dados

### 3. Tratamento de Erros

**Tipos de Erro Tratados:**
- **Tenant não encontrado**: Validação de destino
- **Coleção inválida**: Verificação de coleções
- **Erro de atualização**: Falha individual
- **Permissão negada**: Controle de acesso
- **Dados corrompidos**: Validação de integridade

## 📊 Monitoramento e Relatórios

### 1. Status da Migração

```typescript
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    // Retorna status completo da migração
    // Inclui progresso por coleção
    // Calcula métricas gerais
  }
});
```

**Métricas Coletadas:**
- **Progresso geral**: Percentual de migração
- **Por coleção**: Status individual
- **Registros migrados**: Contadores atualizados
- **Registros restantes**: Pendentes de migração
- **Timestamp**: Última verificação

### 2. Relatórios de Execução

**Informações Incluídas:**
- Tenant de destino
- Coleções processadas
- Registros encontrados
- Registros atualizados
- Erros encontrados
- Tempo de execução
- Modo de execução (dry run/real)

### 3. Logs Detalhados

**Logs Gerados:**
- Início da migração
- Processamento por coleção
- Erros individuais
- Resultado final
- Timestamp de execução

## 🔧 Configuração e Uso

### 1. Acesso ao Sistema

**Requisitos:**
- Usuário administrador root
- Acesso ao painel `/root/migration`
- Permissões de escrita no banco

### 2. Processo de Migração

**Passos Recomendados:**
1. **Análise inicial**: Verificar dados legados
2. **Teste seco**: Executar dry run
3. **Migração real**: Executar migração
4. **Verificação**: Confirmar resultados
5. **Monitoramento**: Acompanhar progresso

### 3. Estratégias de Migração

**Migração Automática:**
- Ideal para dados homogêneos
- Processo rápido e eficiente
- Requer tenant de destino único

**Migração Manual (CSV):**
- Ideal para dados complexos
- Permite análise externa
- Requer processamento manual

**Migração Seletiva:**
- Ideal para regras específicas
- Baseada em critérios
- Permite migração parcial

## 🧪 Testes e Validação

### 1. Teste Dry Run

**Como executar:**
1. Selecionar tenant de destino
2. Selecionar coleções
3. Clicar em "Teste (Dry Run)"
4. Verificar resultado simulado

**Resultado esperado:**
```json
{
  "success": true,
  "dryRun": true,
  "totalProcessed": 100,
  "totalUpdated": 100,
  "collections": {
    "products": { "total": 50, "updated": 50 },
    "sales": { "total": 50, "updated": 50 }
  }
}
```

### 2. Validação de Dados

**Verificações:**
- Registros foram atualizados
- TenantId foi atribuído corretamente
- Dados não foram corrompidos
- Relacionamentos mantidos
- Índices atualizados

### 3. Teste de Integridade

**Verificações pós-migração:**
- Queries funcionam corretamente
- Filtros por tenant funcionam
- Relatórios exibem dados corretos
- Performance não degradou
- Sistema continua estável

## 🐛 Troubleshooting

### Problema: Migração falha

**Sintomas**: Erro ao executar migração

**Soluções:**
1. Verificar se tenant de destino existe
2. Verificar se coleções são válidas
3. Verificar permissões do usuário
4. Executar teste dry run primeiro
5. Verificar logs de erro

### Problema: Dados não são migrados

**Sintomas**: Migração executa mas dados não mudam

**Soluções:**
1. Verificar se há registros sem tenantId
2. Verificar se filtros estão corretos
3. Verificar se tenant de destino está ativo
4. Executar análise de dados
5. Verificar logs de execução

### Problema: CSV não é gerado

**Sintomas**: Exportação falha ou arquivo vazio

**Soluções:**
1. Verificar se há dados para exportar
2. Verificar se coleções são válidas
3. Verificar permissões de escrita
4. Verificar formato dos dados
5. Testar com coleção específica

### Problema: Performance lenta

**Sintomas**: Migração demora muito

**Soluções:**
1. Migrar coleções menores primeiro
2. Verificar índices do banco
3. Executar em horários de menor uso
4. Considerar migração em lotes
5. Monitorar recursos do sistema

## 📈 Métricas e KPIs

### 1. Métricas de Migração

**Métricas coletadas:**
- **Taxa de migração**: Percentual concluído
- **Tempo de execução**: Duração da migração
- **Taxa de sucesso**: Registros migrados com sucesso
- **Taxa de erro**: Registros com falha
- **Eficiência**: Registros por minuto

### 2. Métricas de Qualidade

**Métricas importantes:**
- **Integridade dos dados**: Dados não corrompidos
- **Consistência**: Relacionamentos mantidos
- **Completude**: Todos os registros migrados
- **Precisão**: TenantId correto atribuído
- **Validação**: Dados passam validações

### 3. Métricas de Negócio

**Métricas relevantes:**
- **Impacto no sistema**: Funcionalidades afetadas
- **Tempo de inatividade**: Sistema indisponível
- **Recuperação**: Tempo para voltar ao normal
- **Satisfação**: Feedback dos usuários
- **ROI**: Benefícios vs custos

## 🔮 Funcionalidades Futuras

### Planejadas

- 📊 **Dashboard avançado** com gráficos
- 🔄 **Migração incremental** por lotes
- 📧 **Notificações** de progresso
- 🔍 **Análise de dependências** entre dados
- 📋 **Templates de migração** reutilizáveis
- 🎯 **Migração baseada em regras** complexas

### Melhorias

- 🎨 **Interface melhorada** para migração
- 📈 **Métricas em tempo real**
- 🔧 **Configuração flexível** de regras
- 🛡️ **Backup automático** antes da migração
- 📊 **Relatórios detalhados** de execução
- 🔄 **Rollback** de migrações

## 📋 Checklist de Implementação

### Funcionalidades Básicas
- [ ] Sistema de análise implementado
- [ ] Migração automática funcionando
- [ ] Exportação CSV implementada
- [ ] Interface de migração criada
- [ ] Monitoramento de progresso

### Validações
- [ ] Validação de tenant de destino
- [ ] Validação de coleções
- [ ] Tratamento de erros robusto
- [ ] Modo dry run funcionando
- [ ] Logs detalhados gerados

### Interface
- [ ] Página de migração responsiva
- [ ] Seleção de tenant funcionando
- [ ] Seleção de coleções funcionando
- [ ] Execução com feedback visual
- [ ] Download de CSV funcionando

### Testes
- [ ] Teste dry run executado
- [ ] Migração real testada
- [ ] Exportação CSV testada
- [ ] Validação de dados confirmada
- [ ] Performance verificada

### Documentação
- [ ] Documentação completa criada
- [ ] Guia de uso implementado
- [ ] Troubleshooting documentado
- [ ] Métricas definidas
- [ ] Funcionalidades futuras planejadas
