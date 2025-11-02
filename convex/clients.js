import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Busca todos os clientes
 * @returns {Promise<Array>} Lista de todos os clientes
 */
export const getAllClients = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("clients")
      .order("desc")
      .collect();
  },
});

/**
 * Busca um cliente por ID
 * @param {string} clientId - ID do cliente
 * @returns {Promise<Object|null>} Cliente encontrado ou null
 */
export const getClientById = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.clientId);
  },
});

/**
 * Busca um cliente por email
 * @param {string} email - Email do cliente
 * @returns {Promise<Object|null>} Cliente encontrado ou null
 */
export const getClientByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return client;
  },
});

/**
 * Busca um cliente por telefone
 * @param {string} phone - Telefone do cliente
 * @returns {Promise<Object|null>} Cliente encontrado ou null
 */
export const getClientByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();
    return client;
  },
});

/**
 * Cria um novo cliente
 * @param {Object} clientData - Dados do cliente
 * @returns {Promise<string>} ID do cliente criado
 */
export const createClient = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const clientId = await ctx.db.insert("clients", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return clientId;
  },
});

/**
 * Atualiza um cliente existente
 * @param {string} clientId - ID do cliente
 * @param {Object} updates - Campos a serem atualizados
 * @returns {Promise<void>}
 */
export const updateClient = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clientId, ...updates } = args;
    await ctx.db.patch(clientId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Remove um cliente
 * @param {string} clientId - ID do cliente
 * @returns {Promise<void>}
 */
export const deleteClient = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.clientId);
  },
});

/**
 * Busca clientes por nome (busca parcial)
 * @param {string} searchTerm - Termo de busca
 * @returns {Promise<Array>} Lista de clientes que correspondem à busca
 */
export const searchClientsByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    return clients.filter(client => 
      client.name.toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});
