import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Funções para gerenciar clientes no sistema
 * Permite criar, listar, atualizar e excluir clientes para delivery
 */

/**
 * Lista todos os clientes ativos
 * @returns Array de clientes ativos ordenados por nome
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .collect();
  },
});

/**
 * Busca clientes por nome ou telefone
 * @param searchTerm - Termo de busca
 * @returns Array de clientes que correspondem à busca
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const term = args.searchTerm.toLowerCase();
    
    const allCustomers = await ctx.db
      .query("customers")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return allCustomers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      customer.phone.includes(term)
    );
  },
});

/**
 * Cria um novo cliente
 * @param name - Nome completo do cliente
 * @param phone - Número de telefone
 * @param address - Endereço completo
 * @param notes - Observações adicionais
 * @returns ID do cliente criado
 */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("customers", {
      name: args.name,
      phone: args.phone,
      address: args.address,
      notes: args.notes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Atualiza um cliente existente
 * @param customerId - ID do cliente
 * @param name - Nome completo do cliente
 * @param phone - Número de telefone
 * @param address - Endereço completo
 * @param notes - Observações adicionais
 * @returns ID do cliente atualizado
 */
export const update = mutation({
  args: {
    customerId: v.id("customers"),
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.customerId, {
      name: args.name,
      phone: args.phone,
      address: args.address,
      notes: args.notes,
      updatedAt: Date.now(),
    });
    
    return args.customerId;
  },
});

/**
 * Desativa um cliente (soft delete)
 * @param customerId - ID do cliente
 * @returns ID do cliente desativado
 */
export const deactivate = mutation({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.customerId, {
      isActive: false,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return args.customerId;
  },
});

/**
 * Busca um cliente específico por ID
 * @param customerId - ID do cliente
 * @returns Cliente encontrado ou null
 */
export const getById = query({
  args: {
    customerId: v.id("customers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId);
  },
});
