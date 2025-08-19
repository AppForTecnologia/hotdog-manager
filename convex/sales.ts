import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Funções para gerenciar vendas no sistema HotDog Manager
 * Inclui operações de CRUD, cálculos e relatórios
 */

/**
 * Query para listar todas as vendas
 * Retorna vendas ordenadas por data (mais recentes primeiro)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_date", (q) => q.gte("saleDate", 0))
      .collect();

    // Ordenar por data (mais recentes primeiro)
    return sales.sort((a, b) => b.saleDate - a.saleDate);
  },
});

/**
 * Query para listar vendas por usuário
 * Retorna vendas de um usuário específico
 */
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Ordenar por data (mais recentes primeiro)
    return sales.sort((a, b) => b.saleDate - a.saleDate);
  },
});

/**
 * Query para listar vendas por período
 * Retorna vendas dentro de um intervalo de datas
 */
export const listByDateRange = query({
  args: { 
    startDate: v.number(), 
    endDate: v.number() 
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_date", (q) => 
        q.gte("saleDate", args.startDate)
      )
      .filter((q) => q.lte(q.field("saleDate"), args.endDate))
      .collect();

    // Ordenar por data (mais recentes primeiro)
    return sales.sort((a, b) => b.saleDate - a.saleDate);
  },
});

/**
 * Query para buscar venda por ID
 * Retorna uma venda específica com todas as informações
 */
export const getById = query({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.id);
    return sale;
  },
});

/**
 * Query para buscar itens de uma venda
 * Retorna todos os produtos vendidos em uma venda específica
 */
export const getSaleItems = query({
  args: { saleId: v.id("sales") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", args.saleId))
      .collect();

    // Ordenar por data de criação (mais antigos primeiro)
    return items.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Query para buscar venda completa com itens
 * Retorna venda + todos os itens em uma única consulta
 */
export const getSaleWithItems = query({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.id);
    if (!sale) return null;

    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", args.id))
      .collect();

    // Ordenar itens por data de criação (mais antigos primeiro)
    const sortedItems = items.sort((a, b) => a.createdAt - b.createdAt);

    return {
      ...sale,
      items: sortedItems,
    };
  },
});

/**
 * Query para listar vendas por status
 * Retorna vendas com um status específico
 */
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    // Ordenar por data (mais recentes primeiro)
    return sales.sort((a, b) => b.saleDate - a.saleDate);
  },
});

/**
 * Query para calcular total de vendas por período
 * Retorna soma de vendas em um intervalo de datas
 */
export const getTotalByDateRange = query({
  args: { 
    startDate: v.number(), 
    endDate: v.number() 
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_date", (q) => 
        q.gte("saleDate", args.startDate)
      )
      .filter((q) => 
        q.and(
          q.lte(q.field("saleDate"), args.endDate),
          q.eq(q.field("status"), "paga")
        )
      )
      .collect();

    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const discountTotal = sales.reduce((sum, sale) => sum + (sale.discount || 0), 0);

    return {
      total,
      discountTotal,
      netTotal: total - discountTotal,
      saleCount: sales.length,
    };
  },
});

/**
 * Mutation para criar uma nova venda
 * Cria uma venda com validações e cálculos automáticos
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    clerkUserId: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      unitPrice: v.number(),
      quantity: v.number(),
    })),
    paymentMethod: v.string(),
    discount: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Calcular total da venda
    const subtotal = args.items.reduce((sum, item) => 
      sum + (item.unitPrice * item.quantity), 0
    );
    
    const discount = args.discount || 0;
    const total = subtotal - discount;

    if (total < 0) {
      throw new Error("Total da venda não pode ser negativo");
    }

    const now = Date.now();
    
    // Criar a venda
    const saleId = await ctx.db.insert("sales", {
      userId: args.userId,
      clerkUserId: args.clerkUserId,
      total,
      discount,
      paymentMethod: args.paymentMethod,
      status: "pendente",
      notes: args.notes,
      saleDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // Criar os itens da venda
    const saleItems = await Promise.all(
      args.items.map(async (item) => {
        const subtotal = item.unitPrice * item.quantity;
        
        const itemId = await ctx.db.insert("saleItems", {
          saleId,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal,
          createdAt: now,
        });

        // Atualizar estoque do produto
        await ctx.db.patch(item.productId, {
          stock: (await ctx.db.get(item.productId))!.stock - item.quantity,
          updatedAt: now,
        });

        return itemId;
      })
    );

    return { saleId, saleItems };
  },
});

/**
 * Mutation para atualizar status de uma venda
 * Permite alterar o status (pendente, paga, cancelada)
 */
export const updateStatus = mutation({
  args: {
    id: v.id("sales"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.id);
    
    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    // Validações de status
    const validStatuses = ["pendente", "paga", "cancelada"];
    if (!validStatuses.includes(args.status)) {
      throw new Error("Status inválido");
    }

    // Se cancelando venda, restaurar estoque
    if (args.status === "cancelada" && sale.status !== "cancelada") {
      const items = await ctx.db
        .query("saleItems")
        .withIndex("by_sale", (q) => q.eq("saleId", args.id))
        .collect();

      // Restaurar estoque de cada produto
      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, {
            stock: product.stock + item.quantity,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Atualizar status da venda
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Mutation para adicionar desconto a uma venda
 * Permite aplicar ou alterar desconto em uma venda
 */
export const updateDiscount = mutation({
  args: {
    id: v.id("sales"),
    discount: v.number(),
  },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.id);
    
    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    if (args.discount < 0) {
      throw new Error("Desconto não pode ser negativo");
    }

    // Recalcular total
    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", args.id))
      .collect();

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const newTotal = subtotal - args.discount;

    if (newTotal < 0) {
      throw new Error("Total da venda não pode ser negativo");
    }

    // Atualizar venda
    await ctx.db.patch(args.id, {
      discount: args.discount,
      total: newTotal,
      updatedAt: Date.now(),
    });

    return { id: args.id, newTotal };
  },
});

/**
 * Query para buscar vendas por forma de pagamento
 * Retorna vendas agrupadas por método de pagamento
 */
export const getByPaymentMethod = query({
  args: { paymentMethod: v.string() },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .filter((q) => 
        q.and(
          q.eq(q.field("paymentMethod"), args.paymentMethod),
          q.eq(q.field("status"), "paga")
        )
      )
      .collect();

    const total = sales.reduce((sum, sale) => sum + sale.total, 0);

    return {
      sales,
      total,
      count: sales.length,
    };
  },
});

/**
 * Query para buscar produtos mais vendidos
 * Retorna ranking de produtos por quantidade vendida
 */
export const getTopSellingProducts = query({
  args: { 
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Buscar todas as vendas no período (se especificado)
    let sales;
    
    if (args.startDate && args.endDate) {
      sales = await ctx.db
        .query("sales")
        .withIndex("by_date", (q) => 
          q.gte("saleDate", args.startDate!)
        )
        .filter((q) => 
          q.and(
            q.lte(q.field("saleDate"), args.endDate!),
            q.eq(q.field("status"), "paga")
          )
        )
        .collect();
    } else {
      sales = await ctx.db
        .query("sales")
        .filter((q) => q.eq(q.field("status"), "paga"))
        .collect();
    }

    // Agrupar itens por produto
    const productSales = new Map<Id<"products">, { quantity: number, revenue: number }>();
    
    for (const sale of sales) {
      const items = await ctx.db
        .query("saleItems")
        .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
        .collect();

      for (const item of items) {
        const productId = item.productId;
        const existing = productSales.get(productId) || { quantity: 0, revenue: 0 };
        
        productSales.set(productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.subtotal,
        });
      }
    }

    // Converter para array e ordenar por quantidade
    const topProducts = Array.from(productSales.entries())
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);

    // Buscar informações dos produtos
    const productsWithStats = await Promise.all(
      topProducts.map(async (item) => {
        const product = await ctx.db.get(item.productId as Id<"products">);
        return {
          ...item,
          productName: product?.name || "Produto não encontrado",
          product: product,
        };
      })
    );

    return productsWithStats;
  },
});
