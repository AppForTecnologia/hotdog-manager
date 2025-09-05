import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./utils/auth";

/**
 * Adicionar um usuário a um tenant (criar membership)
 * 
 * @param tenantId - ID do tenant
 * @param userId - ID do usuário no Clerk
 * @param role - Role do usuário (admin, manager, employee)
 * @returns ID do membership criado
 */
export const addMembership = mutation({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const currentUserId = await requireUserId(ctx);
    
    // Verificar se o tenant existe
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant não encontrado");
    }
    
    // Verificar se o tenant está ativo
    if (tenant.status !== "active") {
      throw new ConvexError("Tenant não está ativo");
    }
    
    // Verificar se o tenant não expirou
    if (tenant.expiresAt < Date.now()) {
      throw new ConvexError("Tenant expirado");
    }
    
    // Verificar se já existe membership
    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("byTenantAndUser", (q) => 
        q.eq("tenantId", args.tenantId).eq("userId", args.userId)
      )
      .first();
      
    if (existingMembership) {
      throw new ConvexError("Usuário já possui acesso a este tenant");
    }
    
    // Definir role padrão se não fornecido
    const userRole = args.role || "employee";
    
    // Validar role
    const validRoles = ["admin", "manager", "employee"];
    if (!validRoles.includes(userRole)) {
      throw new ConvexError("Role inválida. Use: admin, manager ou employee");
    }
    
    // Criar membership
    const now = Date.now();
    const membershipId = await ctx.db.insert("memberships", {
      tenantId: args.tenantId,
      userId: args.userId,
      role: userRole,
      status: "active",
      createdAt: now,
      updatedAt: now,
      createdBy: currentUserId as any, // Cast necessário devido ao tipo
      accessCount: 0,
    });
    
    return {
      membershipId,
      message: "Usuário vinculado ao tenant com sucesso",
      role: userRole,
    };
  },
});

/**
 * Listar todos os memberships de um usuário
 * 
 * @param userId - ID do usuário no Clerk
 * @returns Lista de memberships do usuário
 */
export const listUserMemberships = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar memberships do usuário
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Buscar dados dos tenants
    const membershipsWithTenants = await Promise.all(
      memberships.map(async (membership) => {
        const tenant = await ctx.db.get(membership.tenantId);
        return {
          _id: membership._id,
          tenantId: membership.tenantId,
          userId: membership.userId,
          role: membership.role,
          status: membership.status,
          createdAt: membership.createdAt,
          updatedAt: membership.updatedAt,
          lastAccess: membership.lastAccess,
          accessCount: membership.accessCount,
          tenant: tenant ? {
            _id: tenant._id,
            cnpj: tenant.cnpj,
            companyName: tenant.companyName,
            email: tenant.email,
            phone: tenant.phone,
            address: tenant.address,
            plan: tenant.plan,
            status: tenant.status,
            expiresAt: tenant.expiresAt,
            isExpired: tenant.expiresAt < Date.now(),
          } : null,
        };
      })
    );
    
    return membershipsWithTenants;
  },
});

/**
 * Verificar se um usuário tem acesso a um tenant
 * 
 * @param tenantId - ID do tenant
 * @param userId - ID do usuário no Clerk
 * @returns Informações do acesso
 */
export const hasAccess = query({
  args: {
    tenantId: v.id("tenants"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar membership
    const membership = await ctx.db
      .query("memberships")
      .withIndex("byTenantAndUser", (q) => 
        q.eq("tenantId", args.tenantId).eq("userId", args.userId)
      )
      .first();
    
    if (!membership) {
      return {
        hasAccess: false,
        reason: "Usuário não possui membership neste tenant",
      };
    }
    
    // Verificar se membership está ativo
    if (membership.status !== "active") {
      return {
        hasAccess: false,
        reason: `Membership está ${membership.status}`,
      };
    }
    
    // Buscar dados do tenant
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      return {
        hasAccess: false,
        reason: "Tenant não encontrado",
      };
    }
    
    // Verificar se tenant está ativo
    if (tenant.status !== "active") {
      return {
        hasAccess: false,
        reason: `Tenant está ${tenant.status}`,
      };
    }
    
    // Verificar se tenant não expirou
    if (tenant.expiresAt < Date.now()) {
      return {
        hasAccess: false,
        reason: "Tenant expirado",
      };
    }
    
    return {
      hasAccess: true,
      membership: {
        _id: membership._id,
        role: membership.role,
        status: membership.status,
        createdAt: membership.createdAt,
        lastAccess: membership.lastAccess,
        accessCount: membership.accessCount,
      },
      tenant: {
        _id: tenant._id,
        cnpj: tenant.cnpj,
        companyName: tenant.companyName,
        plan: tenant.plan,
        status: tenant.status,
        expiresAt: tenant.expiresAt,
      },
    };
  },
});

/**
 * Remover membership de um usuário
 * 
 * @param membershipId - ID do membership
 * @returns Confirmação da remoção
 */
export const removeMembership = mutation({
  args: {
    membershipId: v.id("memberships"),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar membership
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new ConvexError("Membership não encontrado");
    }
    
    // Remover membership
    await ctx.db.delete(args.membershipId);
    
    return {
      membershipId: args.membershipId,
      message: "Membership removido com sucesso",
    };
  },
});

/**
 * Atualizar role de um membership
 * 
 * @param membershipId - ID do membership
 * @param newRole - Nova role
 * @returns Confirmação da atualização
 */
export const updateMembershipRole = mutation({
  args: {
    membershipId: v.id("memberships"),
    newRole: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar membership
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new ConvexError("Membership não encontrado");
    }
    
    // Validar nova role
    const validRoles = ["admin", "manager", "employee"];
    if (!validRoles.includes(args.newRole)) {
      throw new ConvexError("Role inválida. Use: admin, manager ou employee");
    }
    
    // Atualizar membership
    await ctx.db.patch(args.membershipId, {
      role: args.newRole,
      updatedAt: Date.now(),
    });
    
    return {
      membershipId: args.membershipId,
      message: "Role atualizada com sucesso",
      newRole: args.newRole,
    };
  },
});

/**
 * Suspender membership de um usuário
 * 
 * @param membershipId - ID do membership
 * @param reason - Motivo da suspensão
 * @returns Confirmação da suspensão
 */
export const suspendMembership = mutation({
  args: {
    membershipId: v.id("memberships"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar membership
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new ConvexError("Membership não encontrado");
    }
    
    // Verificar se já está suspenso
    if (membership.status === "suspended") {
      throw new ConvexError("Membership já está suspenso");
    }
    
    // Suspender membership
    await ctx.db.patch(args.membershipId, {
      status: "suspended",
      updatedAt: Date.now(),
    });
    
    return {
      membershipId: args.membershipId,
      message: "Membership suspenso com sucesso",
      reason: args.reason,
    };
  },
});

/**
 * Reativar membership de um usuário
 * 
 * @param membershipId - ID do membership
 * @returns Confirmação da reativação
 */
export const reactivateMembership = mutation({
  args: {
    membershipId: v.id("memberships"),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar membership
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new ConvexError("Membership não encontrado");
    }
    
    // Verificar se já está ativo
    if (membership.status === "active") {
      throw new ConvexError("Membership já está ativo");
    }
    
    // Reativar membership
    await ctx.db.patch(args.membershipId, {
      status: "active",
      updatedAt: Date.now(),
    });
    
    return {
      membershipId: args.membershipId,
      message: "Membership reativado com sucesso",
    };
  },
});

/**
 * Listar todos os memberships de um tenant
 * 
 * @param tenantId - ID do tenant
 * @returns Lista de memberships do tenant
 */
export const listTenantMemberships = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    // Buscar memberships do tenant
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    
    return memberships.map(membership => ({
      _id: membership._id,
      tenantId: membership.tenantId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      lastAccess: membership.lastAccess,
      accessCount: membership.accessCount,
    }));
  },
});

/**
 * Obter estatísticas dos memberships
 * 
 * @returns Estatísticas gerais
 */
export const getMembershipStats = query({
  args: {},
  handler: async (ctx) => {
    const allMemberships = await ctx.db.query("memberships").collect();
    
    const stats = {
      total: allMemberships.length,
      active: allMemberships.filter(m => m.status === "active").length,
      suspended: allMemberships.filter(m => m.status === "suspended").length,
      inactive: allMemberships.filter(m => m.status === "inactive").length,
      byRole: {
        admin: allMemberships.filter(m => m.role === "admin").length,
        manager: allMemberships.filter(m => m.role === "manager").length,
        employee: allMemberships.filter(m => m.role === "employee").length,
      },
    };
    
    return stats;
  },
});
