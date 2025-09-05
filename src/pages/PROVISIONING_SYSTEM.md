# Sistema de Provisionamento Físico por CNPJ

Este documento descreve o sistema de provisionamento físico implementado na Etapa 13, que permite criar projetos Convex individuais para cada tenant (CNPJ), garantindo isolamento físico completo dos dados.

## 🎯 Objetivos

- ✅ **Estruturar stub** para projetos Convex por CNPJ
- ✅ **Criar scripts** de provisionamento comentados
- ✅ **Implementar cliente dinâmico** baseado em tenant
- ✅ **Sistema de feature flags** para ativação futura
- ✅ **Interface administrativa** para gerenciamento
- ✅ **Preparação** para implementação real

## 🏗️ Arquitetura

### 1. Script de Provisionamento (`scripts/provision/convex-provision-tenant.ts`)

#### **Classe Principal de Provisionamento**

```typescript
export class ConvexTenantProvisioner {
  private config: ProvisioningConfig;
  private convexClient: ConvexHttpClient;

  constructor(config: Partial<ProvisioningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.convexClient = new ConvexHttpClient(process.env.CONVEX_URL);
  }
}
```

**Funcionalidades Implementadas:**
- ✅ **Provisionamento de tenant** com projeto Convex próprio
- ✅ **Aplicação de schema** personalizado
- ✅ **Configuração de permissões** e acessos
- ✅ **Validação de tenant** para provisionamento
- ✅ **Desprovisionamento** de tenants
- ✅ **Monitoramento** de status

#### **Configuração de Provisionamento**

```typescript
interface ProvisioningConfig {
  projectPrefix: string;
  defaultRegion: string;
  defaultPlan: 'free' | 'pro' | 'enterprise';
  planConfigs: {
    free: { maxUsers: 5; maxStorage: '1GB' };
    pro: { maxUsers: 50; maxStorage: '10GB' };
    enterprise: { maxUsers: -1; maxStorage: 'unlimited' };
  };
  enablePhysicalProvisioning: boolean;
}
```

**Configurações Suportadas:**
- ✅ **Prefixo de projeto** personalizável
- ✅ **Região padrão** configurável
- ✅ **Planos** com limites específicos
- ✅ **Feature flag** para ativação
- ✅ **Configurações** por plano

#### **Métodos de Provisionamento**

```typescript
// Provisionamento principal
async provisionTenant(
  tenantId: string,
  cnpj: string,
  companyName: string,
  plan: string = 'free'
): Promise<ProvisioningResult>

// Aplicação de schema
async applyTenantSchema(tenantId: string, convexProjectId: string): Promise<boolean>

// Configuração de permissões
async configureTenantPermissions(
  tenantId: string,
  convexProjectId: string,
  users: string[]
): Promise<boolean>
```

**Funcionalidades:**
- ✅ **Provisionamento completo** de tenant
- ✅ **Aplicação automática** de schema
- ✅ **Configuração de permissões** por usuário
- ✅ **Validação** de dados e permissões
- ✅ **Tratamento de erros** robusto

### 2. Cliente Convex Dinâmico (`src/lib/convexClient.ts`)

#### **Gerenciador de Clientes Dinâmicos**

```typescript
class DynamicConvexManager {
  private currentClient: ConvexReactClient;
  private currentTenantConfig: TenantConvexConfig | null = null;
  private isConnected: boolean = false;
  private connectionError: string | null = null;
}
```

**Funcionalidades:**
- ✅ **Troca automática** de clientes Convex
- ✅ **Reconexão automática** em caso de falha
- ✅ **Monitoramento** de status de conexão
- ✅ **Cache** de configurações de tenant
- ✅ **Logs detalhados** de conexão

#### **Configuração de Tenant Convex**

```typescript
interface TenantConvexConfig {
  tenantId: string;
  cnpj: string;
  companyName: string;
  convexUrl: string;
  convexKey?: string;
  convexProjectId?: string;
  provisioningStatus: 'not_provisioned' | 'provisioning' | 'provisioned' | 'failed';
  lastUpdated: number;
}
```

**Informações Armazenadas:**
- ✅ **Identificação** do tenant
- ✅ **URL do projeto** Convex
- ✅ **Chave de acesso** (opcional)
- ✅ **Status** de provisionamento
- ✅ **Timestamp** de atualização

#### **Provider React Dinâmico**

```typescript
export function DynamicConvexProvider({ children }: { children: ReactNode }) {
  const [currentClient, setCurrentClient] = useState<ConvexReactClient>();
  const [currentTenantConfig, setCurrentTenantConfig] = useState<TenantConvexConfig | null>();
  
  return (
    <DynamicConvexContext.Provider value={contextValue}>
      {children}
    </DynamicConvexContext.Provider>
  );
}
```

**Funcionalidades:**
- ✅ **Contexto React** para clientes dinâmicos
- ✅ **Estado global** de conexão
- ✅ **Troca automática** de clientes
- ✅ **Monitoramento** em tempo real
- ✅ **Tratamento de erros** gracioso

### 3. Hooks de Gerenciamento (`src/hooks/useTenantConvex.ts`)

#### **Hook Principal de Tenant Convex**

```typescript
export function useTenantConvex() {
  const {
    currentClient,
    currentTenantConfig,
    isConnected,
    connectionError,
    switchTenant,
    reconnect
  } = useDynamicConvex();

  return {
    // Estado atual
    currentClient,
    currentTenantConfig,
    isConnected,
    connectionError,
    
    // Funcionalidades
    switchToTenant,
    reconnectClient,
    hasTenantOwnProject,
    getCurrentTenantInfo
  };
}
```

**Funcionalidades:**
- ✅ **Troca de tenant** com validação
- ✅ **Reconexão manual** e automática
- ✅ **Verificação** de projeto próprio
- ✅ **Informações** do tenant atual
- ✅ **Tratamento de erros** robusto

#### **Hook de Status de Conexão**

```typescript
export function useConvexConnectionStatus() {
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: number;
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
  }>>([]);

  return {
    isConnected,
    connectionError,
    connectionHistory,
    getConnectionStats
  };
}
```

**Funcionalidades:**
- ✅ **Histórico** de conexões
- ✅ **Estatísticas** de uptime
- ✅ **Monitoramento** de eventos
- ✅ **Análise** de performance
- ✅ **Alertas** de problemas

#### **Hook de Feature Flags**

```typescript
export function useProvisioningFeatureFlags() {
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});

  return {
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    toggleFeature,
    getAllFlags
  };
}
```

**Funcionalidades:**
- ✅ **Gerenciamento** de feature flags
- ✅ **Ativação/desativação** dinâmica
- ✅ **Persistência** de configurações
- ✅ **Validação** de flags
- ✅ **Logs** de mudanças

### 4. Interface Administrativa (`src/pages/RootProvisioning.jsx`)

#### **Dashboard de Provisionamento**

**Funcionalidades Implementadas:**
- ✅ **Status geral** do sistema
- ✅ **Feature flags** configuráveis
- ✅ **Provisionamento** de tenants
- ✅ **Monitoramento** de conexão
- ✅ **Estatísticas** detalhadas

**Métricas Exibidas:**
- **Status Convex**: Conexão atual
- **Provisionamento**: Estado da feature flag
- **Tenants**: Disponíveis para provisionamento
- **Uptime**: Estatísticas de conexão

#### **Gerenciamento de Feature Flags**

**Flags Disponíveis:**
- **Provisionamento Físico**: Habilita projetos individuais
- **Clientes Dinâmicos**: Troca automática de clientes
- **Reconexão Automática**: Reconexão em caso de falha
- **Cache de Tenant**: Armazenamento de configurações
- **Logs de Conexão**: Logs detalhados

#### **Provisionamento de Tenants**

**Processo de Provisionamento:**
1. **Seleção** de tenant
2. **Validação** de dados
3. **Criação** de projeto Convex
4. **Aplicação** de schema
5. **Configuração** de permissões
6. **Troca** para cliente do tenant

## 🔧 Sistema de Feature Flags

### 1. Flags Principais

```typescript
const PROVISIONING_FEATURE_FLAGS = {
  ENABLE_PHYSICAL_PROVISIONING: false,
  AUTO_CREATE_PROJECTS: false,
  AUTO_APPLY_SCHEMA: false,
  AUTO_CONFIGURE_PERMISSIONS: false,
  ENABLE_PROVISIONING_MONITORING: false
} as const;
```

**Flags Implementadas:**
- ✅ **Provisionamento Físico**: Habilita criação de projetos
- ✅ **Criação Automática**: Criação automática de projetos
- ✅ **Aplicação de Schema**: Schema automático
- ✅ **Configuração de Permissões**: Permissões automáticas
- ✅ **Monitoramento**: Monitoramento de provisionamento

### 2. Flags de Cliente Dinâmico

```typescript
const PROVISIONING_FEATURE_FLAGS = {
  ENABLE_DYNAMIC_CONVEX_CLIENTS: false,
  AUTO_RECONNECT: true,
  ENABLE_TENANT_CACHE: true,
  ENABLE_CONNECTION_LOGS: false
} as const;
```

**Flags de Cliente:**
- ✅ **Clientes Dinâmicos**: Troca automática de clientes
- ✅ **Reconexão Automática**: Reconexão em caso de falha
- ✅ **Cache de Tenant**: Armazenamento de configurações
- ✅ **Logs de Conexão**: Logs detalhados

### 3. Gerenciamento de Flags

**Funções Disponíveis:**
- ✅ **Verificação**: `isFeatureEnabled(flag)`
- ✅ **Ativação**: `enableFeature(flag)`
- ✅ **Desativação**: `disableFeature(flag)`
- ✅ **Alternância**: `toggleFeature(flag)`
- ✅ **Listagem**: `getAllFlags()`

## 🔄 Fluxo de Provisionamento

### 1. Análise de Requisitos

```
Usuário acessa /root/provisioning → Verifica feature flags → 
Analisa tenants disponíveis → Identifica candidatos → 
Exibe opções de provisionamento
```

### 2. Provisionamento de Tenant

```
Usuário seleciona tenant → Valida dados → 
Cria projeto Convex → Aplica schema → 
Configura permissões → Salva informações → 
Troca para cliente do tenant
```

### 3. Troca de Cliente

```
Sistema detecta mudança de tenant → 
Verifica se tem projeto próprio → 
Cria cliente Convex específico → 
Conecta ao projeto do tenant → 
Atualiza contexto global
```

### 4. Monitoramento

```
Sistema monitora conexões → 
Registra eventos de conexão → 
Calcula estatísticas de uptime → 
Detecta problemas → 
Executa reconexão automática
```

## 🛠️ Funcionalidades Avançadas

### 1. Validação de Tenant

```typescript
async validateTenantForProvisioning(tenantId: string): Promise<{
  canProvision: boolean;
  reasons: string[];
}> {
  // Verifica se tenant existe
  // Verifica se já foi provisionado
  // Verifica se está ativo
  // Verifica limites do plano
}
```

**Validações Implementadas:**
- ✅ **Existência** do tenant
- ✅ **Status** de provisionamento
- ✅ **Atividade** do tenant
- ✅ **Limites** do plano
- ✅ **Permissões** do usuário

### 2. Geração de Nomes de Projeto

```typescript
generateProjectName(cnpj: string, companyName: string): string {
  const cleanCnpj = cnpj.replace(/[^0-9]/g, '');
  const cleanCompanyName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 20);
  
  return `${this.config.projectPrefix}-${cleanCnpj}-${cleanCompanyName}`;
}
```

**Funcionalidades:**
- ✅ **Limpeza** de CNPJ
- ✅ **Normalização** de nome da empresa
- ✅ **Geração** de nome único
- ✅ **Validação** de formato
- ✅ **Prevenção** de conflitos

### 3. Tratamento de Erros

**Tipos de Erro Tratados:**
- **Tenant não encontrado**: Validação de existência
- **Projeto já existe**: Verificação de duplicação
- **Falha de conexão**: Reconexão automática
- **Permissão negada**: Controle de acesso
- **Dados inválidos**: Validação de entrada

### 4. Logs e Monitoramento

**Logs Gerados:**
- Início do provisionamento
- Criação de projeto
- Aplicação de schema
- Configuração de permissões
- Troca de cliente
- Erros e falhas

## 📊 Monitoramento e Relatórios

### 1. Status de Provisionamento

```typescript
interface TenantProvisioningStatus {
  tenantId: string;
  cnpj: string;
  companyName: string;
  status: 'not_provisioned' | 'provisioning' | 'provisioned' | 'failed';
  convexProjectId?: string;
  convexUrl?: string;
  lastProvisioningAttempt?: number;
  error?: string;
}
```

**Informações Coletadas:**
- **Status** de provisionamento
- **Projeto Convex** associado
- **URL** do projeto
- **Última tentativa** de provisionamento
- **Erros** encontrados

### 2. Estatísticas de Conexão

**Métricas Coletadas:**
- **Total de eventos** de conexão
- **Conexões bem-sucedidas**
- **Erros de conexão**
- **Desconexões**
- **Uptime** percentual

### 3. Relatórios de Execução

**Informações Incluídas:**
- Tenant provisionado
- Projeto Convex criado
- Schema aplicado
- Permissões configuradas
- Tempo de execução
- Erros encontrados

## 🔧 Configuração e Uso

### 1. Acesso ao Sistema

**Requisitos:**
- Usuário administrador root
- Acesso ao painel `/root/provisioning`
- Permissões de escrita no banco
- Feature flags habilitadas

### 2. Processo de Provisionamento

**Passos Recomendados:**
1. **Habilitar** feature flags necessárias
2. **Selecionar** tenant para provisionamento
3. **Validar** dados do tenant
4. **Executar** provisionamento
5. **Verificar** resultado
6. **Testar** conexão com novo cliente

### 3. Estratégias de Provisionamento

**Provisionamento Automático:**
- Ideal para novos tenants
- Processo rápido e eficiente
- Requer validação prévia

**Provisionamento Manual:**
- Ideal para tenants complexos
- Permite configuração personalizada
- Requer intervenção manual

**Provisionamento Seletivo:**
- Ideal para migração gradual
- Baseado em critérios específicos
- Permite teste controlado

## 🧪 Testes e Validação

### 1. Teste de Feature Flags

**Como testar:**
1. Acesse `/root/provisioning`
2. Verifique status das flags
3. Habilite/desabilite flags
4. Verifique comportamento do sistema
5. Confirme persistência das configurações

### 2. Teste de Provisionamento

**Como testar:**
1. Selecione um tenant
2. Execute provisionamento
3. Verifique criação do projeto
4. Teste troca de cliente
5. Confirme funcionamento

### 3. Teste de Cliente Dinâmico

**Como testar:**
1. Provisione um tenant
2. Troque para o tenant
3. Verifique conexão
4. Teste funcionalidades
5. Confirme isolamento de dados

## 🐛 Troubleshooting

### Problema: Provisionamento falha

**Sintomas**: Erro ao executar provisionamento

**Soluções:**
1. Verificar se feature flags estão habilitadas
2. Verificar se tenant é válido
3. Verificar permissões do usuário
4. Verificar logs de erro
5. Testar com tenant diferente

### Problema: Cliente não troca

**Sintomas**: Cliente não muda para tenant específico

**Soluções:**
1. Verificar se tenant foi provisionado
2. Verificar configuração do tenant
3. Verificar feature flags de cliente dinâmico
4. Verificar logs de conexão
5. Tentar reconexão manual

### Problema: Conexão instável

**Sintomas**: Conexão falha frequentemente

**Soluções:**
1. Verificar configuração de rede
2. Verificar status do projeto Convex
3. Verificar logs de conexão
4. Habilitar reconexão automática
5. Verificar recursos do sistema

## 📈 Métricas e KPIs

### 1. Métricas de Provisionamento

**Métricas coletadas:**
- **Taxa de sucesso**: Provisionamentos bem-sucedidos
- **Tempo de execução**: Duração do provisionamento
- **Taxa de erro**: Falhas no provisionamento
- **Eficiência**: Provisionamentos por hora
- **Qualidade**: Dados provisionados corretamente

### 2. Métricas de Conexão

**Métricas importantes:**
- **Uptime**: Tempo de conexão estável
- **Latência**: Tempo de resposta
- **Taxa de erro**: Falhas de conexão
- **Reconexões**: Tentativas de reconexão
- **Performance**: Throughput de dados

### 3. Métricas de Negócio

**Métricas relevantes:**
- **Tenants provisionados**: Número total
- **Isolamento de dados**: Eficácia do isolamento
- **Satisfação**: Feedback dos usuários
- **ROI**: Benefícios vs custos
- **Escalabilidade**: Capacidade de crescimento

## 🔮 Funcionalidades Futuras

### Planejadas

- 📊 **Dashboard avançado** com gráficos em tempo real
- 🔄 **Provisionamento incremental** por lotes
- 📧 **Notificações** de status de provisionamento
- 🔍 **Análise de dependências** entre tenants
- 📋 **Templates de provisionamento** reutilizáveis
- 🎯 **Provisionamento baseado em regras** complexas

### Melhorias

- 🎨 **Interface melhorada** para provisionamento
- 📈 **Métricas em tempo real**
- 🔧 **Configuração flexível** de regras
- 🛡️ **Backup automático** antes do provisionamento
- 📊 **Relatórios detalhados** de execução
- 🔄 **Rollback** de provisionamentos

## 📋 Checklist de Implementação

### Funcionalidades Básicas
- [ ] Script de provisionamento implementado
- [ ] Cliente dinâmico funcionando
- [ ] Feature flags implementadas
- [ ] Interface de provisionamento criada
- [ ] Hooks de gerenciamento implementados

### Validações
- [ ] Validação de tenant funciona
- [ ] Validação de feature flags funciona
- [ ] Tratamento de erros robusto
- [ ] Logs detalhados gerados
- [ ] Monitoramento de conexão

### Interface
- [ ] Página de provisionamento responsiva
- [ ] Gerenciamento de feature flags funcionando
- [ ] Provisionamento com feedback visual
- [ ] Estatísticas de conexão exibidas
- [ ] Resultados são exibidos corretamente

### Testes
- [ ] Teste de feature flags executado
- [ ] Teste de provisionamento executado
- [ ] Teste de cliente dinâmico executado
- [ ] Validação de dados confirmada
- [ ] Performance verificada

### Documentação
- [ ] Documentação completa criada
- [ ] Guia de uso implementado
- [ ] Troubleshooting documentado
- [ ] Métricas definidas
- [ ] Funcionalidades futuras planejadas
