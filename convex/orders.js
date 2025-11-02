import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Busca todos os pedidos
 * @returns {Promise<Array>} Lista de todos os pedidos
 */
export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("orders")
      .order("desc")
      .collect();
  },
});

/**
 * Busca pedidos por status
 * @param {string} status - Status dos pedidos
 * @returns {Promise<Array>} Lista de pedidos com o status especificado
 */
export const getOrdersByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

/**
 * Busca um pedido específico por ID
 * @param {string} orderId - ID do pedido
 * @returns {Promise<Object|null>} Pedido encontrado ou null
 */
export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

/**
 * Cria um novo pedido
 * @param {Object} orderData - Dados do pedido
 * @returns {Promise<string>} ID do pedido criado
 */
export const createOrder = mutation({
  args: {
    clientId: v.optional(v.id("clients")),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
      observations: v.optional(v.string())
    })),
    totalAmount: v.number(),
    paymentMethod: v.string(),
    paymentStatus: v.string(),
    orderNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return orderId;
  },
});

/**
 * Atualiza o status de um pedido
 * @param {string} orderId - ID do pedido
 * @param {string} status - Novo status do pedido
 * @returns {Promise<void>}
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const updates = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Se o status for "delivered", marcar como completo
    if (args.status === "delivered") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.orderId, updates);
  },
});

/**
 * Atualiza o status de pagamento de um pedido
 * @param {string} orderId - ID do pedido
 * @param {string} paymentStatus - Novo status de pagamento
 * @returns {Promise<void>}
 */
export const updatePaymentStatus = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      paymentStatus: args.paymentStatus,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Remove um pedido
 * @param {string} orderId - ID do pedido
 * @returns {Promise<void>}
 */
export const deleteOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orderId);
  },
});

/**
 * Busca pedidos do dia atual
 * @returns {Promise<Array>} Lista de pedidos do dia
 */
export const getTodaysOrders = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfDay = new Date(today).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    return await ctx.db
      .query("orders")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startOfDay),
          q.lt(q.field("createdAt"), endOfDay)
        )
      )
      .order("desc")
      .collect();
  },
});

/**
 * Gera o próximo número de pedido
 * @returns {Promise<number>} Próximo número de pedido
 */
export const getNextOrderNumber = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const todaysOrders = await ctx.db
      .query("orders")
      .filter((q) => 
        q.and(
          q.gte(q.field("createdAt"), startOfDay),
          q.lt(q.field("createdAt"), endOfDay)
        )
      )
      .collect();

    return todaysOrders.length + 1;
  },
});
