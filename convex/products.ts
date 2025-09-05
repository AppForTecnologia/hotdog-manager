import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withTenantAuth } from "./utils/auth";

/**
 * Funções para gerenciar produtos no sistema HotDog Manager
 * Inclui operações de CRUD e consultas específicas
 */

/**
 * Query para listar todos os produtos ativos
 * Retorna produtos ordenados por nome, excluindo produtos deletados
 */
export const listActive = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const products = await ctx.db
        .query("products")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("isActive"), true),
            q.eq(q.field("deletedAt"), undefined)
          )
        )
        .order("asc")
        .collect();

      // Ordenar por nome após coletar (já que não temos índice por nome)
      return products.sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});

/**
 * Query para buscar produtos por categoria
 * Retorna produtos de uma categoria específica
 */
export const listByCategory = query({
  args: { 
    tenantId: v.id("tenants"),
    categoryId: v.id("categories") 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const products = await ctx.db
        .query("products")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("categoryId"), args.categoryId),
            q.eq(q.field("isActive"), true),
            q.eq(q.field("deletedAt"), undefined)
          )
        )
        .collect();

      // Ordenar por nome após coletar
      return products.sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});

/**
 * Query para listar produtos agrupados por categoria personalizada
 * Retorna produtos organizados em grupos configuráveis pelo usuário
 */
export const listGroupedByCategory = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      // Buscar grupos de produtos configurados
      const productGroups = await ctx.db
        .query("productGroups")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Se não há grupos configurados, inicializar grupos padrão
      if (productGroups.length === 0) {
        return {};
      }

      // Ordenar grupos por ordem de exibição
      const sortedGroups = productGroups.sort((a, b) => a.order - b.order);

      // Buscar todas as categorias ativas
      const categories = await ctx.db
        .query("categories")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

    // Criar estrutura de grupos dinâmica
    const groups: any = {};

    for (const productGroup of sortedGroups) {
      groups[productGroup.name] = {
        id: productGroup._id,
        title: productGroup.title,
        icon: productGroup.icon,
        color: productGroup.color,
        order: productGroup.order,
        categories: [],
        products: []
      };

      // Filtrar categorias que correspondem às palavras-chave do grupo
      const matchingCategories = categories.filter(cat => {
        const categoryName = cat.name.toLowerCase();
        return productGroup.keywords.some(keyword => 
          categoryName.includes(keyword.toLowerCase())
        );
      });

      groups[productGroup.name].categories = matchingCategories;
    }

    // Se nenhuma categoria foi associada automaticamente, distribuir manualmente
    const unassignedCategories = categories.filter(cat => {
      return !Object.values(groups).some((group: any) => 
        group.categories.some((groupCat: any) => groupCat._id === cat._id)
      );
    });

    // Associar categorias não atribuídas ao primeiro grupo disponível
    if (unassignedCategories.length > 0 && Object.keys(groups).length > 0) {
      const firstGroupKey = Object.keys(groups)[0];
      groups[firstGroupKey].categories.push(...unassignedCategories);
    }

    // Buscar produtos para cada grupo
    for (const groupKey of Object.keys(groups)) {
      const group = groups[groupKey];
      
      for (const category of group.categories) {
        const products = await ctx.db
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

        // Adicionar informações da categoria aos produtos
        const productsWithCategory = products.map(product => ({
          ...product,
          category: category
        }));

        group.products.push(...productsWithCategory);
      }

      // Ordenar produtos por nome
      group.products.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

      return groups;
    });
  },
});

/**
 * Query para buscar produto por ID
 * Retorna um produto específico com todas as informações
 */
export const getById = query({
  args: { 
    tenantId: v.id("tenants"),
    id: v.id("products") 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const product = await ctx.db.get(args.id);
      
      if (!product || product.deletedAt || product.tenantId !== args.tenantId) {
        return null;
      }
      
      return product;
    });
  },
});



/**
 * Query para buscar produto por SKU
 * Útil para leitura de códigos de barras
 */
export const getBySku = query({
  args: { 
    tenantId: v.id("tenants"),
    sku: v.string() 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const products = await ctx.db
        .query("products")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("sku"), args.sku),
            q.eq(q.field("isActive"), true),
            q.eq(q.field("deletedAt"), undefined)
          )
        )
        .collect();

      return products[0] || null;
    });
  },
});

/**
 * Mutation para criar um novo produto
 * Cria um produto com validações básicas
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    image: v.optional(v.string()),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      // Validações básicas
      if (args.price < 0) {
        throw new Error("Preço não pode ser negativo");
      }

      // Verificar se categoria foi fornecida
      if (!args.categoryId) {
        throw new Error("Categoria é obrigatória");
      }

      // Verificar se a categoria existe e está ativa
      const category = await ctx.db.get(args.categoryId);
      if (!category || !category.isActive || category.tenantId !== args.tenantId) {
        throw new Error("Categoria inválida ou inativa");
      }

      const now = Date.now();
      
      const productId = await ctx.db.insert("products", {
        tenantId: args.tenantId,
        name: args.name,
        description: args.description || "",
        price: args.price,
        imageUrl: args.image || "",
        categoryId: args.categoryId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      return productId;
    });
  },
});

/**
 * Mutation para atualizar um produto existente
 * Atualiza campos específicos de um produto
 */
export const update = mutation({
  args: {
    tenantId: v.id("tenants"),
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const { id, tenantId, ...updates } = args;
      
      // Verificar se produto existe e não foi deletado
      const existingProduct = await ctx.db.get(id);
      if (!existingProduct || existingProduct.deletedAt || existingProduct.tenantId !== tenantId) {
        throw new Error("Produto não encontrado");
      }

      // Validações
      if (updates.price !== undefined && updates.price < 0) {
        throw new Error("Preço não pode ser negativo");
      }

      // Validar categoria se fornecida
      if (updates.categoryId !== undefined) {
        const category = await ctx.db.get(updates.categoryId);
        if (!category || !category.isActive || category.tenantId !== tenantId) {
          throw new Error("Categoria inválida ou inativa");
        }
      }

      // Preparar campos para atualização
      const updateFields: any = {
        updatedAt: Date.now(),
      };

      if (updates.name !== undefined) updateFields.name = updates.name;
      if (updates.description !== undefined) updateFields.description = updates.description;
      if (updates.price !== undefined) updateFields.price = updates.price;
      if (updates.image !== undefined) updateFields.imageUrl = updates.image;
      if (updates.categoryId !== undefined) updateFields.categoryId = updates.categoryId;

      // Atualizar produto
      await ctx.db.patch(id, updateFields);

      return id;
    });
  },
});

/**
 * Mutation para deletar um produto (soft delete)
 * Marca o produto como deletado sem remover do banco
 */
export const removeProduct = mutation({
  args: { 
    tenantId: v.id("tenants"),
    id: v.id("products") 
  },
  handler: async (ctx, args) => {
    return await withTenantAuth(ctx, args.tenantId, async (userId, tenant, membership) => {
      const product = await ctx.db.get(args.id);
      
      if (!product || product.deletedAt || product.tenantId !== args.tenantId) {
        throw new Error("Produto não encontrado");
      }

      // Soft delete - marcar como deletado
      await ctx.db.patch(args.id, {
        deletedAt: Date.now(),
        isActive: false,
        updatedAt: Date.now(),
      });

      return args.id;
    });
  },
});



/**
 * Query para buscar produtos por nome (busca parcial)
 * Útil para autocomplete e busca de produtos
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
      
      const products = await ctx.db
        .query("products")
        .withIndex("byTenant", (q) => q.eq("tenantId", args.tenantId))
        .filter((q) => 
          q.and(
            q.eq(q.field("isActive"), true),
            q.eq(q.field("deletedAt"), undefined),
            q.or(
              q.gte(q.field("name"), searchLower),
              q.lte(q.field("name"), searchLower + "\uffff")
            )
          )
        )
        .collect();

      // Filtrar resultados que realmente contêm o termo de busca
      // Ordenar por nome após filtrar
      return products
        .filter(product => 
          product.name.toLowerCase().includes(searchLower)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  },
});
