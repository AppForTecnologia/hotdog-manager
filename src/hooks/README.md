# Hooks com Isolamento por Tenant

Este diretório contém hooks personalizados que integram automaticamente o isolamento por tenant em todas as operações de dados. Todos os hooks são baseados no `TenantContext` e garantem que apenas dados do tenant atual sejam acessados.

## Características

- ✅ **Isolamento automático**: Todos os dados são filtrados pelo tenant atual
- ✅ **Validação de tenant**: Operações falham se nenhum tenant estiver selecionado
- ✅ **Queries condicionais**: Queries são executadas apenas quando há um tenant válido
- ✅ **TypeScript**: Totalmente tipado com tipos do Convex
- ✅ **Reatividade**: Atualizações automáticas quando o tenant muda

## Hooks Disponíveis

### useProducts()

Hook para gerenciar produtos com isolamento por tenant.

```typescript
import { useProducts } from '@/hooks/useProducts';

function ProductsPage() {
  const { 
    products, 
    isLoading, 
    create, 
    update, 
    remove 
  } = useProducts();

  if (!hasTenant) {
    return <div>Selecione um tenant</div>;
  }

  if (isLoading) {
    return <div>Carregando produtos...</div>;
  }

  return (
    <div>
      {products?.map(product => (
        <div key={product._id}>{product.name}</div>
      ))}
    </div>
  );
}
```

**Funcionalidades:**
- `products` - Lista de produtos ativos
- `getProductsByCategory(categoryId)` - Produtos por categoria
- `getProductById(productId)` - Produto específico
- `getProductBySku(sku)` - Produto por SKU
- `searchProductsByName(searchTerm)` - Busca por nome
- `create(data)` - Criar produto
- `update(productId, data)` - Atualizar produto
- `remove(productId)` - Deletar produto

### useCategories()

Hook para gerenciar categorias com isolamento por tenant.

```typescript
import { useCategories } from '@/hooks/useProducts';

function CategoriesPage() {
  const { 
    categories, 
    categoriesWithCount,
    create, 
    update, 
    remove 
  } = useCategories();

  return (
    <div>
      {categories?.map(category => (
        <div key={category._id}>
          {category.name} ({category.productCount} produtos)
        </div>
      ))}
    </div>
  );
}
```

**Funcionalidades:**
- `categories` - Lista de categorias ativas
- `categoriesWithCount` - Categorias com contagem de produtos
- `getCategoryById(categoryId)` - Categoria específica
- `getCategoryByName(name)` - Categoria por nome
- `searchCategoriesByName(searchTerm)` - Busca por nome
- `create(data)` - Criar categoria
- `update(categoryId, data)` - Atualizar categoria
- `remove(categoryId)` - Deletar categoria

### useCustomers()

Hook para gerenciar clientes com isolamento por tenant.

```typescript
import { useCustomers } from '@/hooks/useProducts';

function CustomersPage() {
  const { 
    customers, 
    searchCustomers,
    create, 
    update, 
    deactivate 
  } = useCustomers();

  return (
    <div>
      {customers?.map(customer => (
        <div key={customer._id}>
          {customer.name} - {customer.phone}
        </div>
      ))}
    </div>
  );
}
```

**Funcionalidades:**
- `customers` - Lista de clientes ativos
- `searchCustomers(searchTerm)` - Busca por nome ou telefone
- `getCustomerById(customerId)` - Cliente específico
- `create(data)` - Criar cliente
- `update(customerId, data)` - Atualizar cliente
- `deactivate(customerId)` - Desativar cliente

### useSales()

Hook para gerenciar vendas com isolamento por tenant.

```typescript
import { useSales } from '@/hooks/useSales';

function SalesPage() {
  const { 
    sales, 
    getSalesByStatus,
    create, 
    updateStatus,
    processPayment 
  } = useSales();

  const pendingSales = getSalesByStatus('pendente');

  return (
    <div>
      <h2>Vendas Pendentes</h2>
      {pendingSales?.map(sale => (
        <div key={sale._id}>
          Venda #{sale._id} - R$ {sale.total}
        </div>
      ))}
    </div>
  );
}
```

**Funcionalidades:**
- `sales` - Lista de todas as vendas
- `getSalesByUser(userId)` - Vendas por usuário
- `getSalesByDateRange(startDate, endDate)` - Vendas por período
- `getSaleById(saleId)` - Venda específica
- `getSaleWithItems(saleId)` - Venda com itens
- `getSaleItems(saleId)` - Itens de uma venda
- `getSalesByStatus(status)` - Vendas por status
- `getTotalByDateRange(startDate, endDate)` - Total de vendas por período
- `getSalesByPaymentMethod(method)` - Vendas por método de pagamento
- `getPaymentMethods(saleId)` - Métodos de pagamento de uma venda
- `getTopSellingProducts(limit, startDate, endDate)` - Produtos mais vendidos
- `getProductsGroupedForSales()` - Produtos agrupados para vendas
- `create(data)` - Criar venda
- `updateStatus(saleId, status)` - Atualizar status
- `updatePaymentAndStatus(saleId, status, method)` - Atualizar pagamento e status
- `processPayment(saleId, methods)` - Processar pagamento com múltiplos métodos
- `addDiscount(saleId, discount)` - Adicionar desconto
- `payItem(saleItemId, method, amount, customerName)` - Pagar item específico
- `refundPayment(paymentId, reason)` - Estornar pagamento

### useProduction()

Hook para gerenciar produção com isolamento por tenant.

```typescript
import { useProduction } from '@/hooks/useSales';

function ProductionPage() {
  const { 
    productionItems, 
    productionStats,
    start, 
    complete, 
    deliver 
  } = useProduction();

  return (
    <div>
      <h2>Itens em Produção</h2>
      {productionItems?.map(order => (
        <div key={order._id}>
          <h3>Venda #{order._id}</h3>
          {order.items.map(item => (
            <div key={item._id}>
              {item.productName} - {item.productionStatus}
              <button onClick={() => start(item._id)}>
                Iniciar Produção
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

**Funcionalidades:**
- `productionItems` - Itens em produção
- `allProductionItems` - Todos os itens de produção
- `productionStats` - Estatísticas de produção
- `getProductionItem(saleItemId)` - Item específico
- `initializeBeverages()` - Inicializar bebidas automaticamente
- `start(saleItemId, userId)` - Iniciar produção
- `complete(saleItemId, userId)` - Concluir produção
- `deliver(saleItemId, userId)` - Entregar item
- `revertStatus(saleItemId, newStatus, userId)` - Reverter status

### useCashRegister()

Hook para gerenciar caixa com isolamento por tenant.

```typescript
import { useCashRegister } from '@/hooks/useCashRegister';

function CashRegisterPage() {
  const { 
    cashRegisterHistory, 
    getCashRegisterByDate,
    create 
  } = useCashRegister();

  const todayRecord = getCashRegisterByDate(Date.now());

  return (
    <div>
      <h2>Histórico de Caixa</h2>
      {cashRegisterHistory?.map(record => (
        <div key={record._id}>
          {new Date(record.closeDate).toLocaleDateString()} - 
          Total: R$ {record.totalSales}
        </div>
      ))}
    </div>
  );
}
```

**Funcionalidades:**
- `cashRegisterHistory` - Histórico de caixa
- `getCashRegisterById(recordId)` - Registro específico
- `getCashRegisterByDate(date)` - Registro por data
- `getCashRegisterByDateRange(startDate, endDate)` - Registros por período
- `create(data)` - Criar registro de fechamento
- `update(recordId, data)` - Atualizar registro
- `remove(recordId)` - Deletar registro

## Padrões de Uso

### 1. Verificação de Tenant

Todos os hooks verificam automaticamente se há um tenant selecionado:

```typescript
function MyComponent() {
  const { products, isLoading, hasTenant } = useProducts();

  if (!hasTenant) {
    return <div>Selecione um tenant para continuar</div>;
  }

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return <div>{/* Conteúdo */}</div>;
}
```

### 2. Queries Condicionais

As queries são executadas apenas quando há um tenant válido:

```typescript
function MyComponent() {
  const { currentTenantId } = useTenant();
  const products = useQuery(
    api.products.listActive,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );
}
```

### 3. Mutations com Validação

As mutations validam o tenant antes de executar:

```typescript
function MyComponent() {
  const { create } = useProducts();

  const handleCreate = async () => {
    try {
      await create({
        name: "Novo Produto",
        price: 10.00,
        categoryId: "category123"
      });
    } catch (error) {
      if (error.message.includes("tenant")) {
        // Lidar com erro de tenant
      }
    }
  };
}
```

### 4. Atualizações Automáticas

Quando o tenant muda, todas as queries são automaticamente recarregadas:

```typescript
function MyComponent() {
  const { currentTenantId } = useTenant();
  const { products } = useProducts();

  // products será automaticamente recarregado quando currentTenantId mudar
  return <div>{products?.length} produtos</div>;
}
```

## Migração de Código Existente

### Antes (sem isolamento)

```typescript
// ❌ Código antigo
const products = useQuery(api.products.listActive, {});
const createProduct = useMutation(api.products.create);

const handleCreate = async () => {
  await createProduct({
    name: "Produto",
    price: 10.00
  });
};
```

### Depois (com isolamento)

```typescript
// ✅ Código novo
const { products, create } = useProducts();

const handleCreate = async () => {
  await create({
    name: "Produto",
    price: 10.00,
    categoryId: "category123"
  });
};
```

## Benefícios

1. **Segurança**: Impossível acessar dados de outros tenants
2. **Simplicidade**: Não precisa passar tenantId manualmente
3. **Consistência**: Todos os hooks seguem o mesmo padrão
4. **Manutenibilidade**: Mudanças no isolamento são centralizadas
5. **Performance**: Queries são executadas apenas quando necessário
6. **UX**: Interface atualiza automaticamente ao trocar tenant

## Troubleshooting

### Erro: "Nenhum tenant selecionado"

**Causa**: Tentativa de executar operação sem tenant selecionado.

**Solução**: Verificar se o `TenantContext` está configurado e se há um tenant selecionado.

```typescript
const { currentTenantId } = useTenant();
if (!currentTenantId) {
  return <div>Selecione um tenant</div>;
}
```

### Erro: "Tenant não encontrado"

**Causa**: Tentativa de acessar dados de um tenant que não existe ou ao qual o usuário não tem acesso.

**Solução**: Verificar se o usuário tem membership no tenant.

### Dados não carregam

**Causa**: Tenant não selecionado ou query sendo executada com "skip".

**Solução**: Verificar se `currentTenantId` está definido e se a query está sendo executada.

```typescript
const { currentTenantId } = useTenant();
console.log('Current tenant:', currentTenantId); // Debug
```
