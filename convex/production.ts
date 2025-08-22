import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Funções para gerenciar produção no sistema HotDog Manager
 * Controla o status de produção de cada item individual
 */

/**
 * Query para buscar usuário padrão para operações de produção
 * Retorna o primeiro usuário ativo encontrado
 */
export const getDefaultUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    
    return user;
  },
});

/**
 * Query para listar todos os itens em produção
 * Retorna itens organizados por venda com status de produção
 * Separa produtos por grupo e aplica regras específicas
 */
export const listProductionItems = query({
  args: {},
  handler: async (ctx) => {
    // Buscar todas as vendas pendentes
    const pendingSales = await ctx.db
      .query("sales")
      .withIndex("by_status", (q) => q.eq("status", "pendente"))
      .collect();

    // Para cada venda, buscar os itens e seus status de produção
    const productionOrders = await Promise.all(
      pendingSales.map(async (sale) => {
        const saleItems = await ctx.db
          .query("saleItems")
          .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
          .collect();

        // Buscar status de produção de cada item
        const itemsWithProduction = await Promise.all(
          saleItems.map(async (item) => {
            // Buscar informações do produto para determinar o grupo
            const product = await ctx.db.get(item.productId);
            const category = product ? await ctx.db.get(product.categoryId) : null;
            
            // Determinar se é bebida baseado na categoria
            const isBeverage = category?.name?.toLowerCase().includes('bebida') || 
                              product?.name?.toLowerCase().includes('refrigerante') ||
                              product?.name?.toLowerCase().includes('suco') ||
                              product?.name?.toLowerCase().includes('água');

            // Buscar registro de produção existente
            const productionItem = await ctx.db
              .query("productionItems")
              .withIndex("by_sale_item", (q) => q.eq("saleItemId", item._id))
              .first();

            let productionStatus = productionItem?.productionStatus || "pendente";
            
            // Se é bebida e não tem registro de produção, marcar como "concluido" para exibição
            // Bebidas são automaticamente consideradas prontas para entrega
            if (isBeverage && !productionItem) {
              productionStatus = "concluido";
            }

            return {
              ...item,
              productionStatus,
              productionId: productionItem?._id,
              startedAt: productionItem?.startedAt,
              completedAt: productionItem?.completedAt,
              deliveredAt: productionItem?.deliveredAt,
              // Informações do produto e categoria
              product,
              category,
              isBeverage,
            };
          })
        );

        return {
          ...sale,
          items: itemsWithProduction,
        };
      })
    );

    // Filtrar apenas vendas que têm itens não entregues
    return productionOrders.filter(order => 
      order.items.some(item => item.productionStatus !== "entregue")
    );
  },
});

/**
 * Mutation para inicializar bebidas automaticamente
 * Cria registros de produção para bebidas como já concluídas
 */
export const initializeBeverages = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Buscar todas as vendas pendentes
    const pendingSales = await ctx.db
      .query("sales")
      .withIndex("by_status", (q) => q.eq("status", "pendente"))
      .collect();

    let initializedCount = 0;

    for (const sale of pendingSales) {
      const saleItems = await ctx.db
        .query("saleItems")
        .withIndex("by_sale", (q) => q.eq("saleId", sale._id))
        .collect();

      for (const item of saleItems) {
        // Verificar se já existe registro de produção
        const existingProduction = await ctx.db
          .query("productionItems")
          .withIndex("by_sale_item", (q) => q.eq("saleItemId", item._id))
          .first();

        if (existingProduction) continue;

        // Buscar informações do produto
        const product = await ctx.db.get(item.productId);
        const category = product ? await ctx.db.get(product.categoryId) : null;
        
        // Determinar se é bebida
        const isBeverage = category?.name?.toLowerCase().includes('bebida') || 
                          product?.name?.toLowerCase().includes('refrigerante') ||
                          product?.name?.toLowerCase().includes('suco') ||
                          product?.name?.toLowerCase().includes('água');

        if (isBeverage) {
          // Criar registro de produção para bebida como já concluída
          await ctx.db.insert("productionItems", {
            saleItemId: item._id,
            saleId: sale._id,
            productionStatus: "concluido",
            startedBy: undefined,
            startedAt: now,
            completedAt: now,
            createdAt: now,
            updatedAt: now,
          });
          
          initializedCount++;
        }
      }
    }

    return { initializedCount, message: `${initializedCount} bebidas inicializadas automaticamente` };
  },
});

/**
 * Query para buscar item de produção específico
 * Retorna informações completas de um item em produção
 */
export const getProductionItem = query({
  args: { saleItemId: v.id("saleItems") },
  handler: async (ctx, args) => {
    const saleItem = await ctx.db.get(args.saleItemId);
    if (!saleItem) return null;

    const productionItem = await ctx.db
      .query("productionItems")
      .withIndex("by_sale_item", (q) => q.eq("saleItemId", args.saleItemId))
      .first();

    const sale = await ctx.db.get(saleItem.saleId);
    const product = await ctx.db.get(saleItem.productId);

    return {
      saleItem,
      productionItem,
      sale,
      product,
    };
  },
});

/**
 * Mutation para iniciar produção de um item
 * Muda status de "pendente" para "em_producao"
 */
export const startProduction = mutation({
  args: {
    saleItemId: v.id("saleItems"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const saleItem = await ctx.db.get(args.saleItemId);
    if (!saleItem) {
      throw new Error("Item de venda não encontrado");
    }

    const now = Date.now();

    // Verificar se já existe registro de produção
    const existingProduction = await ctx.db
      .query("productionItems")
      .withIndex("by_sale_item", (q) => q.eq("saleItemId", args.saleItemId))
      .first();

    if (existingProduction) {
      // Atualizar registro existente
      await ctx.db.patch(existingProduction._id, {
        productionStatus: "em_producao",
        startedBy: args.userId,
        startedAt: now,
        updatedAt: now,
      });
      return existingProduction._id;
    } else {
      // Criar novo registro de produção
      const productionId = await ctx.db.insert("productionItems", {
        saleItemId: args.saleItemId,
        saleId: saleItem.saleId,
        productionStatus: "em_producao",
        startedBy: args.userId,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return productionId;
    }
  },
});

/**
 * Mutation para concluir produção de um item
 * Muda status de "em_producao" para "concluido"
 */
export const completeProduction = mutation({
  args: {
    saleItemId: v.id("saleItems"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const saleItem = await ctx.db.get(args.saleItemId);
    if (!saleItem) {
      throw new Error("Item de venda não encontrado");
    }

    const productionItem = await ctx.db
      .query("productionItems")
      .withIndex("by_sale_item", (q) => q.eq("saleItemId", args.saleItemId))
      .first();

    if (!productionItem) {
      throw new Error("Item de produção não encontrado");
    }

    if (productionItem.productionStatus !== "em_producao") {
      throw new Error("Item não está em produção");
    }

    const now = Date.now();

    await ctx.db.patch(productionItem._id, {
      productionStatus: "concluido",
      completedBy: args.userId,
      completedAt: now,
      updatedAt: now,
    });

    return productionItem._id;
  },
});

/**
 * Mutation para entregar um item concluído
 * Muda status de "concluido" para "entregue"
 * Para bebidas que não passaram pelo processo normal, cria registro se necessário
 */
export const deliverItem = mutation({
  args: {
    saleItemId: v.id("saleItems"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const saleItem = await ctx.db.get(args.saleItemId);
    if (!saleItem) {
      throw new Error("Item de venda não encontrado");
    }

    // Buscar informações do produto para determinar se é bebida
    const product = await ctx.db.get(saleItem.productId);
    const category = product ? await ctx.db.get(product.categoryId) : null;
    
    const isBeverage = category?.name?.toLowerCase().includes('bebida') || 
                      product?.name?.toLowerCase().includes('refrigerante') ||
                      product?.name?.toLowerCase().includes('suco') ||
                      product?.name?.toLowerCase().includes('água');

    const productionItem = await ctx.db
      .query("productionItems")
      .withIndex("by_sale_item", (q) => q.eq("saleItemId", args.saleItemId))
      .first();

    const now = Date.now();

    if (!productionItem) {
      // Se não existe registro de produção e é bebida, criar um como "concluido"
      if (isBeverage) {
        const productionId = await ctx.db.insert("productionItems", {
          saleItemId: args.saleItemId,
          saleId: saleItem.saleId,
          productionStatus: "concluido",
          startedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        
        // Agora marcar como entregue
        await ctx.db.patch(productionId, {
          productionStatus: "entregue",
          deliveredAt: now,
          updatedAt: now,
        });
        
        return productionId;
      } else {
        throw new Error("Item de produção não encontrado");
      }
    }

    // Verificar se o status atual permite mudança para "entregue"
    if (productionItem.productionStatus !== "concluido") {
      throw new Error(`Item não está concluído (status atual: ${productionItem.productionStatus})`);
    }

    // Marcar como entregue
    await ctx.db.patch(productionItem._id, {
      productionStatus: "entregue",
      deliveredAt: now,
      updatedAt: now,
    });

    return productionItem._id;
  },
});

/**
 * Mutation para reverter status de produção
 * Permite voltar um item para status anterior
 */
export const revertProductionStatus = mutation({
  args: {
    saleItemId: v.id("saleItems"),
    newStatus: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const validStatuses = ["pendente", "em_producao", "concluido", "entregue"];
    if (!validStatuses.includes(args.newStatus)) {
      throw new Error("Status inválido");
    }

    const productionItem = await ctx.db
      .query("productionItems")
      .withIndex("by_sale_item", (q) => q.eq("saleItemId", args.saleItemId))
      .first();

    if (!productionItem) {
      throw new Error("Item de produção não encontrado");
    }

    const now = Date.now();
    const updates: any = {
      productionStatus: args.newStatus,
      updatedAt: now,
    };

    // Limpar campos baseado no novo status
    if (args.newStatus === "pendente") {
      updates.startedBy = undefined;
      updates.startedAt = undefined;
      updates.completedBy = undefined;
      updates.completedAt = undefined;
      updates.deliveredAt = undefined;
    } else if (args.newStatus === "em_producao") {
      updates.completedBy = undefined;
      updates.completedAt = undefined;
      updates.deliveredAt = undefined;
    } else if (args.newStatus === "concluido") {
      updates.deliveredAt = undefined;
    }

    await ctx.db.patch(productionItem._id, updates);

    return productionItem._id;
  },
});

/**
 * Query para estatísticas de produção
 * Retorna contadores de itens por status
 */
export const getProductionStats = query({
  args: {},
  handler: async (ctx) => {
    const allProductionItems = await ctx.db
      .query("productionItems")
      .collect();

    const stats = {
      pendente: 0,
      em_producao: 0,
      concluido: 0,
      entregue: 0,
      total: allProductionItems.length,
    };

    allProductionItems.forEach(item => {
      stats[item.productionStatus as keyof typeof stats]++;
    });

    return stats;
  },
});
