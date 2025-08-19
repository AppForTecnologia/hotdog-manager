import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Funções para gerenciar usuários no sistema HotDog Manager
 * Inclui integração com Clerk e operações de CRUD
 */

/**
 * Query para buscar usuário por ID do Clerk
 * Retorna usuário específico baseado no ID do Clerk
 */
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return user;
  },
});

/**
 * Query para buscar usuário por email
 * Retorna usuário específico baseado no email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return user;
  },
});

/**
 * Query para buscar usuário por ID interno
 * Retorna usuário específico baseado no ID interno do sistema
 */
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return user;
  },
});

/**
 * Query para listar todos os usuários ativos
 * Retorna todos os usuários ativos do sistema
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Ordenar por data de criação (mais recentes primeiro)
    return users.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Query para buscar usuários por role/função
 * Retorna usuários com uma função específica
 */
export const listByRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("role"), args.role)
        )
      )
      .collect();

    // Ordenar por nome completo
    return users.sort((a, b) => {
      const nameA = a.fullName || a.email;
      const nameB = b.fullName || b.email;
      return nameA.localeCompare(nameB);
    });
  },
});

/**
 * Query para buscar usuários com estatísticas de vendas
 * Retorna usuários com contagem e total de vendas
 */
export const listWithSalesStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Buscar estatísticas de vendas para cada usuário
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const sales = await ctx.db
          .query("sales")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .filter((q) => q.eq(q.field("status"), "paga"))
          .collect();

        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const saleCount = sales.length;

        return {
          ...user,
          totalSales,
          saleCount,
        };
      })
    );

    // Ordenar por nome completo ou email
    return usersWithStats.sort((a, b) => {
      const nameA = a.fullName || a.email;
      const nameB = b.fullName || b.email;
      return nameA.localeCompare(nameB);
    });
  },
});

/**
 * Mutation para criar ou sincronizar usuário do Clerk
 * Cria novo usuário ou atualiza existente baseado nos dados do Clerk
 */
export const createOrUpdateFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verificar se usuário já existe
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Atualizar usuário existente
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        fullName: args.fullName || existingUser.fullName,
        role: args.role || existingUser.role,
        updatedAt: now,
      });

      return existingUser._id;
    } else {
      // Criar novo usuário
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        email: args.email,
        fullName: args.fullName,
        role: args.role || "vendedor", // Role padrão
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return userId;
    }
  },
});

/**
 * Mutation para criar usuário manualmente
 * Permite criar usuário com dados específicos
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário já existe
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
    
    if (existingUser) {
      throw new Error("Usuário com este ID do Clerk já existe");
    }

    // Verificar se email já existe
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (existingEmail) {
      throw new Error("Email já está em uso");
    }

    const now = Date.now();
    
    const userId = await ctx.db.insert("users", {
      ...args,
      role: args.role || "vendedor",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * Mutation para atualizar usuário existente
 * Permite atualizar dados de um usuário
 */
export const update = mutation({
  args: {
    id: v.id("users"),
    fullName: v.optional(v.string()),
    role: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Verificar se usuário existe
    const existingUser = await ctx.db.get(id);
    if (!existingUser) {
      throw new Error("Usuário não encontrado");
    }

    // Atualizar usuário
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Mutation para desativar usuário
 * Marca usuário como inativo (soft delete)
 */
export const deactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se usuário tem vendas pendentes
    const pendingSales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", args.id))
      .filter((q) => q.eq(q.field("status"), "pendente"))
      .collect();

    if (pendingSales.length > 0) {
      throw new Error("Não é possível desativar usuário com vendas pendentes");
    }

    // Desativar usuário
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Mutation para reativar usuário
 * Marca usuário como ativo novamente
 */
export const reactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Reativar usuário
    await ctx.db.patch(args.id, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Query para buscar usuários por termo de busca
 * Útil para autocomplete e busca de usuários
 */
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();
    
    const users = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.or(
            q.gte(q.field("fullName"), searchLower),
            q.lte(q.field("fullName"), searchLower + "\uffff"),
            q.gte(q.field("email"), searchLower),
            q.lte(q.field("email"), searchLower + "\uffff")
          )
        )
      )
      .collect();

    // Filtrar e ordenar resultados que realmente contêm o termo de busca
    return users
      .filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => {
        const nameA = a.fullName || a.email;
        const nameB = b.fullName || b.email;
        return nameA.localeCompare(nameB);
      });
  },
});

/**
 * Query para buscar estatísticas de usuário
 * Retorna estatísticas detalhadas de um usuário específico
 */
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user || !user.isActive) {
      return null;
    }

    // Buscar vendas do usuário
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Calcular estatísticas
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const paidSales = sales.filter(sale => sale.status === "paga");
    const pendingSales = sales.filter(sale => sale.status === "pendente");
    const cancelledSales = sales.filter(sale => sale.status === "cancelada");

    const stats = {
      user,
      totalSales,
      totalRevenue: paidSales.reduce((sum, sale) => sum + sale.total, 0),
      saleCount: sales.length,
      paidCount: paidSales.length,
      pendingCount: pendingSales.length,
      cancelledCount: cancelledSales.length,
      averageSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
    };

    return stats;
  },
});
