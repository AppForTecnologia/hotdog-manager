# 🌭 HotDog Manager

Sistema completo de gerenciamento para lanchonetes e food trucks, desenvolvido com React, Vite e Convex.

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: Tailwind CSS + Radix UI
- **Backend**: Convex (Database + Functions)
- **Autenticação**: Clerk
- **Animações**: Framer Motion

## 📋 Funcionalidades

- ✅ **Dashboard** - Visão geral do negócio
- ✅ **Produtos** - Cadastro e gerenciamento
- ✅ **Categorias** - Organização de produtos
- ✅ **Vendas** - Sistema de pedidos
- ✅ **Pagamentos** - Processamento com múltiplas formas
- ✅ **Relatórios** - Análise de desempenho
- ✅ **Produção** - Controle de pedidos
- ✅ **Caixa** - Gestão financeira

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/hotdog-manager.git
cd hotdog-manager
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
VITE_CLERK_SECRET_KEY=sk_test_sua_chave_aqui

# Convex Database
VITE_CONVEX_URL=https://sua_url_convex_aqui

# Environment
NODE_ENV=development
```

4. Configure o Convex:
```bash
npx convex dev
```

5. Execute o projeto:
```bash
npm run dev
```

## 🔑 Obter as Chaves

### Clerk (Autenticação)
1. Acesse [clerk.com](https://clerk.com)
2. Crie uma conta e um novo projeto
3. Copie as chaves para o `.env`

### Convex (Banco de Dados)
1. Execute `npx convex dev`
2. Faça login e crie um projeto
3. Copie a URL para o `.env`

## 📝 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview da build

## 🎨 Estrutura do Projeto

```
hotdog-manager/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── lib/           # Utilitários e configurações
│   └── styles/        # Estilos globais
├── convex/            # Backend (database + functions)
│   ├── schema.ts      # Estrutura do banco
│   ├── products.ts    # Funções de produtos
│   ├── sales.ts       # Funções de vendas
│   └── ...
└── public/            # Arquivos públicos
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Seu Nome - [@seu_usuario](https://github.com/seu_usuario)

---

⭐ Se este projeto te ajudou, considere dar uma estrela!