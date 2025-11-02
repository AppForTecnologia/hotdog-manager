import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema do banco de dados para o sistema de gestão de lanchonete
 * Define as tabelas e seus campos para produtos, vendas, clientes, etc.
 */
export default defineSchema({
  // Tabela de produtos
  products: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.string(), // Ex: "hotdogs", "bebidas", "acompanhamentos"
    ingredients: v.array(v.string()),
    available: v.boolean(),
    imageUrl: v.optional(v.string()),
    preparationTime: v.number(), // em minutos
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_category", ["category"])
    .index("by_availability", ["available"]),

  // Tabela de clientes
  clients: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  // Tabela de pedidos
  orders: defineTable({
    clientId: v.optional(v.id("clients")),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
      observations: v.optional(v.string())
    })),
    totalAmount: v.number(),
    status: v.string(), // "pending", "preparing", "ready", "delivered", "cancelled"
    paymentMethod: v.string(), // "cash", "card", "pix"
    paymentStatus: v.string(), // "pending", "paid", "cancelled"
    orderNumber: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number())
  }).index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_order_number", ["orderNumber"])
    .index("by_date", ["createdAt"]),

  // Tabela de vendas (resumo diário)
  sales: defineTable({
    date: v.string(), // formato YYYY-MM-DD
    totalOrders: v.number(),
    totalRevenue: v.number(),
    totalItemsSold: v.number(),
    paymentMethods: v.object({
      cash: v.number(),
      card: v.number(),
      pix: v.number()
    }),
    createdAt: v.number()
  }).index("by_date", ["date"]),

  // Tabela de estoque
  inventory: defineTable({
    productId: v.id("products"),
    quantity: v.number(),
    minStock: v.number(),
    lastUpdated: v.number()
  }).index("by_product", ["productId"])
    .index("by_low_stock", ["quantity", "minStock"])
});
