import { ConvexError, v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { requireUserId } from "./utils/auth";
import { normalizeCnpj, isValidCnpj } from "./utils/cnpj";
import { api } from "./_generated/api";

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

/**
 * Verificar CNPJ e senha com rate limiting
 * 
 * @param cnpj - CNPJ do tenant
 * @param password - Senha do tenant
 * @returns Dados do tenant se credenciais estiverem corretas
 */
export const verifyCnpjAndPassword = action({
  args: {
    cnpj: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Verificar se usuário está autenticado
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Usuário não autenticado");
    }
    const userId = identity.subject;
    
    // Normalizar CNPJ
    const normalizedCnpj = normalizeCnpj(args.cnpj);
    if (!isValidCnpj(normalizedCnpj)) {
      throw new ConvexError("CNPJ inválido");
    }
    
    // Verificar rate limiting (5 tentativas por minuto)
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    
    // Buscar tentativas recentes do usuário usando uma query interna
    const recentAttempts = await ctx.runQuery(
      "tenants:getRateLimitAttempts" as any,
      {
        userId,
        since: oneMinuteAgo,
      }
    );
    
    // Verificar se excedeu o limite
    if (recentAttempts.length >= 5) {
      throw new ConvexError("Muitas tentativas. Aguarde 1 minuto antes de tentar novamente.");
    }
    
    // Registrar tentativa usando uma mutation interna
    await ctx.runMutation(
      "tenants:recordRateLimitAttempt" as any,
      {
        userId,
        timestamp: now,
        success: false, // Será atualizado se bem-sucedido
      }
    );
    
    // Buscar tenant por CNPJ usando uma query interna
    const tenant = await ctx.runQuery(
      "tenants:getTenantByCnpjInternal" as any,
      {
        cnpj: normalizedCnpj,
      }
    );
    
    if (!tenant) {
      throw new ConvexError("CNPJ não encontrado");
    }
    
    // Verificar se tenant está ativo
    if (tenant.status !== "active") {
      throw new ConvexError(`Tenant está ${tenant.status}`);
    }
    
    // Verificar se tenant não expirou
    if (tenant.expiresAt < now) {
      throw new ConvexError("Tenant expirado");
    }
    
    // Verificar senha (implementação simplificada)
    // Em produção, seria necessário armazenar o hash da senha no tenant
    const isValidPassword = await verifyPassword(args.password, "default_hash");
    
    if (!isValidPassword) {
      throw new ConvexError("Senha incorreta");
    }
    
    // Atualizar tentativa como bem-sucedida
    if (recentAttempts.length > 0) {
      await ctx.runMutation(
        "tenants:updateRateLimitAttempt" as any,
        {
          attemptId: recentAttempts[recentAttempts.length - 1]._id,
          success: true,
        }
      );
    }
    
    // Retornar dados do tenant (sem informações sensíveis)
    return {
      tenantId: tenant._id,
      cnpj: tenant.cnpj,
      companyName: tenant.companyName,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      plan: tenant.plan,
      status: tenant.status,
      expiresAt: tenant.expiresAt,
      message: "Credenciais válidas",
    };
  },
});

/**
 * Função auxiliar para buscar tentativas de rate limiting
 */
export const getRateLimitAttempts = query({
  args: {
    userId: v.string(),
    since: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rateLimitAttempts")
      .withIndex("byUser", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gt(q.field("timestamp"), args.since))
      .collect();
  },
});

/**
 * Função auxiliar para registrar tentativa de rate limiting
 */
export const recordRateLimitAttempt = mutation({
  args: {
    userId: v.string(),
    timestamp: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rateLimitAttempts", {
      userId: args.userId,
      timestamp: args.timestamp,
      success: args.success,
    });
  },
});

/**
 * Função auxiliar para atualizar tentativa de rate limiting
 */
export const updateRateLimitAttempt = mutation({
  args: {
    attemptId: v.id("rateLimitAttempts"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.attemptId, {
      success: args.success,
    });
  },
});

/**
 * Função auxiliar para buscar tenant por CNPJ (uso interno)
 */
export const getTenantByCnpjInternal = query({
  args: {
    cnpj: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("byCnpj", (q) => q.eq("cnpj", args.cnpj))
      .first();
  },
});

/**
 * Query para verificar o status do tenant atual do usuário
 * Retorna informações sobre expiração e status do tenant
 */
export const getCurrentTenantStatus = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    
    // Verificar se o usuário tem membership no tenant
    const membership = await ctx.db
      .query("memberships")
      .withIndex("byTenantAndUser", (q) => 
        q.eq("tenantId", args.tenantId).eq("userId", userId)
      )
      .first();
      
    if (!membership) {
      return {
        status: 'no_access',
        message: 'Usuário não tem acesso a este tenant',
        tenant: null,
        membership: null,
        isExpired: false,
        isSuspended: false,
        expiresAt: null,
        daysUntilExpiry: null,
      };
    }
    
    // Buscar o tenant
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) {
      return {
        status: 'not_found',
        message: 'Tenant não encontrado',
        tenant: null,
        membership: null,
        isExpired: false,
        isSuspended: false,
        expiresAt: null,
        daysUntilExpiry: null,
      };
    }
    
    const now = Date.now();
    const isExpired = tenant.expiresAt < now;
    const isSuspended = tenant.status !== "active";
    const daysUntilExpiry = Math.ceil((tenant.expiresAt - now) / (1000 * 60 * 60 * 24));
    
    let status: 'active' | 'expired' | 'suspended' | 'expiring_soon' = 'active';
    let message = 'Tenant ativo';
    
    if (isSuspended) {
      status = 'suspended';
      message = `Tenant está ${tenant.status}`;
    } else if (isExpired) {
      status = 'expired';
      message = `Tenant expirado em ${new Date(tenant.expiresAt).toLocaleDateString('pt-BR')}`;
    } else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      status = 'expiring_soon';
      message = `Tenant expira em ${daysUntilExpiry} dias`;
    }
    
    return {
      status,
      message,
      tenant: {
        _id: tenant._id,
        companyName: tenant.companyName,
        cnpj: tenant.cnpj,
        plan: tenant.plan,
        status: tenant.status,
        expiresAt: tenant.expiresAt,
        createdAt: tenant.createdAt,
      },
      membership: {
        _id: membership._id,
        role: membership.role,
        status: membership.status,
        lastAccess: membership.lastAccess,
        accessCount: membership.accessCount,
      },
      isExpired,
      isSuspended,
      expiresAt: tenant.expiresAt,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
    };
  },
});

/**
 * Mutation para marcar tenants expirados
 * Usado pelo cron diário para atualizar status de tenants vencidos
 */
export const markExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Buscar todos os tenants ativos que expiraram
    const expiredTenants = await ctx.db
      .query("tenants")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    console.log(`[CRON] Encontrados ${expiredTenants.length} tenants expirados`);
    
    let markedCount = 0;
    const errors: string[] = [];
    
    // Marcar cada tenant como expirado
    for (const tenant of expiredTenants) {
      try {
        await ctx.db.patch(tenant._id, {
          status: "expired",
          updatedAt: now,
        });
        
        markedCount++;
        console.log(`[CRON] Tenant ${tenant.companyName} (${tenant.cnpj}) marcado como expirado`);
        
        // Opcional: Desativar memberships do tenant expirado
        const memberships = await ctx.db
          .query("memberships")
          .withIndex("byTenant", (q) => q.eq("tenantId", tenant._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();
        
        for (const membership of memberships) {
          await ctx.db.patch(membership._id, {
            status: "inactive",
            updatedAt: now,
          });
        }
        
        console.log(`[CRON] ${memberships.length} memberships desativados para tenant ${tenant.companyName}`);
        
      } catch (error) {
        const errorMsg = `Erro ao marcar tenant ${tenant.companyName} (${tenant._id}): ${error}`;
        errors.push(errorMsg);
        console.error(`[CRON] ${errorMsg}`);
      }
    }
    
    // Retornar resultado da operação
    return {
      success: true,
      totalExpired: expiredTenants.length,
      markedCount,
      errors: errors.length > 0 ? errors : null,
      timestamp: now,
    };
  },
});

/**
 * Query para obter estatísticas de expiração
 * Útil para monitoramento do cron
 */
export const getExpirationStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayFromNow = now + (24 * 60 * 60 * 1000);
    const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
    
    // Buscar todos os tenants
    const allTenants = await ctx.db.query("tenants").collect();
    
    const stats = {
      total: allTenants.length,
      active: 0,
      expired: 0,
      suspended: 0,
      expiringToday: 0,
      expiringIn7Days: 0,
      expiredToday: 0,
    };
    
    allTenants.forEach(tenant => {
      if (tenant.status === "active") {
        stats.active++;
        
        if (tenant.expiresAt < now) {
          stats.expired++;
          // Verificar se expirou hoje (últimas 24 horas)
          if (tenant.expiresAt > now - (24 * 60 * 60 * 1000)) {
            stats.expiredToday++;
          }
        } else if (tenant.expiresAt <= oneDayFromNow) {
          stats.expiringToday++;
        } else if (tenant.expiresAt <= sevenDaysFromNow) {
          stats.expiringIn7Days++;
        }
      } else if (tenant.status === "suspended") {
        stats.suspended++;
      } else if (tenant.status === "expired") {
        stats.expired++;
      }
    });
    
    return stats;
  },
});

/**
 * Action para testar o cron manualmente
 * Útil para desenvolvimento e debugging
 */
export const testMarkExpired = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    result?: any;
    error?: string;
    timestamp: number;
  }> => {
    console.log("[TEST] Iniciando teste manual do markExpired");
    
    try {
      const result: any = await ctx.runMutation(api.tenants.markExpired, {});
      
      console.log("[TEST] Resultado do teste:", result);
      
      return {
        success: true,
        message: "Teste executado com sucesso",
        result,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("[TEST] Erro no teste:", error);
      
      return {
        success: false,
        message: `Erro no teste: ${error}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * Query para verificar status do cron
 * Retorna informações sobre a última execução e próximas execuções
 */
export const getCronStatus = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayFromNow = now + (24 * 60 * 60 * 1000);
    
    // Buscar tenants que expirarão nas próximas 24 horas
    const expiringSoon = await ctx.db
      .query("tenants")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .filter((q) => q.and(
        q.gte(q.field("expiresAt"), now),
        q.lte(q.field("expiresAt"), oneDayFromNow)
      ))
      .collect();
    
    // Buscar tenants já expirados mas ainda marcados como ativos
    const shouldBeExpired = await ctx.db
      .query("tenants")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    return {
      currentTime: now,
      expiringIn24Hours: expiringSoon.length,
      shouldBeExpired: shouldBeExpired.length,
      nextCronRun: "03:00 UTC (diário)",
      cronStatus: "Ativo",
      lastCheck: now,
    };
  },
});