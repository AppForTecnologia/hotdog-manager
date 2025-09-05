import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema do banco de dados para o sistema HotDog Manager
 * Define todas as tabelas e seus campos
 */
export default defineSchema({
  /**
   * Tabela de usuários do sistema
   * Armazena informações dos usuários logados via Clerk
   */
  users: defineTable({
    // ID do usuário no Clerk
    clerkId: v.string(),
    // Email do usuário
    email: v.string(),
    // Nome completo
    fullName: v.optional(v.string()),
    // Função/role no sistema (admin, vendedor, etc.)
    role: v.optional(v.string()),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
    // Se o usuário está ativo
    isActive: v.boolean(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"])
    .index("by_full_name", ["fullName"])
    .index("by_active", ["isActive"]),

  /**
   * Tabela de tenants (empresas/CNPJs)
   * Cada tenant representa uma empresa diferente com seus próprios dados
   */
  tenants: defineTable({
    // CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)
    cnpj: v.string(),
    // Nome da empresa
    companyName: v.string(),
    // Email de contato da empresa
    email: v.string(),
    // Telefone de contato (opcional)
    phone: v.optional(v.string()),
    // Endereço da empresa (opcional)
    address: v.optional(v.string()),
    // Plano contratado (basic, premium, enterprise)
    plan: v.string(),
    // Status do tenant (active, suspended, expired)
    status: v.string(),
    // Data de criação
    createdAt: v.number(),
    // Data da última atualização
    updatedAt: v.number(),
    // Data de expiração do plano
    expiresAt: v.number(),
    // Usuário Master que criou o tenant
    createdBy: v.id("users"),
    // Observações adicionais
    notes: v.optional(v.string()),
  })
    .index("byCnpj", ["cnpj"])
    .index("byStatus", ["status"])
    .index("byExpiresAt", ["expiresAt"]),

  /**
   * Tabela de memberships (vinculação de usuários a tenants)
   * Controla as permissões de acesso de cada usuário em cada tenant
   */
  memberships: defineTable({
    // ID do tenant
    tenantId: v.id("tenants"),
    // ID do usuário no Clerk
    userId: v.string(),
    // Role do usuário no tenant (admin, manager, employee)
    role: v.string(),
    // Status do membership (active, inactive, suspended)
    status: v.string(),
    // Data de criação do membership
    createdAt: v.number(),
    // Data da última atualização
    updatedAt: v.number(),
    // Usuário Master que criou o membership
    createdBy: v.id("users"),
    // Último acesso do usuário ao tenant
    lastAccess: v.optional(v.number()),
    // Contador de acessos
    accessCount: v.number(),
  })
    .index("byTenant", ["tenantId"])
    .index("byUser", ["userId"])
    .index("byTenantAndUser", ["tenantId", "userId"]),

  /**
   * Tabela de categorias de produtos
   * Organiza os produtos por tipo (bebidas, lanches, etc.)
   */
  categories: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // Nome da categoria
    name: v.string(),
    // Descrição da categoria
    description: v.optional(v.string()),
    // Cor para identificação visual
    color: v.optional(v.string()),
    // Se a categoria está ativa
    isActive: v.boolean(),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de produtos
   * Armazena todos os produtos disponíveis para venda
   */
  products: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // Nome do produto
    name: v.string(),
    // Descrição do produto
    description: v.optional(v.string()),
    // Preço de venda
    price: v.number(),
    // Preço de custo
    costPrice: v.optional(v.number()),
    // Categoria do produto
    categoryId: v.id("categories"),
    // Código de barras/SKU
    sku: v.optional(v.string()),
    // Imagem do produto (URL)
    imageUrl: v.optional(v.string()),
    // Se o produto está ativo
    isActive: v.boolean(),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
    // Data de exclusão (soft delete)
    deletedAt: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_category", ["categoryId"])
    .index("by_active", ["isActive"])
    .index("by_sku", ["sku"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de vendas
   * Registra todas as vendas realizadas
   */
  sales: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // ID do usuário que fez a venda
    userId: v.id("users"),
    // ID do usuário no Clerk
    clerkUserId: v.string(),
    // Total da venda
    total: v.number(),
    // Desconto aplicado
    discount: v.optional(v.number()),
    // Forma de pagamento (dinheiro, cartão, pix)
    paymentMethod: v.string(),
    // Status da venda (pendente, paga, cancelada)
    status: v.string(),
    // Tipo de venda (local, delivery)
    saleType: v.string(),
    // ID do cliente (apenas para delivery)
    customerId: v.optional(v.id("customers")),
    // Observações da venda
    notes: v.optional(v.string()),
    // Data da venda
    saleDate: v.number(),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["saleDate"])
    .index("by_status", ["status"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de itens de venda
   * Detalha cada produto vendido em uma venda
   */
  saleItems: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // ID da venda
    saleId: v.id("sales"),
    // ID do produto
    productId: v.id("products"),
    // Nome do produto no momento da venda (backup)
    productName: v.string(),
    // Preço unitário no momento da venda
    unitPrice: v.number(),
    // Quantidade vendida
    quantity: v.number(),
    // Subtotal do item
    subtotal: v.number(),
    // Status de pagamento do item (pendente, pago, parcial)
    paymentStatus: v.string(),
    // Valor já pago do item
    amountPaid: v.number(),
    // Data de criação
    createdAt: v.number(),
  })
    .index("by_sale", ["saleId"])
    .index("by_product", ["productId"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),



  /**
   * Tabela de fechamento de caixa
   * Registra contagens e diferenças ao fechar o caixa
   */
  cashRegister: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // ID do usuário que fechou o caixa
    userId: v.id("users"),
    // ID do usuário no Clerk
    clerkUserId: v.string(),
    // Contagem de dinheiro
    moneyCount: v.number(),
    // Contagem de cartão de crédito
    creditCount: v.number(),
    // Contagem de cartão de débito
    debitCount: v.number(),
    // Contagem de PIX
    pixCount: v.number(),
    // Total contado
    totalCount: v.number(),
    // Vendas em dinheiro
    moneySales: v.number(),
    // Vendas em crédito
    creditSales: v.number(),
    // Vendas em débito
    debitSales: v.number(),
    // Vendas em PIX
    pixSales: v.number(),
    // Total de vendas
    totalSales: v.number(),
    // Diferença em dinheiro
    moneyDiff: v.number(),
    // Diferença em crédito
    creditDiff: v.number(),
    // Diferença em débito
    debitDiff: v.number(),
    // Diferença em PIX
    pixDiff: v.number(),
    // Diferença total
    totalDiff: v.number(),
    // Observações
    notes: v.optional(v.string()),
    // Data de fechamento
    closeDate: v.number(),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
    // Data de exclusão (soft delete)
    deletedAt: v.optional(v.number()),
  })
    .index("by_date", ["closeDate"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de métodos de pagamento por venda
   * Permite múltiplos métodos de pagamento em uma única venda
   */
  paymentMethods: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // ID da venda
    saleId: v.id("sales"),
    // ID do item específico (opcional - para pagamento por item)
    saleItemId: v.optional(v.id("saleItems")),
    // Método de pagamento (money, credit, debit, pix)
    method: v.string(),
    // Valor pago com este método
    amount: v.number(),
    // Nome da pessoa que está pagando (opcional)
    customerName: v.optional(v.string()),
    // Data de criação
    createdAt: v.number(),
  })
    .index("by_sale", ["saleId"])
    .index("by_sale_item", ["saleItemId"])
    .index("by_method", ["method"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de controle de produção
   * Controla o status de produção de cada item individual
   */
  productionItems: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // ID do item de venda
    saleItemId: v.id("saleItems"),
    // ID da venda
    saleId: v.id("sales"),
    // Status de produção (pendente, em_producao, concluido, entregue)
    productionStatus: v.string(),
    // ID do usuário que iniciou a produção
    startedBy: v.optional(v.id("users")),
    // ID do usuário que finalizou a produção
    completedBy: v.optional(v.id("users")),
    // Data de início da produção
    startedAt: v.optional(v.number()),
    // Data de conclusão
    completedAt: v.optional(v.number()),
    // Data de entrega
    deliveredAt: v.optional(v.number()),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
  })
    .index("by_sale_item", ["saleItemId"])
    .index("by_sale", ["saleId"])
    .index("by_production_status", ["productionStatus"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de configuração de grupos de produtos
   * Permite configurar grupos personalizados e sua ordem
   */
  productGroups: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // Nome do grupo (lanches, bebidas, porcoes, etc.)
    name: v.string(),
    // Título exibido na interface
    title: v.string(),
    // Ícone do grupo (emoji ou classe CSS)
    icon: v.string(),
    // Cor do grupo (hex, rgb, etc.)
    color: v.string(),
    // Ordem de exibição (menor número aparece primeiro)
    order: v.number(),
    // Se o grupo está ativo
    isActive: v.boolean(),
    // Palavras-chave para detecção automática de categorias
    keywords: v.array(v.string()),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_order", ["order"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de configuração de grupos de vendas
   * Permite configurar grupos personalizados para organização na tela de vendas
   * com ícones, cores e ordem de exibição
   */
  saleGroups: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // Nome do grupo (lanches, bebidas, porcoes, etc.)
    name: v.string(),
    // Título exibido na interface
    title: v.string(),
    // Ícone do grupo (emoji ou classe CSS)
    icon: v.string(),
    // Cor do grupo (hex, rgb, etc.)
    color: v.string(),
    // Ordem de exibição (menor número aparece primeiro)
    order: v.number(),
    // Se o grupo está ativo
    isActive: v.boolean(),
    // Palavras-chave para detecção automática de categorias
    keywords: v.array(v.string()),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_order", ["order"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela de clientes para delivery
   * Armazena informações dos clientes que fazem pedidos por delivery
   */
  customers: defineTable({
    // ID do tenant (opcional para compatibilidade com dados existentes)
    tenantId: v.optional(v.id("tenants")),
    // Nome completo do cliente
    name: v.string(),
    // Número de telefone
    phone: v.string(),
    // Endereço completo
    address: v.string(),
    // Observações adicionais (ponto de referência, etc.)
    notes: v.optional(v.string()),
    // Se o cliente está ativo
    isActive: v.boolean(),
    // Data de criação
    createdAt: v.number(),
    // Data de última atualização
    updatedAt: v.number(),
    // Data de exclusão (soft delete)
    deletedAt: v.optional(v.number()),
  })
    .index("by_name", ["name"])
    .index("by_phone", ["phone"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("byTenant", ["tenantId"]),

  /**
   * Tabela para controle de rate limiting
   * Armazena tentativas de acesso para controle de limite por usuário
   */
  rateLimitAttempts: defineTable({
    // ID do usuário no Clerk
    userId: v.string(),
    // Timestamp da tentativa
    timestamp: v.number(),
    // Se a tentativa foi bem-sucedida
    success: v.boolean(),
  })
    .index("byUser", ["userId"])
    .index("byTimestamp", ["timestamp"]),

});
