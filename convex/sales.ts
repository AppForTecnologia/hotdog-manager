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
    let sales;
    
    if (args.status === "pendente") {
      // Para status pendente, incluir também vendas parcialmente pagas
      sales = await ctx.db
        .query("sales")
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "pendente"),
            q.eq(q.field("status"), "parcialmente_paga")
          )
        )
        .collect();
    } else {
      sales = await ctx.db
        .query("sales")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .collect();
    }

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
    saleType: v.string(),
    customerId: v.optional(v.id("customers")),
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
      saleType: args.saleType,
      customerId: args.customerId,
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
          paymentStatus: "pendente",
          amountPaid: 0,
          createdAt: now,
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
 * Mutation para atualizar método de pagamento e status de uma venda
 * Permite processar pagamento com método específico
 */
export const updatePaymentAndStatus = mutation({
  args: {
    id: v.id("sales"),
    status: v.string(),
    paymentMethod: v.string(),
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

    // Validações de método de pagamento
    const validPaymentMethods = ["money", "credit", "debit", "pix"];
    if (!validPaymentMethods.includes(args.paymentMethod)) {
      throw new Error("Método de pagamento inválido");
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
            
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Atualizar status e método de pagamento da venda
    await ctx.db.patch(args.id, {
      status: args.status,
      paymentMethod: args.paymentMethod,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Mutation para processar pagamento com múltiplos métodos
 * Cria registros separados para cada método de pagamento usado
 */
export const processPaymentWithMethods = mutation({
  args: {
    saleId: v.id("sales"),
    paymentMethods: v.array(v.object({
      method: v.string(),
      amount: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const sale = await ctx.db.get(args.saleId);
    
    if (!sale) {
      throw new Error("Venda não encontrada");
    }

    // Validar métodos de pagamento
    const validPaymentMethods = ["money", "credit", "debit", "pix"];
    for (const payment of args.paymentMethods) {
      if (!validPaymentMethods.includes(payment.method)) {
        throw new Error(`Método de pagamento inválido: ${payment.method}`);
      }
    }

    // Calcular total dos pagamentos
    const totalPaid = args.paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Verificar se o total pago é igual ao total da venda
    if (Math.abs(totalPaid - sale.total) > 0.01) {
      throw new Error(`Total pago (R$ ${totalPaid.toFixed(2)}) não confere com total da venda (R$ ${sale.total.toFixed(2)})`);
    }

    // Determinar método principal (maior valor)
    const mainMethod = args.paymentMethods.reduce((prev, current) => {
      return (prev.amount > current.amount) ? prev : current;
    });

    // Atualizar venda com status "paga" e método principal
    await ctx.db.patch(args.saleId, {
      status: "paga",
      paymentMethod: mainMethod.method,
      updatedAt: Date.now(),
    });

    // Criar registros de pagamento para cada método usado
    const paymentRecords = await Promise.all(
      args.paymentMethods.map(async (payment) => {
        return await ctx.db.insert("paymentMethods", {
          saleId: args.saleId,
          method: payment.method,
          amount: payment.amount,
          createdAt: Date.now(),
        });
      })
    );

    return { saleId: args.saleId, paymentRecords };
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
 * Query para buscar métodos de pagamento de uma venda
 * Retorna todos os métodos usados em uma venda específica
 */
export const getPaymentMethods = query({
  args: { saleId: v.id("sales") },
  handler: async (ctx, args) => {
    const methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_sale", (q) => q.eq("saleId", args.saleId))
      .collect();

    return methods.sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Query para buscar todos os métodos de pagamento das vendas do dia
 * Retorna métodos agrupados por tipo para cálculo do caixa
 */
export const getDailyPaymentMethods = query({
  args: { 
    startDate: v.number(),
    endDate: v.number()
  },
  handler: async (ctx, args) => {
    // Buscar vendas pagas no período
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_date", (q) => q.gte("saleDate", args.startDate))
      .filter((q) => 
        q.and(
          q.lte(q.field("saleDate"), args.endDate),
          q.eq(q.field("status"), "paga")
        )
      )
      .collect();

    // Buscar métodos de pagamento para essas vendas
    const allMethods = [];
    for (const sale of sales) {
      const methods = await ctx.db
        .query("paymentMethods")
        .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
        .collect();
      
      allMethods.push(...methods);
    }

    return allMethods;
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

/**
 * Query para listar produtos agrupados por grupos de vendas
 * Organiza produtos em grupos com ícones e cores para a tela de vendas
 */
export const listProductsGroupedForSales = query({
  args: {},
  handler: async (ctx) => {
    // Buscar grupos de vendas ativos
    const saleGroups = await ctx.db
      .query("saleGroups")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Se não houver grupos, retornar produtos sem agrupamento
    if (saleGroups.length === 0) {
      const products = await ctx.db
        .query("products")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();

      return {
        "produtos": {
          title: "Produtos",
          icon: "📦",
          color: "#6B7280",
          products: products.sort((a, b) => a.name.localeCompare(b.name))
        }
      };
    }

    // Ordenar grupos por ordem
    const sortedGroups = saleGroups.sort((a, b) => a.order - b.order);

    // Buscar todas as categorias ativas
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Organizar categorias em grupos baseado nas palavras-chave
    const groups: any = {};
    const unassignedCategories = [];

    // Inicializar grupos
    for (const group of sortedGroups) {
      groups[group.name] = {
        title: group.title,
        icon: group.icon,
        color: group.color,
        categories: [],
        products: []
      };
    }

    // Associar categorias aos grupos baseado nas palavras-chave
    for (const category of categories) {
      let assigned = false;
      
      for (const group of sortedGroups) {
        if (group.keywords.some(keyword => 
          category.name.toLowerCase().includes(keyword.toLowerCase())
        )) {
          groups[group.name].categories.push(category);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        unassignedCategories.push(category);
      }
    }

    // Associar categorias não atribuídas ao primeiro grupo disponível
    if (unassignedCategories.length > 0 && Object.keys(groups).length > 0) {
      const firstGroupKey = Object.keys(groups)[0];
      groups[firstGroupKey].categories.push(...unassignedCategories);
    }

    // Buscar produtos para cada grupo
    for (const groupKey of Object.keys(groups)) {
      const group = groups[groupKey];
      
      for (const category of group.categories) {
        const products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("isActive"), true),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .collect();

        // Adicionar informações da categoria aos produtos
        const productsWithCategory = products.map(product => ({
          ...product,
          category: category
        }));

        group.products.push(...productsWithCategory);
      }

      // Ordenar produtos por nome
      group.products.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    return groups;
  },
});

/**
 * Mutation para pagar um item específico
 * Permite pagamento parcial por item, atualizando status do item e da venda
 */
export const payItem = mutation({
  args: {
    saleItemId: v.id("saleItems"),
    paymentMethod: v.string(),
    amount: v.number(),
    customerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const saleItem = await ctx.db.get(args.saleItemId);
    
    if (!saleItem) {
      throw new Error("Item de venda não encontrado");
    }

    // Validar método de pagamento
    const validPaymentMethods = ["money", "credit", "debit", "pix"];
    if (!validPaymentMethods.includes(args.paymentMethod)) {
      throw new Error("Método de pagamento inválido");
    }

    // Calcular novo valor pago do item
    const newAmountPaid = saleItem.amountPaid + args.amount;
    
    // Verificar se não está pagando mais que o valor do item
    if (newAmountPaid > saleItem.subtotal) {
      throw new Error(`Valor pago (R$ ${newAmountPaid.toFixed(2)}) excede o valor do item (R$ ${saleItem.subtotal.toFixed(2)})`);
    }

    // Determinar novo status do item
    let newPaymentStatus = "pendente";
    if (newAmountPaid >= saleItem.subtotal) {
      newPaymentStatus = "pago";
    } else if (newAmountPaid > 0) {
      newPaymentStatus = "parcial";
    }

    // Atualizar status do item
    await ctx.db.patch(args.saleItemId, {
      paymentStatus: newPaymentStatus,
      amountPaid: newAmountPaid,
    });

    // Criar registro de pagamento
    await ctx.db.insert("paymentMethods", {
      saleId: saleItem.saleId,
      saleItemId: args.saleItemId,
      method: args.paymentMethod,
      amount: args.amount,
      customerName: args.customerName,
      createdAt: Date.now(),
    });

    // Verificar status geral da venda
    const allItems = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", saleItem.saleId))
      .collect();

    const totalItems = allItems.length;
    const paidItems = allItems.filter(item => item.paymentStatus === "pago").length;
    const partialItems = allItems.filter(item => item.paymentStatus === "parcial").length;
    const pendingItems = allItems.filter(item => item.paymentStatus === "pendente").length;

    // Determinar novo status da venda
    let newSaleStatus = "pendente";
    if (paidItems === totalItems) {
      newSaleStatus = "paga";
    } else if (paidItems > 0 || partialItems > 0) {
      newSaleStatus = "parcialmente_paga";
    }

    // Atualizar status da venda
    await ctx.db.patch(saleItem.saleId, {
      status: newSaleStatus,
      updatedAt: Date.now(),
    });

    return {
      itemId: args.saleItemId,
      newPaymentStatus,
      newAmountPaid,
      saleStatus: newSaleStatus,
    };
  },
});

/**
 * Query para buscar itens de venda com status de pagamento
 * Retorna itens com informações de pagamento para a interface
 */
export const getSaleItemsWithPaymentStatus = query({
  args: { saleId: v.id("sales") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", args.saleId))
      .collect();

    // Buscar pagamentos para cada item
    const itemsWithPayments = await Promise.all(
      items.map(async (item) => {
        const payments = await ctx.db
          .query("paymentMethods")
          .withIndex("by_sale_item", (q) => q.eq("saleItemId", item._id))
          .collect();

        return {
          ...item,
          payments,
        };
      })
    );

    return itemsWithPayments;
  },
});

/**
 * Query para buscar resumo de pagamentos de uma venda
 * Retorna estatísticas de pagamento para a interface
 */
export const getSalePaymentSummary = query({
  args: { saleId: v.id("sales") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", args.saleId))
      .collect();

    const totalItems = items.length;
    const paidItems = items.filter(item => item.paymentStatus === "pago").length;
    const partialItems = items.filter(item => item.paymentStatus === "parcial").length;
    const pendingItems = items.filter(item => item.paymentStatus === "pendente").length;

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalPaid = items.reduce((sum, item) => sum + item.amountPaid, 0);
    const totalPending = totalAmount - totalPaid;

    return {
      summary: {
        totalItems,
        paidItems,
        partialItems,
        pendingItems,
        totalAmount,
        totalPaid,
        totalPending,
      },
    };
  },
});

/**
 * Mutation para estornar pagamento de um item
 * Permite cancelar pagamentos incorretos
 */
export const refundItemPayment = mutation({
  args: {
    paymentId: v.id("paymentMethods"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId);
    
    if (!payment) {
      throw new Error("Pagamento não encontrado");
    }

    if (!payment.saleItemId) {
      throw new Error("Este pagamento não é de um item específico");
    }

    const saleItem = await ctx.db.get(payment.saleItemId);
    if (!saleItem) {
      throw new Error("Item de venda não encontrado");
    }

    // Calcular novo valor pago
    const newAmountPaid = Math.max(0, saleItem.amountPaid - payment.amount);
    
    // Determinar novo status de pagamento
    let newPaymentStatus = "pendente";
    if (newAmountPaid >= saleItem.subtotal) {
      newPaymentStatus = "pago";
    } else if (newAmountPaid > 0) {
      newPaymentStatus = "parcial";
    }

    // Atualizar item com novo status de pagamento
    await ctx.db.patch(payment.saleItemId, {
      paymentStatus: newPaymentStatus,
      amountPaid: newAmountPaid,
    });

    // Remover o pagamento
    await ctx.db.delete(args.paymentId);

    // Verificar se a venda ainda está paga
    const allItems = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", saleItem.saleId))
      .collect();

    const allItemsPaid = allItems.every(item => item.paymentStatus === "pago");
    
    // Se não todos os itens estão pagos, voltar venda para pendente
    if (!allItemsPaid) {
      await ctx.db.patch(saleItem.saleId, {
        status: "pendente",
        updatedAt: Date.now(),
      });
    }

    return { 
      saleItemId: payment.saleItemId, 
      newPaymentStatus, 
      newAmountPaid,
      refundedAmount: payment.amount,
      allItemsPaid 
    };
  },
});

/**
 * Query para buscar itens de venda com informações de produtos
 * Retorna itens de venda com dados completos para análise de relatórios
 */
export const getSaleItemsWithProducts = query({
  args: { 
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let sales;
    
    // Aplicar filtros de data se fornecidos
    if (args.startDate && args.endDate) {
      sales = await ctx.db
        .query("sales")
        .withIndex("by_date", (q) => 
          q.gte("saleDate", args.startDate!)
        )
        .collect();
    } else {
      sales = await ctx.db.query("sales").collect();
    }
    
    // Filtrar por data final se fornecida
    let filteredSales = sales;
    if (args.endDate) {
      filteredSales = sales.filter(sale => sale.saleDate <= args.endDate!);
    }

    // Buscar itens de venda para todas as vendas filtradas
    const allItems = await Promise.all(
      filteredSales.map(async (sale) => {
        const items = await ctx.db
          .query("saleItems")
          .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
          .collect();

        return items.map(item => ({
          ...item,
          saleDate: sale.saleDate,
          saleType: sale.saleType,
          paymentMethod: sale.paymentMethod
        }));
      })
    );

    // Flatten array de itens
    const flatItems = allItems.flat();

    // Buscar informações dos produtos para cada item
    const itemsWithProducts = await Promise.all(
      flatItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        const category = product ? await ctx.db.get(product.categoryId) : null;
        
        return {
          ...item,
          product,
          category
        };
      })
    );

    return itemsWithProducts;
  },
});
