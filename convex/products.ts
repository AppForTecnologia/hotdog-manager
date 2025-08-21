import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Funções para gerenciar produtos no sistema HotDog Manager
 * Inclui operações de CRUD e consultas específicas
 */

/**
 * Query para listar todos os produtos ativos
 * Retorna produtos ordenados por nome, excluindo produtos deletados
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("asc")
      .collect();

    // Ordenar por nome após coletar (já que não temos índice por nome)
    return products.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Query para buscar produtos por categoria
 * Retorna produtos de uma categoria específica
 */
export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    // Ordenar por nome após coletar
    return products.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Query para listar produtos agrupados por categoria personalizada
 * Retorna produtos organizados em grupos configuráveis pelo usuário
 */
export const listGroupedByCategory = query({
  args: {},
  handler: async (ctx) => {
    // Buscar grupos de produtos configurados
    const productGroups = await ctx.db
      .query("productGroups")
      .withIndex("by_active", (q) => q.eq("isActive", true))
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
      .withIndex("by_active", (q) => q.eq("isActive", true))
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
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .filter((q) => 
            q.and(
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
  },
});

/**
 * Query para buscar produto por ID
 * Retorna um produto específico com todas as informações
 */
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    
    if (!product || product.deletedAt) {
      return null;
    }
    
    return product;
  },
});

/**
 * Query para buscar produtos com estoque baixo
 * Retorna produtos com estoque abaixo de um limite específico
 */
export const listLowStock = query({
  args: { threshold: v.number() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_stock", (q) => q.lt("stock", args.threshold))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    // Ordenar por estoque (menor primeiro)
    return products.sort((a, b) => a.stock - b.stock);
  },
});

/**
 * Query para buscar produto por SKU
 * Útil para leitura de códigos de barras
 */
export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.eq(q.field("deletedAt"), undefined)
        )
      )
      .collect();

    return products[0] || null;
  },
});

/**
 * Mutation para criar um novo produto
 * Cria um produto com validações básicas
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    image: v.optional(v.string()),
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
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
    if (!category || !category.isActive) {
      throw new Error("Categoria inválida ou inativa");
    }

    const now = Date.now();
    
    const productId = await ctx.db.insert("products", {
      name: args.name,
      description: args.description || "",
      price: args.price,
      imageUrl: args.image || "",
      stock: 0, // Estoque padrão
      categoryId: args.categoryId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return productId;
  },
});

/**
 * Mutation para atualizar um produto existente
 * Atualiza campos específicos de um produto
 */
export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    image: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Verificar se produto existe e não foi deletado
    const existingProduct = await ctx.db.get(id);
    if (!existingProduct || existingProduct.deletedAt) {
      throw new Error("Produto não encontrado");
    }

    // Validações
    if (updates.price !== undefined && updates.price < 0) {
      throw new Error("Preço não pode ser negativo");
    }

    // Validar categoria se fornecida
    if (updates.categoryId !== undefined) {
      const category = await ctx.db.get(updates.categoryId);
      if (!category || !category.isActive) {
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
  },
});

/**
 * Mutation para deletar um produto (soft delete)
 * Marca o produto como deletado sem remover do banco
 */
export const removeProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    
    if (!product || product.deletedAt) {
      throw new Error("Produto não encontrado");
    }

    // Soft delete - marcar como deletado
    await ctx.db.patch(args.id, {
      deletedAt: Date.now(),
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

/**
 * Mutation para ajustar estoque de um produto
 * Útil para entradas, saídas e ajustes de inventário
 */
export const adjustStock = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(), // Positivo para entrada, negativo para saída
    reason: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    
    if (!product || product.deletedAt) {
      throw new Error("Produto não encontrado");
    }

    const previousStock = product.stock;
    const newStock = previousStock + args.quantity;
    
    if (newStock < 0) {
      throw new Error("Estoque não pode ficar negativo");
    }

    // Atualizar estoque do produto
    await ctx.db.patch(args.id, {
      stock: newStock,
      updatedAt: Date.now(),
    });

    // Registrar movimentação de estoque
    await ctx.db.insert("stockMovements", {
      productId: args.id,
      type: args.quantity > 0 ? "entrada" : "saída",
      quantity: Math.abs(args.quantity),
      previousStock,
      newStock,
      reason: args.reason,
      userId: args.userId,
      movementDate: Date.now(),
      createdAt: Date.now(),
    });

    return { id: args.id, previousStock, newStock };
  },
});

/**
 * Query para buscar produtos por nome (busca parcial)
 * Útil para autocomplete e busca de produtos
 */
export const searchByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchTerm.trim()) {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();
    
    const products = await ctx.db
      .query("products")
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
  },
});
