# Configuração do Convex para o AppFor HotDog

Este guia explica como configurar e usar o Convex como backend para o sistema de gestão de lanchonete.

## 📋 Pré-requisitos

- Node.js instalado
- Conta no Convex (gratuita em [convex.dev](https://convex.dev))
- Projeto já configurado com React e Vite

## 🚀 Passos para Configuração

### 1. Login no Convex

```bash
npx convex login
```

### 2. Inicializar o Projeto Convex

```bash
npx convex dev --configure
```

Durante a configuração:
- Escolha um nome para o projeto (ex: "appfor-hotdog")
- Selecione a região (recomendado: us-east-1)
- Aceite as configurações padrão

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:
```bash
cp env.example .env
```

2. Edite o arquivo `.env` e adicione a URL do seu deployment:
```
VITE_CONVEX_URL=https://seu-deployment.convex.cloud
```

A URL será fornecida após executar `npx convex dev` pela primeira vez.

### 4. Executar o Backend

```bash
npm run convex:dev
```

Este comando:
- Sincroniza o schema com o banco
- Executa as funções em modo de desenvolvimento
- Fornece a URL para o frontend

### 5. Executar o Frontend

Em outro terminal:
```bash
npm run dev
```

## 📁 Estrutura de Arquivos

```
convex/
├── schema.js          # Schema do banco de dados
├── products.js        # Funções para gerenciar produtos
├── orders.js          # Funções para gerenciar pedidos
├── clients.js         # Funções para gerenciar clientes
└── _generated/        # Arquivos gerados automaticamente
```

## 🗄️ Schema do Banco de Dados

O sistema inclui as seguintes tabelas:

### Products
- `name`: Nome do produto
- `description`: Descrição detalhada
- `price`: Preço em reais
- `category`: Categoria (hotdogs, bebidas, etc.)
- `ingredients`: Lista de ingredientes
- `available`: Se está disponível
- `imageUrl`: URL da imagem
- `preparationTime`: Tempo de preparo em minutos

### Orders
- `clientId`: ID do cliente (opcional)
- `items`: Lista de itens do pedido
- `totalAmount`: Valor total
- `status`: Status do pedido (pending, preparing, ready, delivered)
- `paymentMethod`: Método de pagamento
- `paymentStatus`: Status do pagamento

### Clients
- `name`: Nome do cliente
- `email`: Email (opcional)
- `phone`: Telefone (opcional)
- `address`: Endereço (opcional)

## 🔧 Funções Disponíveis

### Produtos (`convex/products.js`)
- `getAvailableProducts()`: Busca produtos disponíveis
- `getProductsByCategory(category)`: Busca por categoria
- `getProductById(productId)`: Busca produto específico
- `createProduct(productData)`: Cria novo produto
- `updateProduct(productId, updates)`: Atualiza produto
- `deleteProduct(productId)`: Remove produto

### Pedidos (`convex/orders.js`)
- `getAllOrders()`: Lista todos os pedidos
- `getOrdersByStatus(status)`: Filtra por status
- `createOrder(orderData)`: Cria novo pedido
- `updateOrderStatus(orderId, status)`: Atualiza status
- `getTodaysOrders()`: Pedidos do dia

### Clientes (`convex/clients.js`)
- `getAllClients()`: Lista todos os clientes
- `createClient(clientData)`: Cria novo cliente
- `searchClientsByName(searchTerm)`: Busca por nome

## 💻 Como Usar no Frontend

### Exemplo Básico

```jsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function ProductsPage() {
  // Query para buscar dados
  const products = useQuery(api.products.getAvailableProducts);
  
  // Mutation para modificar dados
  const createProduct = useMutation(api.products.createProduct);
  
  const handleCreateProduct = async (productData) => {
    await createProduct(productData);
  };
  
  return (
    <div>
      {products?.map(product => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Hooks Disponíveis

- `useQuery()`: Para buscar dados (reativo)
- `useMutation()`: Para modificar dados
- `useAction()`: Para ações mais complexas

## 🚀 Deploy para Produção

1. Faça commit das mudanças:
```bash
git add .
git commit -m "Adicionar Convex ao projeto"
```

2. Faça deploy:
```bash
npm run convex:deploy
```

3. Atualize a variável `VITE_CONVEX_URL` no arquivo `.env` com a URL de produção.

## 🔍 Monitoramento

Acesse o dashboard do Convex em [dashboard.convex.dev](https://dashboard.convex.dev) para:
- Ver logs em tempo real
- Monitorar performance
- Gerenciar deployments
- Visualizar dados

## 📚 Recursos Adicionais

- [Documentação do Convex](https://docs.convex.dev)
- [Tutorial de Início Rápido](https://docs.convex.dev/quick-start/hello-world)
- [Exemplos de Código](https://github.com/getconvex/convex)

## ❓ Problemas Comuns

### Erro de Conexão
- Verifique se a URL do Convex está correta no `.env`
- Confirme se o backend está rodando (`npm run convex:dev`)

### Schema não sincronizado
- Execute `npx convex dev` para sincronizar
- Verifique se não há erros de sintaxe no `schema.js`

### Funções não encontradas
- Verifique se as funções estão exportadas corretamente
- Confirme se o arquivo está na pasta `convex/`

## 🎯 Próximos Passos

1. Implementar autenticação de usuários
2. Adicionar sistema de notificações
3. Criar relatórios avançados
4. Implementar backup automático
5. Adicionar integração com pagamentos
