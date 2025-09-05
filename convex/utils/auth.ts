import { ConvexError } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx, MutationCtx } from "../_generated/server";

/**
 * Requer que o usuário esteja autenticado via Clerk
 * Retorna o ID do usuário no Clerk ou lança erro se não autenticado
 * 
 * @param ctx - Contexto da query/mutation do Convex
 * @returns ID do usuário no Clerk
 * @throws ConvexError se usuário não estiver autenticado
 */
export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  
  if (!identity) {
    throw new ConvexError("Usuário não autenticado");
  }
  
  return identity.subject;
}

/**
 * Executa uma função com validação completa de tenant
 * Verifica se o usuário está autenticado, tem membership ativo no tenant,
 * se o tenant está ativo e não expirado
 * 
 * @param ctx - Contexto da query/mutation do Convex
 * @param tenantId - ID do tenant a ser validado
 * @param fn - Função a ser executada após validação
 * @returns Resultado da função executada
 * @throws ConvexError se alguma validação falhar
 */
export async function withTenantAuth<T>(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  fn: (userId: string, tenant: Doc<"tenants">, membership: Doc<"memberships">) => Promise<T>
): Promise<T> {
  // 1. Verificar se usuário está autenticado
  const userId = await requireUserId(ctx);
  
  // 2. Buscar o tenant
  const tenant = await ctx.db.get(tenantId);
  if (!tenant) {
    throw new ConvexError("Tenant não encontrado");
  }
  
  // 3. Verificar se o tenant está ativo
  if (tenant.status !== "active") {
    throw new ConvexError(`TENANT_SUSPENDED: Tenant está ${tenant.status}. Acesso negado.`);
  }
  
  // 4. Verificar se o tenant não expirou
  const now = Date.now();
  if (tenant.expiresAt < now) {
    throw new ConvexError(`TENANT_EXPIRED: Tenant expirado em ${new Date(tenant.expiresAt).toLocaleDateString('pt-BR')}. Renovação necessária.`);
  }
  
  // 5. Buscar o membership do usuário no tenant
  const membership = await ctx.db
    .query("memberships")
    .withIndex("byTenantAndUser", (q) => 
      q.eq("tenantId", tenantId).eq("userId", userId)
    )
    .first();
    
  if (!membership) {
    throw new ConvexError("Usuário não tem acesso a este tenant");
  }
  
  // 6. Verificar se o membership está ativo
  if (membership.status !== "active") {
    throw new ConvexError(`Membership está ${membership.status}. Acesso negado.`);
  }
  
  // 7. Atualizar último acesso e contador (apenas em mutations)
  if ('patch' in ctx.db) {
    await ctx.db.patch(membership._id, {
      lastAccess: now,
      accessCount: membership.accessCount + 1,
      updatedAt: now,
    });
  }
  
  // 8. Executar a função com os dados validados
  return await fn(userId, tenant, membership);
}

/**
 * Verifica se um usuário tem uma role específica em um tenant
 * 
 * @param ctx - Contexto da query/mutation do Convex
 * @param tenantId - ID do tenant
 * @param userId - ID do usuário no Clerk
 * @param requiredRole - Role mínima necessária
 * @returns true se o usuário tem a role necessária
 */
export async function hasRoleInTenant(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  userId: string,
  requiredRole: "admin" | "manager" | "employee"
): Promise<boolean> {
  const membership = await ctx.db
    .query("memberships")
    .withIndex("byTenantAndUser", (q) => 
      q.eq("tenantId", tenantId).eq("userId", userId)
    )
    .first();
    
  if (!membership || membership.status !== "active") {
    return false;
  }
  
  // Hierarquia de roles: admin > manager > employee
  const roleHierarchy = { admin: 3, manager: 2, employee: 1 };
  const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];
  
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Requer que o usuário tenha uma role específica em um tenant
 * 
 * @param ctx - Contexto da query/mutation do Convex
 * @param tenantId - ID do tenant
 * @param requiredRole - Role mínima necessária
 * @returns ID do usuário no Clerk
 * @throws ConvexError se usuário não tiver a role necessária
 */
export async function requireRoleInTenant(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  requiredRole: "admin" | "manager" | "employee"
): Promise<string> {
  const userId = await requireUserId(ctx);
  
  const hasRole = await hasRoleInTenant(ctx, tenantId, userId, requiredRole);
  if (!hasRole) {
    throw new ConvexError(`Acesso negado. Role '${requiredRole}' ou superior necessária.`);
  }
  
  return userId;
}

/**
 * Verifica o status de um tenant sem bloquear o acesso
 * Útil para verificar se um tenant está expirado ou suspenso antes de tentar acessar
 * 
 * @param ctx - Contexto da query/mutation do Convex
 * @param tenantId - ID do tenant
 * @returns Status do tenant: 'active' | 'expired' | 'suspended' | 'not_found'
 */
export async function getTenantStatus(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">
): Promise<'active' | 'expired' | 'suspended' | 'not_found'> {
  const tenant = await ctx.db.get(tenantId);
  
  if (!tenant) {
    return 'not_found';
  }
  
  if (tenant.status !== "active") {
    return 'suspended';
  }
  
  const now = Date.now();
  if (tenant.expiresAt < now) {
    return 'expired';
  }
  
  return 'active';
}

/**
 * Verifica se um tenant está próximo do vencimento
 * 
 * @param ctx - Contexto da query/mutation do Convex
 * @param tenantId - ID do tenant
 * @param daysThreshold - Número de dias para considerar próximo do vencimento (padrão: 7)
 * @returns true se está próximo do vencimento
 */
export async function isTenantExpiringSoon(
  ctx: QueryCtx | MutationCtx,
  tenantId: Id<"tenants">,
  daysThreshold: number = 7
): Promise<boolean> {
  const tenant = await ctx.db.get(tenantId);
  
  if (!tenant || tenant.status !== "active") {
    return false;
  }
  
  const now = Date.now();
  const expiresAt = tenant.expiresAt;
  const diffMs = expiresAt - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
}