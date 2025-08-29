import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Sistema de Gerenciamento de CNPJs para Multi-Tenancy
 * Permite que usuários Master gerenciem empresas e suas permissões
 */

/**
 * Query para verificar se um usuário é Master
 * @param userId - ID do usuário no Clerk
 * @returns true se for Master, false caso contrário
 */
export const isUserMaster = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();
    
    return user?.role === "master";
  },
});

/**
 * Query para verificar se um usuário é Master por email
 * @param email - Email do usuário
 * @returns true se for Master, false caso contrário
 */
export const isUserMasterByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    return user?.role === "master";
  },
});

/**
 * Query para listar todos os CNPJs (apenas para usuários Master)
 * @param userId - ID do usuário no Clerk
 * @returns Lista de todos os CNPJs cadastrados
 */
export const listAllCnpjs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();
    
    if (user?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem listar CNPJs");
    }

    const cnpjs = await ctx.db.query("cnpjs").collect();
    
    // Buscar informações adicionais para cada CNPJ
    const cnpjsWithDetails = await Promise.all(
      cnpjs.map(async (cnpj) => {
        const userCount = await ctx.db
          .query("userCnpjLinks")
          .withIndex("by_cnpj", (q) => q.eq("cnpjId", cnpj._id))
          .collect();
        
        const lastRenewal = await ctx.db
          .query("cnpjRenewals")
          .withIndex("by_cnpj", (q) => q.eq("cnpjId", cnpj._id))
          .order("desc")
          .first();

        return {
          ...cnpj,
          userCount: userCount.length,
          lastRenewal,
          daysUntilExpiration: Math.ceil((cnpj.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)),
        };
      })
    );

    return cnpjsWithDetails;
  },
});

/**
 * Query para buscar um CNPJ específico
 * @param cnpjId - ID do CNPJ
 * @returns Dados do CNPJ
 */
export const getCnpj = query({
  args: { cnpjId: v.id("cnpjs") },
  handler: async (ctx, args) => {
    const cnpj = await ctx.db.get(args.cnpjId);
    if (!cnpj) return null;

    // Buscar usuários vinculados
    const linkedUsers = await ctx.db
      .query("userCnpjLinks")
      .withIndex("by_cnpj", (q) => q.eq("cnpjId", args.cnpjId))
      .collect();

    // Buscar histórico de renovações
    const renewals = await ctx.db
      .query("cnpjRenewals")
      .withIndex("by_cnpj", (q) => q.eq("cnpjId", args.cnpjId))
      .order("desc")
      .collect();

    return {
      ...cnpj,
      linkedUsers,
      renewals,
      daysUntilExpiration: Math.ceil((cnpj.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)),
    };
  },
});

/**
 * Mutation para criar um novo CNPJ (apenas para usuários Master)
 * @param cnpj - Dados do CNPJ
 * @param userId - ID do usuário Master no Clerk
 * @returns ID do CNPJ criado
 */
export const createCnpj = mutation({
  args: {
    cnpj: v.string(),
    companyName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    plan: v.string(),
    days: v.number(), // Quantidade de dias para o plano
    notes: v.optional(v.string()),
    userId: v.string(), // ID do usuário Master no Clerk
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();
    
    if (user?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem criar CNPJs");
    }

    // Verificar se o CNPJ já existe
    const existingCnpj = await ctx.db
      .query("cnpjs")
      .withIndex("by_cnpj", (q) => q.eq("cnpj", args.cnpj))
      .first();
    
    if (existingCnpj) {
      throw new Error("CNPJ já cadastrado no sistema");
    }

    const now = Date.now();
    const expiresAt = now + (args.days * 24 * 60 * 60 * 1000); // Converter dias para milissegundos

    const cnpjId = await ctx.db.insert("cnpjs", {
      cnpj: args.cnpj,
      companyName: args.companyName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      plan: args.plan,
      status: "active",
      createdAt: now,
      updatedAt: now,
      expiresAt,
      createdBy: user._id,
      notes: args.notes,
    });

    // Criar registro de renovação inicial
    await ctx.db.insert("cnpjRenewals", {
      cnpjId,
      plan: args.plan,
      days: args.days,
      amount: 0, // Renovação inicial gratuita
      paymentMethod: "initial",
      status: "completed",
      createdAt: now,
      expiresAt,
      createdBy: user._id,
      notes: "Criação inicial do CNPJ",
    });

    return cnpjId;
  },
});

/**
 * Mutation para renovar um CNPJ (apenas para usuários Master)
 * @param cnpjId - ID do CNPJ
 * @param days - Quantidade de dias para adicionar
 * @param amount - Valor pago pela renovação
 * @param paymentMethod - Método de pagamento
 * @param notes - Observações da renovação
 * @param userId - ID do usuário Master no Clerk
 * @returns ID da renovação criada
 */
export const renewCnpj = mutation({
  args: {
    cnpjId: v.id("cnpjs"),
    days: v.number(),
    amount: v.number(),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .first();
    
    if (user?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem renovar CNPJs");
    }

    const cnpj = await ctx.db.get(args.cnpjId);
    if (!cnpj) {
      throw new Error("CNPJ não encontrado");
    }

    const now = Date.now();
    
    // Calcular nova data de expiração
    // Se já expirou, usar data atual + dias
    // Se não expirou, adicionar dias à data atual de expiração
    const currentExpiry = Math.max(cnpj.expiresAt, now);
    const newExpiresAt = currentExpiry + (args.days * 24 * 60 * 60 * 1000);

    // Atualizar CNPJ
    await ctx.db.patch(args.cnpjId, {
      status: "active",
      updatedAt: now,
      expiresAt: newExpiresAt,
    });

    // Criar registro de renovação
    const renewalId = await ctx.db.insert("cnpjRenewals", {
      cnpjId: args.cnpjId,
      plan: cnpj.plan,
      days: args.days,
      amount: args.amount,
      paymentMethod: args.paymentMethod,
      status: "completed",
      createdAt: now,
      expiresAt: newExpiresAt,
      createdBy: user._id,
      notes: args.notes,
    });

    return renewalId;
  },
});

/**
 * Mutation para vincular um usuário a um CNPJ (apenas para usuários Master)
 * @param userId - ID do usuário no Clerk
 * @param cnpjId - ID do CNPJ
 * @param role - Role do usuário (admin, manager, employee)
 * @param masterUserId - ID do usuário Master no Clerk
 * @returns ID do vínculo criado
 */
export const linkUserToCnpj = mutation({
  args: {
    userId: v.string(),
    cnpjId: v.id("cnpjs"),
    role: v.string(),
    masterUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const masterUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.masterUserId))
      .first();
    
    if (masterUser?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem vincular usuários");
    }

    // Verificar se o CNPJ existe e está ativo
    const cnpj = await ctx.db.get(args.cnpjId);
    if (!cnpj) {
      throw new Error("CNPJ não encontrado");
    }

    if (cnpj.status !== "active") {
      throw new Error("CNPJ não está ativo");
    }

    // Verificar se o usuário já está vinculado a este CNPJ
    const existingLink = await ctx.db
      .query("userCnpjLinks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existingLink) {
      throw new Error("Usuário já está vinculado a um CNPJ");
    }

    const now = Date.now();

    const linkId = await ctx.db.insert("userCnpjLinks", {
      userId: args.userId,
      cnpjId: args.cnpjId,
      role: args.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
      createdBy: masterUser._id,
      accessCount: 0,
    });

    return linkId;
  },
});

/**
 * Query para verificar se um usuário tem acesso a um CNPJ
 * @param userId - ID do usuário no Clerk
 * @returns Dados do CNPJ e permissões do usuário
 */
export const getUserCnpjAccess = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Buscar vínculo do usuário com CNPJ
    const userLink = await ctx.db
      .query("userCnpjLinks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!userLink) {
      return null; // Usuário não está vinculado a nenhum CNPJ
    }

    // Buscar dados do CNPJ
    const cnpj = await ctx.db.get(userLink.cnpjId);
    if (!cnpj) {
      return null;
    }

    // Verificar se o CNPJ está ativo e não expirou
    const now = Date.now();
    const isExpired = cnpj.expiresAt < now;
    const isActive = cnpj.status === "active" && !isExpired;

    return {
      cnpj,
      userLink,
      isActive,
      isExpired,
      daysUntilExpiration: Math.ceil((cnpj.expiresAt - now) / (1000 * 60 * 60 * 1000)),
    };
  },
});

/**
 * Mutation para atualizar último acesso do usuário
 * @param userId - ID do usuário no Clerk
 * @returns true se atualizado com sucesso
 */
export const updateUserAccess = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Buscar vínculo do usuário com CNPJ
    const userLink = await ctx.db
      .query("userCnpjLinks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!userLink) {
      return false; // Usuário não está vinculado a nenhum CNPJ
    }

    // Buscar dados do CNPJ
    const cnpj = await ctx.db.get(userLink.cnpjId);
    if (!cnpj) {
      return false;
    }

    // Verificar se o CNPJ está ativo e não expirou
    const now = Date.now();
    const isExpired = cnpj.expiresAt < now;
    const isActive = cnpj.status === "active" && !isExpired;

    // Atualizar último acesso e contador apenas se estiver ativo
    if (isActive) {
      await ctx.db.patch(userLink._id, {
        lastAccess: now,
        accessCount: userLink.accessCount + 1,
        updatedAt: now,
      });
    }

    return true;
  },
});

/**
 * Query para listar usuários vinculados a um CNPJ (apenas para usuários Master)
 * @param cnpjId - ID do CNPJ
 * @param masterUserId - ID do usuário Master no Clerk
 * @returns Lista de usuários vinculados
 */
export const getCnpjUsers = query({
  args: { 
    cnpjId: v.id("cnpjs"),
    masterUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const masterUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.masterUserId))
      .first();
    
    if (masterUser?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem listar usuários");
    }

    const userLinks = await ctx.db
      .query("userCnpjLinks")
      .withIndex("by_cnpj", (q) => q.eq("cnpjId", args.cnpjId))
      .collect();

    return userLinks;
  },
});

/**
 * Mutation para remover vínculo de usuário com CNPJ (apenas para usuários Master)
 * @param linkId - ID do vínculo
 * @param masterUserId - ID do usuário Master no Clerk
 * @returns true se removido com sucesso
 */
export const unlinkUserFromCnpj = mutation({
  args: {
    linkId: v.id("userCnpjLinks"),
    masterUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const masterUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.masterUserId))
      .first();
    
    if (masterUser?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem remover vínculos");
    }

    await ctx.db.delete(args.linkId);
    return true;
  },
});

/**
 * Query para estatísticas gerais (apenas para usuários Master)
 * @param masterUserId - ID do usuário Master no Clerk
 * @returns Estatísticas do sistema
 */
export const getMasterStats = query({
  args: { masterUserId: v.string() },
  handler: async (ctx, args) => {
    // Verificar se o usuário é Master
    const masterUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.masterUserId))
      .first();
    
    if (masterUser?.role !== "master") {
      throw new Error("Acesso negado: Apenas usuários Master podem acessar estatísticas");
    }

    const allCnpjs = await ctx.db.query("cnpjs").collect();
    const allUserLinks = await ctx.db.query("userCnpjLinks").collect();
    const allRenewals = await ctx.db.query("cnpjRenewals").collect();

    const now = Date.now();
    
    const stats = {
      totalCnpjs: allCnpjs.length,
      activeCnpjs: allCnpjs.filter(c => c.status === "active" && c.expiresAt > now).length,
      expiredCnpjs: allCnpjs.filter(c => c.expiresAt <= now).length,
      totalUsers: allUserLinks.length,
      activeUsers: allUserLinks.filter(u => u.status === "active").length,
      totalRenewals: allRenewals.length,
      pendingRenewals: allRenewals.filter(r => r.status === "pending").length,
      revenue: allRenewals
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + r.amount, 0),
    };

    return stats;
  },
});

/**
 * Mutation para atualizar ID do Clerk do usuário Master
 * Esta função é executada automaticamente quando o usuário faz login
 * @param email - Email do usuário Master
 * @param clerkId - ID do usuário no Clerk
 * @returns true se atualizado com sucesso
 */
export const updateMasterUserClerkId = mutation({
  args: {
    email: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar usuário pelo email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se é Master
    if (user.role !== "master") {
      throw new Error("Apenas usuários Master podem ter seus IDs atualizados");
    }

    // Atualizar o clerkId
    await ctx.db.patch(user._id, {
      clerkId: args.clerkId,
      updatedAt: Date.now(),
    });

    // Atualizar também o vínculo com CNPJ se existir
    const userLink = await ctx.db
      .query("userCnpjLinks")
      .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
      .first();
    
    if (userLink) {
      await ctx.db.patch(userLink._id, {
        userId: args.clerkId,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});
