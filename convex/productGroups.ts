import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Funções para gerenciar grupos de produtos no sistema HotDog Manager
 * Permite criar grupos personalizados e definir ordem de exibição
 */

/**
 * Query para listar todos os grupos de produtos ativos
 * Retorna grupos ordenados por ordem de exibição
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db
      .query("productGroups")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Ordenar por ordem de exibição
    return groups.sort((a, b) => a.order - b.order);
  },
});

/**
 * Query para buscar grupo por nome
 * Retorna um grupo específico
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("productGroups")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

/**
 * Mutation para criar um novo grupo de produtos
 * Cria grupo com validações e ordem automática
 */
export const create = mutation({
  args: {
    name: v.string(),
    title: v.string(),
    icon: v.string(),
    color: v.string(),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se já existe grupo com esse nome
    const existingGroup = await ctx.db
      .query("productGroups")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existingGroup) {
      throw new Error("Já existe um grupo com esse nome");
    }

    // Buscar a próxima ordem disponível
    const groups = await ctx.db
      .query("productGroups")
      .withIndex("by_order", (q) => q.gte("order", 0))
      .collect();

    const maxOrder = groups.reduce((max, group) => Math.max(max, group.order), 0);
    const now = Date.now();

    const groupId = await ctx.db.insert("productGroups", {
      name: args.name.toLowerCase(),
      title: args.title,
      icon: args.icon,
      color: args.color,
      order: maxOrder + 1,
      isActive: true,
      keywords: args.keywords.map(k => k.toLowerCase()),
      createdAt: now,
      updatedAt: now,
    });

    return groupId;
  },
});

/**
 * Mutation para atualizar ordem dos grupos
 * Permite reordenar grupos de produtos
 */
export const updateOrder = mutation({
  args: {
    groupOrders: v.array(v.object({
      id: v.id("productGroups"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Atualizar ordem de cada grupo
    for (const { id, order } of args.groupOrders) {
      await ctx.db.patch(id, {
        order,
        updatedAt: now,
      });
    }

    return { updated: args.groupOrders.length };
  },
});

/**
 * Mutation para atualizar um grupo
 * Permite editar propriedades do grupo
 */
export const update = mutation({
  args: {
    id: v.id("productGroups"),
    title: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) {
      throw new Error("Grupo não encontrado");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.color !== undefined) updates.color = args.color;
    if (args.keywords !== undefined) updates.keywords = args.keywords.map(k => k.toLowerCase());
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

/**
 * Mutation para remover um grupo
 * Desativa o grupo (soft delete)
 */
export const remove = mutation({
  args: { id: v.id("productGroups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) {
      throw new Error("Grupo não encontrado");
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Mutation para inicializar grupos padrão
 * Cria grupos básicos se não existirem
 */
export const initializeDefaultGroups = mutation({
  args: {},
  handler: async (ctx) => {
    const existingGroups = await ctx.db
      .query("productGroups")
      .collect();

    if (existingGroups.length > 0) {
      return { message: "Grupos já existem", count: existingGroups.length };
    }

    const now = Date.now();
    
    // Criar grupos padrão
    const defaultGroups = [
      {
        name: "lanches",
        title: "Lanches",
        icon: "🌭",
        color: "#F97316", // orange-500
        order: 1,
        keywords: ["lanche", "hambur", "hot dog", "sanduiche", "x-"],
      },
      {
        name: "bebidas",
        title: "Bebidas",
        icon: "🥤",
        color: "#3B82F6", // blue-500
        order: 2,
        keywords: ["bebida", "refri", "suco", "água", "refrigerante"],
      },
    ];

    const createdGroups = [];
    
    for (const group of defaultGroups) {
      const groupId = await ctx.db.insert("productGroups", {
        ...group,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      createdGroups.push(groupId);
    }

    return { 
      message: "Grupos padrão criados com sucesso", 
      count: createdGroups.length,
      groups: createdGroups 
    };
  },
});
