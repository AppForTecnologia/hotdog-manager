# 🚀 Deploy no Vercel - HotDog App

## 📋 Pré-requisitos

1. **Conta no Vercel**: [vercel.com](https://vercel.com)
2. **Conta no Convex**: [convex.dev](https://convex.dev)
3. **Conta no Clerk**: [clerk.com](https://clerk.com)
4. **GitHub/GitLab/Bitbucket** para conectar o repositório

## 🔧 Configuração do Projeto

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no Vercel:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_sua_chave_aqui
VITE_CLERK_SECRET_KEY=sk_live_sua_chave_aqui

# Convex Database
VITE_CONVEX_URL=https://sua_url_convex_producao_aqui

# Environment
NODE_ENV=production
```

### 2. Configuração do Convex

1. Faça login no Convex: `npx convex login`
2. Crie um novo projeto: `npx convex dev --create-project`
3. Configure as variáveis de ambiente no Convex Dashboard
4. Deploy das funções: `npx convex deploy`

### 3. Configuração do Clerk

1. Acesse o [Clerk Dashboard](https://dashboard.clerk.com)
2. Crie um novo projeto ou use um existente
3. Configure as URLs permitidas:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://seu-dominio.vercel.app`

## 🚀 Deploy no Vercel

### Opção 1: Deploy via Dashboard (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

### Opção 2: Deploy via CLI

1. Instale o Vercel CLI:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

## ⚙️ Configurações Específicas

### Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables
- Todas as variáveis devem começar com `VITE_` para serem acessíveis no frontend
- Configure tanto para `Production` quanto para `Preview`

## 🔍 Verificação Pós-Deploy

1. **Teste de Funcionalidades**:
   - Autenticação com Clerk
   - Conexão com Convex
   - Funcionalidades principais do app

2. **Verificação de Performance**:
   - Lighthouse Score
   - Core Web Vitals
   - Tempo de carregamento

3. **Logs e Monitoramento**:
   - Vercel Analytics
   - Convex Dashboard
   - Clerk Dashboard

## 🐛 Troubleshooting Comum

### Erro de Build
- Verifique se todas as dependências estão instaladas
- Confirme se as variáveis de ambiente estão configuradas
- Verifique os logs de build no Vercel

### Erro de Runtime
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o Convex está funcionando
- Verifique se o Clerk está configurado corretamente

### Problemas de CORS
- Configure as URLs permitidas no Clerk
- Verifique as configurações do Convex

## 📱 Domínio Personalizado (Opcional)

1. No Vercel Dashboard, vá para "Settings" > "Domains"
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruído
4. Configure o domínio no Clerk e Convex

## 🔄 Deploy Automático

O Vercel fará deploy automático sempre que você fizer push para:
- `main` branch → Production
- Outras branches → Preview

## 📞 Suporte

- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Convex**: [convex.dev/docs](https://convex.dev/docs)
- **Clerk**: [clerk.com/docs](https://clerk.com/docs)

---

**🎯 Dica**: Sempre teste em Preview antes de fazer deploy para Production!

