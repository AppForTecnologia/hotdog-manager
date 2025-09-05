# Teste do Sistema de Migração de Dados Legados

Este documento descreve como testar o sistema de migração implementado na Etapa 12.

## 🧪 Cenários de Teste

### 1. Teste de Análise de Dados Legados

**Objetivo**: Verificar se a análise de dados legados funciona corretamente

**Passos**:
1. Acesse `/root/migration` no painel administrativo
2. Aguarde o carregamento da análise automática
3. Verifique as estatísticas exibidas
4. Analise os exemplos de registros

**Resultado Esperado**:
- ✅ Análise carrega automaticamente
- ✅ Estatísticas são exibidas corretamente
- ✅ Exemplos de registros são mostrados
- ✅ Percentuais de migração são calculados
- ✅ Coleções sem dados legados são identificadas

### 2. Teste de Migração Dry Run

**Objetivo**: Verificar migração simulada sem alterar dados

**Preparação**:
```typescript
// Certifique-se de que há dados legados para migrar
// Verifique se há pelo menos um tenant ativo disponível
```

**Passos**:
1. Selecione um tenant de destino
2. Selecione uma ou mais coleções
3. Clique em "Teste (Dry Run)"
4. Aguarde a execução
5. Verifique o resultado

**Resultado Esperado**:
- ✅ Migração simula sem alterar dados
- ✅ Resultado mostra quantos registros seriam migrados
- ✅ Detalhes por coleção são exibidos
- ✅ Modo "dry run" é claramente indicado
- ✅ Dados originais permanecem inalterados

### 3. Teste de Migração Real

**Objetivo**: Verificar migração real de dados legados

**Preparação**:
```typescript
// Execute primeiro um dry run para verificar o que será migrado
// Certifique-se de ter backup dos dados
// Selecione um tenant de destino válido
```

**Passos**:
1. Selecione um tenant de destino
2. Selecione uma coleção específica (comece pequeno)
3. Clique em "Migrar Dados"
4. Aguarde a execução
5. Verifique o resultado
6. Confirme que os dados foram atualizados

**Resultado Esperado**:
- ✅ Migração executa com sucesso
- ✅ Registros são atualizados com tenantId
- ✅ Resultado mostra estatísticas corretas
- ✅ Dados podem ser consultados com filtro por tenant
- ✅ Sistema continua funcionando normalmente

### 4. Teste de Exportação CSV

**Objetivo**: Verificar exportação de dados para CSV

**Passos**:
1. Selecione uma ou mais coleções
2. Clique em "Exportar para CSV"
3. Aguarde a geração dos arquivos
4. Baixe os arquivos CSV
5. Verifique o conteúdo dos arquivos

**Resultado Esperado**:
- ✅ Arquivos CSV são gerados
- ✅ Conteúdo dos arquivos está correto
- ✅ Cabeçalhos são incluídos
- ✅ Dados são formatados corretamente
- ✅ Download funciona normalmente

### 5. Teste de Validação de Tenant

**Objetivo**: Verificar validação do tenant de destino

**Passos**:
1. Tente executar migração sem selecionar tenant
2. Tente executar migração com tenant inválido
3. Verifique se erros são exibidos
4. Teste com tenant válido

**Resultado Esperado**:
- ✅ Erro é exibido quando tenant não é selecionado
- ✅ Erro é exibido quando tenant é inválido
- ✅ Migração funciona com tenant válido
- ✅ Mensagens de erro são claras
- ✅ Interface previne execução inválida

### 6. Teste de Seleção de Coleções

**Objetivo**: Verificar seleção de coleções para migração

**Passos**:
1. Selecione diferentes combinações de coleções
2. Execute dry run com diferentes seleções
3. Verifique se apenas coleções selecionadas são processadas
4. Teste com nenhuma coleção selecionada

**Resultado Esperado**:
- ✅ Apenas coleções selecionadas são processadas
- ✅ Erro é exibido quando nenhuma coleção é selecionada
- ✅ Interface permite seleção múltipla
- ✅ Estado da seleção é mantido
- ✅ Resultado reflete seleção feita

## 🔍 Verificações Técnicas

### 1. Verificar Análise de Dados

**No Console do Convex**:
```javascript
// Verificar se a análise está funcionando
// Logs devem aparecer:
// "Analisando coleção [nome]"
// "Encontrados X registros sem tenantId"
```

### 2. Verificar Migração

**No Console do Convex**:
```javascript
// Verificar se a migração está funcionando
// Logs devem aparecer:
// "Iniciando migração para tenant [id]"
// "Processando coleção [nome]"
// "Migrados X registros"
```

### 3. Verificar Banco de Dados

**No Console do Convex**:
```javascript
// Verificar se os dados foram atualizados
const recordsWithTenantId = await ctx.db
  .query("products")
  .filter((q) => q.neq(q.field("tenantId"), undefined))
  .collect();

const recordsWithoutTenantId = await ctx.db
  .query("products")
  .filter((q) => q.eq(q.field("tenantId"), undefined))
  .collect();
```

### 4. Verificar Interface

**No Console do Navegador**:
```javascript
// Verificar se a interface está funcionando
// Verificar se as queries estão sendo executadas
// Verificar se os resultados estão sendo exibidos
```

## 📋 Checklist de Testes

### Análise de Dados
- [ ] Análise carrega automaticamente
- [ ] Estatísticas são exibidas corretamente
- [ ] Exemplos de registros são mostrados
- [ ] Percentuais são calculados corretamente
- [ ] Coleções vazias são identificadas

### Migração Dry Run
- [ ] Dry run executa sem alterar dados
- [ ] Resultado mostra estatísticas corretas
- [ ] Modo dry run é claramente indicado
- [ ] Detalhes por coleção são exibidos
- [ ] Dados originais permanecem inalterados

### Migração Real
- [ ] Migração executa com sucesso
- [ ] Registros são atualizados com tenantId
- [ ] Resultado mostra estatísticas corretas
- [ ] Dados podem ser consultados com filtro
- [ ] Sistema continua funcionando

### Exportação CSV
- [ ] Arquivos CSV são gerados
- [ ] Conteúdo dos arquivos está correto
- [ ] Cabeçalhos são incluídos
- [ ] Dados são formatados corretamente
- [ ] Download funciona normalmente

### Validações
- [ ] Validação de tenant funciona
- [ ] Validação de coleções funciona
- [ ] Mensagens de erro são claras
- [ ] Interface previne execução inválida
- [ ] Tratamento de erros funciona

### Interface
- [ ] Página carrega corretamente
- [ ] Seleção de tenant funciona
- [ ] Seleção de coleções funciona
- [ ] Execução com feedback visual
- [ ] Resultados são exibidos corretamente

## 🐛 Problemas Comuns e Soluções

### Problema: Análise não carrega

**Sintomas**: Página fica em "Carregando análise..."

**Soluções**:
1. Verificar se há dados no banco
2. Verificar se as queries estão funcionando
3. Verificar se há erros no console
4. Verificar permissões do usuário
5. Recarregar a página

### Problema: Migração falha

**Sintomas**: Erro ao executar migração

**Soluções**:
1. Verificar se tenant de destino existe
2. Verificar se coleções são válidas
3. Verificar se há dados para migrar
4. Executar dry run primeiro
5. Verificar logs de erro

### Problema: CSV não é gerado

**Sintomas**: Exportação falha ou arquivo vazio

**Soluções**:
1. Verificar se há dados para exportar
2. Verificar se coleções são válidas
3. Verificar permissões de escrita
4. Verificar formato dos dados
5. Testar com coleção específica

### Problema: Dados não são migrados

**Sintomas**: Migração executa mas dados não mudam

**Soluções**:
1. Verificar se há registros sem tenantId
2. Verificar se filtros estão corretos
3. Verificar se tenant de destino está ativo
4. Executar análise de dados
5. Verificar logs de execução

### Problema: Interface não responde

**Sintomas**: Botões não funcionam ou página trava

**Soluções**:
1. Verificar se há erros no console
2. Verificar se as queries estão sendo executadas
3. Verificar se há problemas de rede
4. Recarregar a página
5. Verificar se há erros de JavaScript

## 📊 Dados de Teste

### Dados Legados (Sem TenantId)
```json
{
  "_id": "product_123",
  "name": "Produto Teste",
  "price": 10.50,
  "categoryId": "category_456",
  "isActive": true,
  "createdAt": 1700000000000,
  "updatedAt": 1700000000000
  // tenantId: undefined (ausente)
}
```

### Dados Migrados (Com TenantId)
```json
{
  "_id": "product_123",
  "name": "Produto Teste",
  "price": 10.50,
  "categoryId": "category_456",
  "isActive": true,
  "createdAt": 1700000000000,
  "updatedAt": 1703000000000,
  "tenantId": "tenant_789" // Adicionado pela migração
}
```

### Tenant de Destino
```json
{
  "_id": "tenant_789",
  "cnpj": "12345678000100",
  "companyName": "Empresa Teste",
  "status": "active",
  "plan": "basic",
  "createdAt": 1700000000000,
  "expiresAt": 1735689600000
}
```

## 🎯 Critérios de Sucesso

### Funcionais
- ✅ **Análise completa**: Todos os dados legados são identificados
- ✅ **Migração efetiva**: Registros são atualizados corretamente
- ✅ **Exportação funcional**: CSV é gerado e baixado
- ✅ **Validação robusta**: Erros são tratados adequadamente
- ✅ **Monitoramento**: Progresso é acompanhado em tempo real

### Técnicos
- ✅ **Performance adequada**: Migração executa em tempo razoável
- ✅ **Integridade dos dados**: Dados não são corrompidos
- ✅ **Consistência**: Relacionamentos são mantidos
- ✅ **Logs detalhados**: Operações são registradas
- ✅ **Tratamento de erros**: Falhas são tratadas graciosamente

### Experiência do Usuário
- ✅ **Interface intuitiva**: Página é fácil de usar
- ✅ **Feedback claro**: Resultados são exibidos adequadamente
- ✅ **Navegação fluida**: Transições são suaves
- ✅ **Responsividade**: Interface funciona em todos os dispositivos
- ✅ **Acessibilidade**: Interface é acessível para todos os usuários

## 📈 Métricas de Sucesso

### Quantitativas
- **100%** de dados legados identificados
- **> 95%** de taxa de sucesso na migração
- **< 5 minutos** de tempo de execução para coleções pequenas
- **0** perda de dados durante migração
- **100%** de arquivos CSV gerados com sucesso

### Qualitativas
- **Feedback positivo** dos administradores sobre a interface
- **Redução de trabalho manual** na migração de dados
- **Melhoria na confiabilidade** do sistema
- **Facilidade de uso** da ferramenta de migração
- **Satisfação** com o processo de migração
