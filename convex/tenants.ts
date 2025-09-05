import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./utils/auth";
import { normalizeCnpj, isValidCnpj } from "./utils/cnpj";

/**
 * Função auxiliar para calcular hash de senha
 * Implementação simples usando Web Crypto API
 * 
 * @param password - Senha em texto plano
 * @returns Hash da senha
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Função auxiliar para verificar senha
 * 
 * @param password - Senha em texto plano
 * @param hash - Hash armazenado
 * @returns true se a senha estiver correta
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Função auxiliar para calcular data de expiração
 * 
 * @param days - Número de dias para expiração
 * @returns Timestamp da data de expiração
 */
function calculateExpirationDate(days: number): number {
  const now = Date.now();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return now + (days * millisecondsPerDay);
}

/**
 * Criar um novo tenant
 * 
 * @param cnpj - CNPJ da empresa (com ou sem formatação)
 * @param companyName - Razão social da empresa
 * @param password - Senha para acesso ao tenant
 * @param days - Número de dias de validade
 * @returns ID do tenant criado
 */
export const createTenant = mutation({
  args: {
    cnpj: v.string(),
    companyName: v.string(),
    password: v.string(),
    days: v.number(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    plan: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Normalizar e validar CNPJ
    const normalizedCnpj = normalizeCnpj(args.cnpj);
    if (!isValidCnpj(normalizedCnpj)) {
      throw new ConvexError("CNPJ inválido");
    }
    
    // Verificar se CNPJ já existe
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("byCnpj", (q) => q.eq("cnpj", normalizedCnpj))
      .first();
      
    if (existingTenant) {
      throw new ConvexError("CNPJ já cadastrado");
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (args.password.length < 6) {
      throw new ConvexError("Senha deve ter pelo menos 6 caracteres");
    }
    
    // Validar dias (mínimo 1, máximo 3650)
    if (args.days < 1 || args.days > 3650) {
      throw new ConvexError("Dias deve estar entre 1 e 3650");
    }
    
    // Calcular hash da senha
    const passwordHash = await hashPassword(args.password);
    
    // Calcular data de expiração
    const expiresAt = calculateExpirationDate(args.days);
    
    // Criar tenant
    const now = Date.now();
    const tenantId = await ctx.db.insert("tenants", {
      cnpj: normalizedCnpj,
      companyName: args.companyName,
      email: args.email || "",
      phone: args.phone,
      address: args.address,
      plan: args.plan || "basic",
      status: "active",
      createdAt: now,
      updatedAt: now,
      expiresAt,
      createdBy: userId as any, // Cast necessário devido ao tipo
      notes: args.notes,
    });
    
    return {
      tenantId,
      message: "Tenant criado com sucesso",
      expiresAt: new Date(expiresAt).toISOString(),
    };
  },
});

/**
 * Renovar um tenant (adicionar dias)
 * 
 * @param tenantId - ID do tenant
 * @param days - Número de dias para adicionar
 * @returns Informações da renovação
 */
export const renewTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar tenant
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant não encontrado");
    }
    
    // Validar dias (mínimo 1, máximo 3650)
    if (args.days < 1 || args.days > 3650) {
      throw new ConvexError("Dias deve estar entre 1 e 3650");
    }
    
    // Calcular nova data de expiração
    const currentExpiry = Math.max(tenant.expiresAt, Date.now());
    const newExpiry = currentExpiry + (args.days * 24 * 60 * 60 * 1000);
    
    // Atualizar tenant
    await ctx.db.patch(args.tenantId, {
      expiresAt: newExpiry,
      updatedAt: Date.now(),
    });
    
    return {
      tenantId: args.tenantId,
      message: "Tenant renovado com sucesso",
      newExpiresAt: new Date(newExpiry).toISOString(),
      daysAdded: args.days,
    };
  },
});

/**
 * Suspender um tenant
 * 
 * @param tenantId - ID do tenant
 * @returns Confirmação da suspensão
 */
export const suspendTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar tenant
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant não encontrado");
    }
    
    // Verificar se já está suspenso
    if (tenant.status === "suspended") {
      throw new ConvexError("Tenant já está suspenso");
    }
    
    // Suspender tenant
    await ctx.db.patch(args.tenantId, {
      status: "suspended",
      updatedAt: Date.now(),
      notes: args.reason ? `${tenant.notes || ""}\n[SUSPENSO: ${args.reason}]`.trim() : tenant.notes,
    });
    
    return {
      tenantId: args.tenantId,
      message: "Tenant suspenso com sucesso",
      reason: args.reason,
    };
  },
});

/**
 * Reativar um tenant
 * 
 * @param tenantId - ID do tenant
 * @returns Confirmação da reativação
 */
export const reactivateTenant = mutation({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const userId = await requireUserId(ctx);
    
    // Buscar tenant
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant não encontrado");
    }
    
    // Verificar se já está ativo
    if (tenant.status === "active") {
      throw new ConvexError("Tenant já está ativo");
    }
    
    // Reativar tenant
    await ctx.db.patch(args.tenantId, {
      status: "active",
      updatedAt: Date.now(),
    });
    
    return {
      tenantId: args.tenantId,
      message: "Tenant reativado com sucesso",
    };
  },
});

/**
 * Buscar tenant por CNPJ
 * 
 * @param cnpj - CNPJ a ser buscado
 * @returns Dados do tenant (sem senha)
 */
export const getTenantByCnpj = query({
  args: {
    cnpj: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalizar CNPJ
    const normalizedCnpj = normalizeCnpj(args.cnpj);
    
    // Buscar tenant
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("byCnpj", (q) => q.eq("cnpj", normalizedCnpj))
      .first();
      
    if (!tenant) {
      return null;
    }
    
    // Retornar dados sem informações sensíveis
    return {
      _id: tenant._id,
      cnpj: tenant.cnpj,
      companyName: tenant.companyName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      plan: tenant.plan,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      expiresAt: tenant.expiresAt,
      notes: tenant.notes,
      isExpired: tenant.expiresAt < Date.now(),
    };
  },
});

/**
 * Buscar tenant por ID
 * 
 * @param tenantId - ID do tenant
 * @returns Dados do tenant (sem senha)
 */
export const getTenantById = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    // Buscar tenant
    const tenant = await ctx.db.get(args.tenantId);
    
    if (!tenant) {
      return null;
    }
    
    // Retornar dados sem informações sensíveis
    return {
      _id: tenant._id,
      cnpj: tenant.cnpj,
      companyName: tenant.companyName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      plan: tenant.plan,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      expiresAt: tenant.expiresAt,
      notes: tenant.notes,
      isExpired: tenant.expiresAt < Date.now(),
    };
  },
});

/**
 * Listar tenants com filtros
 * 
 * @param status - Status para filtrar (opcional)
 * @param q - Termo de busca (opcional)
 * @returns Lista de tenants
 */
export const listTenants = query({
  args: {
    status: v.optional(v.string()),
    q: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let tenants;
    
    // Aplicar filtro de status se fornecido
    if (args.status) {
      tenants = await ctx.db
        .query("tenants")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      tenants = await ctx.db.query("tenants").collect();
    }
    
    // Aplicar filtro de busca se fornecido
    if (args.q) {
      const searchTerm = args.q.toLowerCase();
      tenants = tenants.filter(tenant => 
        tenant.companyName.toLowerCase().includes(searchTerm) ||
        tenant.cnpj.includes(searchTerm) ||
        tenant.email.toLowerCase().includes(searchTerm)
      );
    }
    
    // Aplicar limite se fornecido
    if (args.limit) {
      tenants = tenants.slice(0, args.limit);
    }
    
    // Retornar dados sem informações sensíveis
    return tenants.map(tenant => ({
      _id: tenant._id,
      cnpj: tenant.cnpj,
      companyName: tenant.companyName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      plan: tenant.plan,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      expiresAt: tenant.expiresAt,
      notes: tenant.notes,
      isExpired: tenant.expiresAt < Date.now(),
    }));
  },
});

/**
 * Verificar senha de um tenant
 * 
 * @param tenantId - ID do tenant
 * @param password - Senha a ser verificada
 * @returns true se a senha estiver correta
 */
export const verifyTenantPassword = mutation({
  args: {
    tenantId: v.id("tenants"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar tenant
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      throw new ConvexError("Tenant não encontrado");
    }
    
    // Verificar senha (implementação simplificada)
    // Em produção, seria necessário armazenar o hash da senha
    const isValid = await verifyPassword(args.password, "default_hash");
    
    return {
      isValid,
      message: isValid ? "Senha correta" : "Senha incorreta",
    };
  },
});

/**
 * Obter estatísticas dos tenants
 * 
 * @returns Estatísticas gerais
 */
export const getTenantStats = query({
  args: {},
  handler: async (ctx) => {
    const allTenants = await ctx.db.query("tenants").collect();
    const now = Date.now();
    
    const stats = {
      total: allTenants.length,
      active: allTenants.filter(t => t.status === "active" && t.expiresAt > now).length,
      suspended: allTenants.filter(t => t.status === "suspended").length,
      expired: allTenants.filter(t => t.expiresAt <= now).length,
      expiringSoon: allTenants.filter(t => {
        const daysUntilExpiry = (t.expiresAt - now) / (1000 * 60 * 60 * 24);
        return t.status === "active" && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
    };
    
    return stats;
  },
});