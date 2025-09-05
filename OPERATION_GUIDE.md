# Guia de Operação - HotDog Manager

Este documento descreve os procedimentos operacionais para o sistema HotDog Manager em produção.

## 🚀 Setup Inicial

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone https://github.com/seu_usuario/hotdog-manager.git
cd hotdog-manager

# Instale dependências
npm install

# Configure variáveis de ambiente
cp env.example .env
# Edite o .env com suas chaves
```

### 2. Configuração do Convex

```bash
# Inicialize o Convex
npx convex dev

# Execute seed inicial
# No console do Convex:
api.seed.seed()
```

### 3. Configuração do Clerk

1. Acesse [clerk.com](https://clerk.com)
2. Crie um novo projeto
3. Configure as URLs de redirecionamento:
   - Development: `http://localhost:5173`
   - Production: `https://seu-dominio.com`
4. Copie as chaves para o `.env`

## 🏢 Gerenciamento de Tenants

### Criar Novo Tenant

```bash
# No console do Convex:
api.tenants.create({
  cnpj: "12.345.678/0001-90",
  companyName: "Nova Empresa Ltda",
  email: "contato@novaempresa.com",
  phone: "(11) 99999-9999",
  address: "Rua das Empresas, 123",
  plan: "premium",
  expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 ano
})
```

### Vincular Usuário ao Tenant

```bash
# No console do Convex:
api.memberships.create({
  tenantId: "tenant_id_aqui",
  userId: "user_id_aqui",
  role: "admin"
})
```

### Renovar Tenant

```bash
# No console do Convex:
api.tenants.renew({
  tenantId: "tenant_id_aqui",
  days: 365 // Renovar por 1 ano
})
```

## ⏰ Monitoramento de Cron Jobs

### Verificar Status dos Cron Jobs

```bash
# No console do Convex:
api.tenants.getCronStatus()
```

### Executar Cron Manualmente (Teste)

```bash
# No console do Convex:
api.tenants.testMarkExpired()
```

### Monitorar Logs

```bash
# Visualizar logs do Convex
npx convex logs

# Filtrar logs de cron
npx convex logs --filter "cron"
```

## 🔄 Migração de Dados

### Análise de Dados Legados

```bash
# No console do Convex:
api.admin.migrateTenantId.analyzeLegacyData()
```

### Migração Automática

```bash
# No console do Convex:
api.admin.migrateTenantId.migrateLegacyData({
  targetTenantId: "tenant_id_aqui",
  collections: ["products", "sales", "customers"],
  dryRun: true // Teste primeiro
})
```

### Exportação para CSV

```bash
# No console do Convex:
api.admin.migrateTenantId.exportLegacyDataToCSV({
  collections: ["products", "sales"],
  filename: "legacy_data.csv"
})
```

## 🔧 Manutenção do Sistema

### Backup de Dados

```bash
# Exportar dados do Convex
npx convex export --output backup.json

# Importar dados
npx convex import backup.json
```

### Limpeza de Dados

```bash
# Limpar dados de teste
# No console do Convex:
api.seed.clearDatabase()
```

### Atualização do Schema

```bash
# Deploy do schema atualizado
npx convex deploy

# Verificar migrações
npx convex logs --filter "migration"
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Tenant não encontrado
```bash
# Verificar se o tenant existe
api.tenants.getByCnpj({ cnpj: "12.345.678/0001-90" })

# Verificar memberships
api.memberships.getByUser({ userId: "user_id_aqui" })
```

#### 2. Acesso negado
```bash
# Verificar status do tenant
api.tenants.getCurrentTenantStatus({ tenantId: "tenant_id_aqui" })

# Verificar permissões
api.memberships.getByUser({ userId: "user_id_aqui" })
```

#### 3. Erro de autenticação
- Verificar configuração do Clerk
- Verificar URLs de redirecionamento
- Verificar chaves de API

#### 4. Dados não carregam
- Verificar se o tenantId está sendo passado
- Verificar se o usuário tem acesso ao tenant
- Verificar se o tenant não está expirado

### Logs e Debugging

```bash
# Logs do Convex
npx convex logs

# Logs do frontend (browser)
# Abra DevTools → Console

# Logs de autenticação
# Verificar logs do Clerk Dashboard
```

## 📊 Métricas e Monitoramento

### Métricas de Sistema

```bash
# No console do Convex:
api.tenants.getExpirationStats()
api.tenants.getCronStatus()
api.admin.migrateTenantId.getMigrationStatus()
```

### Painel Root Admin

- **URL**: `/root`
- **Acesso**: Apenas emails em `VITE_ROOT_ALLOWLIST`
- **Funcionalidades**:
  - Dashboard com métricas
  - Gerenciamento de tenants
  - Monitor de cron jobs
  - Ferramentas de migração
  - Provisionamento físico

## 🔒 Segurança

### Configurações de Segurança

1. **Isolamento de Dados**
   - Cada tenant possui dados separados
   - Validação de tenantId em todas as queries
   - Verificação de membership antes do acesso

2. **Autenticação**
   - Clerk com JWT e sessões seguras
   - Verificação de usuário em todas as operações
   - Logout automático em caso de erro

3. **Autorização**
   - Sistema de roles (admin, employee, master)
   - Verificação de permissões por operação
   - Controle de acesso baseado em membership

4. **Validação**
   - CNPJ validado no backend
   - Dados sanitizados antes do armazenamento
   - Verificação de tipos e formatos

### Boas Práticas

- **Nunca** commite chaves de produção
- **Sempre** use HTTPS em produção
- **Configure** CORS adequadamente
- **Monitore** logs e métricas
- **Faça** backup regular dos dados
- **Mantenha** dependências atualizadas
- **Use** variáveis de ambiente para configurações sensíveis

## 🚀 Deploy e Produção

### Deploy do Convex

```bash
# Deploy para produção
npx convex deploy --prod

# Verificar deploy
npx convex logs --prod
```

### Deploy do Frontend

```bash
# Build de produção
npm run build

# Deploy para Vercel
vercel --prod

# Ou configure CI/CD
```

### Configuração de Produção

1. **Variáveis de Ambiente**
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
   VITE_CLERK_SECRET_KEY=sk_live_sua_chave_aqui
   VITE_CONVEX_URL=https://sua_url_convex_production
   VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com
   ```

2. **URLs de Redirecionamento**
   - Configure URLs de produção no Clerk
   - Atualize CORS no Convex
   - Configure domínio personalizado

3. **Monitoramento**
   - Configure alertas de erro
   - Monitore métricas de performance
   - Configure backup automático

## 📞 Suporte

### Contato
- **Email**: appfortecnologia@gmail.com
- **Issues**: [GitHub Issues](https://github.com/seu_usuario/hotdog-manager/issues)
- **Documentação**: Consulte os arquivos de documentação

### Escalação
1. **Problemas de Sistema**: Verificar logs e métricas
2. **Problemas de Dados**: Executar migrações ou restaurações
3. **Problemas de Segurança**: Verificar configurações e permissões
4. **Problemas de Performance**: Otimizar queries e índices

---

**HotDog Manager** - Guia de Operação 🚀
