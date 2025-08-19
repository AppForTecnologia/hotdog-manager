# 🔧 Configuração do Projeto HotDog

## 📋 Passos para Configurar

### 1. Criar arquivo .env
Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
VITE_CLERK_SECRET_KEY=sk_test_sua_chave_aqui

# Convex Database
VITE_CONVEX_URL=https://sua_url_convex_aqui

# Environment
NODE_ENV=development
```

### 2. Obter chaves do Clerk
1. Acesse [clerk.com](https://clerk.com)
2. Faça login ou crie uma conta
3. Crie um novo projeto
4. Copie a `Publishable Key` e `Secret Key`
5. Substitua no arquivo `.env`

### 3. Obter URL do Convex
1. Execute no terminal: `npx convex dev`
2. Faça login no dashboard
3. Crie um novo projeto
4. Copie a URL fornecida
5. Substitua no arquivo `.env`

### 4. Instalar dependências
```bash
npm install
```

### 5. Executar o projeto
```bash
npm run dev
```

## ⚠️ Problemas Comuns

- **Erro "VITE_CLERK_PUBLISHABLE_KEY não está configurada"**: Verifique se o arquivo `.env` existe e está na raiz
- **Erro "VITE_CONVEX_URL não está configurada"**: Verifique se a URL do Convex está correta
- **Erro de dependências**: Execute `npm install` novamente

## 🚀 Próximos Passos

Após configurar o `.env`, o projeto deve funcionar corretamente com:
- ✅ Autenticação Clerk funcionando
- ✅ Banco de dados Convex conectado
- ✅ Todas as funcionalidades disponíveis
