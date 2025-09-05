# Quick Start - HotDog Manager

Guia rápido para configurar e executar o HotDog Manager localmente.

## 🚀 Setup Rápido (5 minutos)

### 1. Clone e Instale
```bash
git clone https://github.com/seu_usuario/hotdog-manager.git
cd hotdog-manager
npm install
```

### 2. Configure Variáveis
```bash
cp env.example .env
```

Edite o `.env` com suas chaves:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
VITE_CLERK_SECRET_KEY=sk_test_sua_chave_aqui
VITE_CONVEX_URL=https://sua_url_convex_aqui
VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com
```

### 3. Configure Convex
```bash
npx convex dev
```

### 4. Execute Seed
No console do Convex:
```bash
api.seed.seedDev()
```

### 5. Execute o Projeto
```bash
npm run dev
```

### 6. Acesse
- **URL**: http://localhost:5173
- **Login**: `demo1@hotdogmanager.com` / `Demo123!`

## 🔑 Obter Chaves

### Clerk (Autenticação)
1. Acesse [clerk.com](https://clerk.com)
2. Crie conta e projeto
3. Copie chaves para `.env`

### Convex (Banco)
1. Execute `npx convex dev`
2. Faça login e crie projeto
3. Copie URL para `.env`

## 🧪 Testes

```bash
# Instalar navegadores
npm run test:install

# Executar testes
npm test

# Ver relatório
npm run test:report
```

## 🏢 Sistema Multi-Tenant

### Conceitos
- **Tenant**: Empresa (CNPJ)
- **Membership**: Vínculo usuário-tenant
- **Root Admin**: Acesso administrativo global

### Fluxo
1. **Login** → Clerk
2. **Modal de Vínculo** → CNPJ
3. **Seleção de Tenant** → Dados isolados
4. **Alternância** → Trocar entre tenants

### Dados de Teste
- **Tenant Ativo**: `11.222.333/0001-44`
- **Tenant Expirado**: `99.888.777/0001-66`
- **Root Admin**: `pedrinhocornetti@gmail.com`

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm test
npm run test:ui

# Convex
npx convex dev
npx convex deploy
npx convex logs
```

## 📚 Documentação

- `README.md` - Documentação completa
- `OPERATION_GUIDE.md` - Guia de operação
- `TESTING_GUIDE.md` - Guia de testes
- `src/pages/*.md` - Documentação por funcionalidade

## 🆘 Problemas Comuns

### Erro de Autenticação
- Verificar chaves do Clerk
- Verificar URLs de redirecionamento

### Tenant não Encontrado
- Executar `api.seed.seedDev()`
- Verificar CNPJ no modal

### Acesso Negado
- Verificar permissões
- Verificar expiração do tenant

### Dados não Carregam
- Verificar tenantId nas queries
- Verificar membership do usuário

## 🚀 Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Convex
```bash
npx convex deploy --prod
```

---

**HotDog Manager** - Quick Start 🚀
