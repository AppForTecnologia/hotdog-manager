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
   * Tabela de categorias de produtos
   * Organiza os produtos por tipo (bebidas, lanches, etc.)
   */
  categories: defineTable({
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
    .index("by_created_at", ["createdAt"]),

  /**
   * Tabela de produtos
   * Armazena todos os produtos disponíveis para venda
   */
  products: defineTable({
    // Nome do produto
    name: v.string(),
    // Descrição do produto
    description: v.optional(v.string()),
    // Preço de venda
    price: v.number(),
    // Preço de custo
    costPrice: v.optional(v.number()),
    // Quantidade em estoque
    stock: v.number(),
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
    .index("by_stock", ["stock"])
    .index("by_created_at", ["createdAt"]),

  /**
   * Tabela de vendas
   * Registra todas as vendas realizadas
   */
  sales: defineTable({
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
    .index("by_created_at", ["createdAt"]),

  /**
   * Tabela de itens de venda
   * Detalha cada produto vendido em uma venda
   */
  saleItems: defineTable({
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
    // Data de criação
    createdAt: v.number(),
  })
    .index("by_sale", ["saleId"])
    .index("by_product", ["productId"])
    .index("by_created_at", ["createdAt"]),

  /**
   * Tabela de movimentações de estoque
   * Controla entradas e saídas de produtos
   */
  stockMovements: defineTable({
    // ID do produto
    productId: v.id("products"),
    // Tipo de movimentação (entrada, saída, ajuste)
    type: v.string(),
    // Quantidade movimentada
    quantity: v.number(),
    // Quantidade anterior
    previousStock: v.number(),
    // Quantidade nova
    newStock: v.number(),
    // Motivo da movimentação
    reason: v.string(),
    // ID do usuário que fez a movimentação
    userId: v.id("users"),
    // Data da movimentação
    movementDate: v.number(),
    // Data de criação
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_type", ["type"])
    .index("by_date", ["movementDate"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),
});
