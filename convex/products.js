import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Busca todos os produtos disponíveis
 * @returns {Promise<Array>} Lista de produtos disponíveis
 */
export const getAvailableProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_availability", (q) => q.eq("available", true))
      .collect();
  },
});

/**
 * Busca todos os produtos por categoria
 * @param {string} category - Categoria dos produtos
 * @returns {Promise<Array>} Lista de produtos da categoria
 */
export const getProductsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("available"), true))
      .collect();
  },
});

/**
 * Busca um produto específico por ID
 * @param {string} productId - ID do produto
 * @returns {Promise<Object|null>} Produto encontrado ou null
 */
export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

/**
 * Cria um novo produto
 * @param {Object} productData - Dados do produto
 * @returns {Promise<string>} ID do produto criado
 */
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    category: v.string(),
    ingredients: v.array(v.string()),
    available: v.boolean(),
    imageUrl: v.optional(v.string()),
    preparationTime: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const productId = await ctx.db.insert("products", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return productId;
  },
});

/**
 * Atualiza um produto existente
 * @param {string} productId - ID do produto
 * @param {Object} updates - Campos a serem atualizados
 * @returns {Promise<void>}
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    ingredients: v.optional(v.array(v.string())),
    available: v.optional(v.boolean()),
    imageUrl: v.optional(v.string()),
    preparationTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { productId, ...updates } = args;
    await ctx.db.patch(productId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Remove um produto
 * @param {string} productId - ID do produto
 * @returns {Promise<void>}
 */
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.productId);
  },
});

/**
 * Busca todas as categorias de produtos
 * @returns {Promise<Array>} Lista de categorias únicas
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const categories = [...new Set(products.map(p => p.category))];
    return categories.sort();
  },
});
