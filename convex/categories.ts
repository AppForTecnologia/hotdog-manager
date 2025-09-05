import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withTenantAuth } from "./utils/auth";

/**
 * Funções para gerenciar categorias de produtos no sistema HotDog Manager
 * Inclui operações de CRUD e consultas específicas
 */

/**
 * Query para listar todas as categorias ativas
 * Retorna categorias ordenadas por nome
 */
export const listActive = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const categories = await ctx.db
        .query("categories")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Ordenar por nome
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});

/**
 * Query para buscar categoria por ID
 * Retorna uma categoria específica com todas as informações
 */
export const getById = query({
  args: { 
    tenantId: v.id("tenants"),
    id: v.id("categories") 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const category = await ctx.db.get(args.id);
      
      if (!category || !category.isActive || category.tenantId !== args.tenantId) {
        return null;
      }
      
      return category;
    });
  },
});

/**
 * Query para buscar categoria por nome
 * Útil para verificar se uma categoria já existe
 */
export const getByName = query({
  args: { 
    tenantId: v.id("tenants"),
    name: v.string() 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const categories = await ctx.db
        .query("categories")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("name"), args.name),
            q.eq(q.field("isActive"), true)
          )
        )
        .collect();

      return categories[0] || null;
    });
  },
});

/**
 * Query para listar categorias com contagem de produtos
 * Retorna categorias com número de produtos ativos
 */
export const listWithProductCount = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const categories = await ctx.db
        .query("categories")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Ordenar por nome
      const sortedCategories = categories.sort((a, b) => a.name.localeCompare(b.name));

      // Contar produtos para cada categoria
      const categoriesWithCount = await Promise.all(
        sortedCategories.map(async (category) => {
          const productCount = await ctx.db
            .query("products")
            .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
            .filter((q) => 
              q.and(
                q.eq(q.field("categoryId"), category._id),
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
    });
  },
});

/**
 * Mutation para criar uma nova categoria
 * Cria uma categoria com validações básicas
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      // Verificar se nome já existe
      const existingCategory = await ctx.db
        .query("categories")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("name"), args.name),
            q.eq(q.field("isActive"), true)
          )
        )
        .first();
      
      if (existingCategory) {
        throw new Error("Categoria com este nome já existe");
      }

      const now = Date.now();
      
      const categoryId = await ctx.db.insert("categories", {
        tenantId: args.tenantId,
        ...args,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return categoryId;
    });
  },
});

/**
 * Mutation para atualizar uma categoria existente
 * Atualiza campos específicos de uma categoria
 */
export const update = mutation({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const { id, tenantId, ...updates } = args;
      
      // Verificar se categoria existe
      const existingCategory = await ctx.db.get(id);
      if (!existingCategory || existingCategory.tenantId !== tenantId) {
        throw new Error("Categoria não encontrada");
      }

      // Verificar se novo nome já existe (se fornecido)
      if (updates.name && updates.name !== existingCategory.name) {
        const duplicateCategory = await ctx.db
          .query("categories")
          .withIndex("byTenant", (q) => q.eq("tenantId", tenantId))
          .filter((q) => 
            q.and(
              q.neq(q.field("_id"), id),
              q.eq(q.field("name"), updates.name!),
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
    });
  },
});

/**
 * Mutation para deletar uma categoria (soft delete)
 * Marca a categoria como inativa sem remover do banco
 */
export const remove = mutation({
  args: { 
    tenantId: v.id("tenants"),
    id: v.id("categories") 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const category = await ctx.db.get(args.id);
      
      if (!category || category.tenantId !== args.tenantId) {
        throw new Error("Categoria não encontrada");
      }

      // Verificar se há produtos usando esta categoria
      const productsInCategory = await ctx.db
        .query("products")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("categoryId"), args.id),
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
    });
  },
});



/**
 * Query para buscar categorias por termo de busca
 * Útil para autocomplete e busca de categorias
 */
export const searchByName = query({
  args: { 
    tenantId: v.id("tenants"),
    searchTerm: v.string() 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      if (!args.searchTerm.trim()) {
        return [];
      }

      const searchLower = args.searchTerm.toLowerCase();
      
      const categories = await ctx.db
        .query("categories")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("isActive"), true),
            q.or(
              q.gte(q.field("name"), searchLower),
              q.lte(q.field("name"), searchLower + "\uffff")
            )
          )
        )
        .collect();

      // Ordenar por nome e filtrar resultados que realmente contêm o termo de busca
      return categories
        .filter(category => 
          category.name.toLowerCase().includes(searchLower)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});


