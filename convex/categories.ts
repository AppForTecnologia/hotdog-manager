import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Funções para gerenciar categorias de produtos no sistema HotDog Manager
 * Inclui operações de CRUD e consultas específicas
 */

/**
 * Query para listar todas as categorias ativas
 * Retorna categorias ordenadas por nome
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Ordenar por nome
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Query para buscar categoria por ID
 * Retorna uma categoria específica com todas as informações
 */
export const getById = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    
    if (!category || !category.isActive) {
      return null;
    }
    
    return category;
  },
});

/**
 * Query para buscar categoria por nome
 * Útil para verificar se uma categoria já existe
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return categories[0] || null;
  },
});

/**
 * Query para listar categorias com contagem de produtos
 * Retorna categorias com número de produtos ativos
 */
export const listWithProductCount = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Ordenar por nome
    const sortedCategories = categories.sort((a, b) => a.name.localeCompare(b.name));

    // Contar produtos para cada categoria
    const categoriesWithCount = await Promise.all(
      sortedCategories.map(async (category) => {
        const productCount = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .filter((q) => 
            q.and(
              q.eq(q.field("isActive"), true),
              q.eq(q.field("deletedAt"), undefined)
            )
          )
          .collect();

        return {
          ...category,
          productCount: productCount.length,
        };
      })
    );

    return categoriesWithCount;
  },
});

/**
 * Mutation para criar uma nova categoria
 * Cria uma categoria com validações básicas
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verificar se nome já existe
    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (existingCategory) {
      throw new Error("Categoria com este nome já existe");
    }

    const now = Date.now();
    
    const categoryId = await ctx.db.insert("categories", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

/**
 * Mutation para atualizar uma categoria existente
 * Atualiza campos específicos de uma categoria
 */
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Verificar se categoria existe
    const existingCategory = await ctx.db.get(id);
    if (!existingCategory) {
      throw new Error("Categoria não encontrada");
    }

    // Verificar se novo nome já existe (se fornecido)
    if (updates.name && updates.name !== existingCategory.name) {
      const duplicateCategory = await ctx.db
        .query("categories")
        .withIndex("by_name", (q) => q.eq("name", updates.name!))
        .filter((q) => 
          q.and(
            q.neq(q.field("_id"), id),
            q.eq(q.field("isActive"), true)
          )
        )
        .first();
      
      if (duplicateCategory) {
        throw new Error("Categoria com este nome já existe");
      }
    }

    // Atualizar categoria
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Mutation para deletar uma categoria (soft delete)
 * Marca a categoria como inativa sem remover do banco
 */
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    
    if (!category) {
      throw new Error("Categoria não encontrada");
    }

    // Verificar se há produtos usando esta categoria
    const productsInCategory = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    if (productsInCategory.length > 0) {
      throw new Error("Não é possível deletar categoria que possui produtos");
    }

    // Soft delete - marcar como inativa
    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});



/**
 * Query para buscar categorias por termo de busca
 * Útil para autocomplete e busca de categorias
 */
export const searchByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();
    
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => 
        q.or(
          q.gte(q.field("name"), searchLower),
          q.lte(q.field("name"), searchLower + "\uffff")
        )
      )
      .collect();

    // Ordenar por nome e filtrar resultados que realmente contêm o termo de busca
    return categories
      .filter(category => 
        category.name.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});


