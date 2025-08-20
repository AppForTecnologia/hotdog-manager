import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Funções para gerenciar o caixa no sistema HotDog Manager
 * Inclui operações de abertura, fechamento e histórico
 */

/**
 * Query para listar todo o histórico de caixa
 * Retorna registros ordenados por data (mais recentes primeiro)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const cashRegisterHistory = await ctx.db
      .query("cashRegister")
      .withIndex("by_date", (q) => q.gte("closeDate", 0))
      .collect();

    // Ordenar por data (mais recentes primeiro)
    return cashRegisterHistory.sort((a, b) => b.closeDate - a.closeDate);
  },
});

/**
 * Query para buscar registro de caixa por ID
 * Retorna um registro específico com todas as informações
 */
export const getById = query({
  args: { id: v.id("cashRegister") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    return record;
  },
});

/**
 * Query para buscar registro de caixa por data
 * Retorna registro de uma data específica
 */
export const getByDate = query({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(args.date);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await ctx.db
      .query("cashRegister")
      .withIndex("by_date", (q) => 
        q.gte("closeDate", startOfDay.getTime())
      )
      .filter((q) => q.lte(q.field("closeDate"), endOfDay.getTime()))
      .first();

    return record;
  },
});

/**
 * Query para listar registros de caixa por período
 * Retorna registros dentro de um intervalo de datas
 */
export const listByDateRange = query({
  args: { 
    startDate: v.number(), 
    endDate: v.number() 
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("cashRegister")
      .withIndex("by_date", (q) => 
        q.gte("closeDate", args.startDate)
      )
      .filter((q) => q.lte(q.field("closeDate"), args.endDate))
      .collect();

    // Ordenar por data (mais recentes primeiro)
    return records.sort((a, b) => b.closeDate - a.closeDate);
  },
});

/**
 * Mutation para criar um novo registro de fechamento de caixa
 * Registra o fechamento com contagem e diferenças
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    clerkUserId: v.string(),
    moneyCount: v.number(),
    creditCount: v.number(),
    debitCount: v.number(),
    pixCount: v.number(),
    totalCount: v.number(),
    moneySales: v.number(),
    creditSales: v.number(),
    debitSales: v.number(),
    pixSales: v.number(),
    totalSales: v.number(),
    moneyDiff: v.number(),
    creditDiff: v.number(),
    debitDiff: v.number(),
    pixDiff: v.number(),
    totalDiff: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const recordId = await ctx.db.insert("cashRegister", {
      userId: args.userId,
      clerkUserId: args.clerkUserId,
      moneyCount: args.moneyCount,
      creditCount: args.creditCount,
      debitCount: args.debitCount,
      pixCount: args.pixCount,
      totalCount: args.totalCount,
      moneySales: args.moneySales,
      creditSales: args.creditSales,
      debitSales: args.debitSales,
      pixSales: args.pixSales,
      totalSales: args.totalSales,
      moneyDiff: args.moneyDiff,
      creditDiff: args.creditDiff,
      debitDiff: args.debitDiff,
      pixDiff: args.pixDiff,
      totalDiff: args.totalDiff,
      notes: args.notes || "",
      closeDate: now,
      createdAt: now,
      updatedAt: now,
    });

    return recordId;
  },
});

/**
 * Mutation para atualizar um registro de caixa
 * Permite editar campos específicos
 */
export const update = mutation({
  args: {
    id: v.id("cashRegister"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Verificar se registro existe
    const existingRecord = await ctx.db.get(id);
    if (!existingRecord) {
      throw new Error("Registro de caixa não encontrado");
    }

    // Preparar campos para atualização
    const updateFields: any = {
      updatedAt: Date.now(),
    };

    if (updates.notes !== undefined) updateFields.notes = updates.notes;

    // Atualizar registro
    await ctx.db.patch(id, updateFields);

    return id;
  },
});

/**
 * Mutation para deletar um registro de caixa (soft delete)
 * Marca o registro como deletado sem remover do banco
 */
export const remove = mutation({
  args: { id: v.id("cashRegister") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    
    if (!record) {
      throw new Error("Registro de caixa não encontrado");
    }

    // Soft delete - marcar como deletado
    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
