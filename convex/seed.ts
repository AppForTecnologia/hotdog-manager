import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Função para popular o banco de dados com dados de exemplo
 * Inclui categorias, produtos, usuários e vendas de teste
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Criar usuário de exemplo
    const userId = await ctx.db.insert("users", {
      clerkId: "user_test_123",
      email: "teste@hotdog.com",
      fullName: "Usuário Teste",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      isActive: true,
    });

    // Criar categorias
    const lanchesId = await ctx.db.insert("categories", {
      name: "Lanches",
      description: "Hot dogs e outros lanches",
      color: "#FF6B35",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const bebidasId = await ctx.db.insert("categories", {
      name: "Bebidas",
      description: "Refrigerantes e sucos",
      color: "#4ECDC4",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Criar produtos
    const hotdogSimplesId = await ctx.db.insert("products", {
      name: "Hot Dog Simples",
      description: "Pão, salsicha, mostarda e ketchup",
      price: 8.50,
      costPrice: 3.50,
      
      categoryId: lanchesId,
      sku: "HD001",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const hotdogDuploId = await ctx.db.insert("products", {
      name: "Hot Dog Duplo",
      description: "Pão, 2 salsichas, mostarda e ketchup",
      price: 12.00,
      costPrice: 5.00,
      
      categoryId: lanchesId,
      sku: "HD002",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const refrigeranteId = await ctx.db.insert("products", {
      name: "Refrigerante 350ml",
      description: "Coca-Cola, Pepsi ou Sprite",
      price: 4.50,
      costPrice: 2.00,
      
      categoryId: bebidasId,
      sku: "REF001",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Criar clientes de exemplo
    await ctx.db.insert("customers", {
      name: "João Silva",
      phone: "(11) 99999-1111",
      address: "Rua das Flores, 123 - Vila Madalena",
      notes: "Próximo ao metrô",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("customers", {
      name: "Maria Santos",
      phone: "(11) 99999-2222",
      address: "Av. Paulista, 456 - Bela Vista",
      notes: "Edifício comercial",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("customers", {
      name: "Pedro Oliveira",
      phone: "(11) 99999-3333",
      address: "Rua Augusta, 789 - Consolação",
      notes: "Apto 45",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("customers", {
      name: "Ana Costa",
      phone: "(11) 99999-4444",
      address: "Rua Oscar Freire, 321 - Jardins",
      notes: "Casa com portão",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("customers", {
      name: "Carlos Ferreira",
      phone: "(11) 99999-5555",
      address: "Av. Brigadeiro Faria Lima, 654 - Pinheiros",
      notes: "Prédio azul, portaria 24h",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Criar vendas de exemplo
    const venda1Id = await ctx.db.insert("sales", {
      userId,
      clerkUserId: "user_test_123",
      total: 21.00,
      discount: 0,
      paymentMethod: "dinheiro",
      saleType: "local",
      status: "pendente",
      notes: "Mesa: Mesa 1",
      saleDate: now,
      createdAt: now,
      updatedAt: now,
    });

    const venda2Id = await ctx.db.insert("sales", {
      userId,
      clerkUserId: "user_test_123",
      total: 16.50,
      discount: 0,
      paymentMethod: "cartao",
      saleType: "local",
      status: "pendente",
      notes: "Mesa: Mesa 2",
      saleDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // Criar itens das vendas
    await ctx.db.insert("saleItems", {
      saleId: venda1Id,
      productId: hotdogSimplesId,
      productName: "Hot Dog Simples",
      unitPrice: 8.50,
      quantity: 1,
      subtotal: 8.50,
      paymentStatus: "pendente",
      amountPaid: 0,
      createdAt: now,
    });

    await ctx.db.insert("saleItems", {
      saleId: venda1Id,
      productId: hotdogDuploId,
      productName: "Hot Dog Duplo",
      unitPrice: 12.00,
      quantity: 1,
      subtotal: 12.00,
      paymentStatus: "pendente",
      amountPaid: 0,
      createdAt: now,
    });

    await ctx.db.insert("saleItems", {
      saleId: venda2Id,
      productId: hotdogSimplesId,
      productName: "Hot Dog Simples",
      unitPrice: 8.50,
      quantity: 1,
      subtotal: 8.50,
      paymentStatus: "pendente",
      amountPaid: 0,
      createdAt: now,
    });

    await ctx.db.insert("saleItems", {
      saleId: venda2Id,
      productId: refrigeranteId,
      productName: "Refrigerante 350ml",
      unitPrice: 4.50,
      quantity: 1,
      subtotal: 4.50,
      paymentStatus: "pendente",
      amountPaid: 0,
      createdAt: now,
    });

    // Criar alguns itens já em produção para demonstração
    const saleItem1 = await ctx.db
      .query("saleItems")
      .withIndex("by_sale", (q) => q.eq("saleId", venda1Id))
      .filter((q) => q.eq(q.field("productName"), "Hot Dog Simples"))
      .first();

    if (saleItem1) {
      await ctx.db.insert("productionItems", {
        saleItemId: saleItem1._id,
        saleId: venda1Id,
        productionStatus: "em_producao",
        startedBy: userId,
        startedAt: now - 300000, // 5 minutos atrás
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      message: "Banco de dados populado com sucesso!",
      users: 1,
      categories: 2,
      products: 3,
      customers: 5,
      sales: 2,
      saleItems: 4,
      productionItems: 1,
    };
  },
});

/**
 * Função para limpar todos os dados do banco
 * ⚠️ ATENÇÃO: Esta função remove TODOS os dados!
 * Use apenas em desenvolvimento
 */
export const clearDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Remover todos os registros de todas as tabelas
    // ⚠️ ATENÇÃO: Esta operação é irreversível!
    
    const sales = await ctx.db.query("sales").collect();
    const saleItems = await ctx.db.query("saleItems").collect();
    const products = await ctx.db.query("products").collect();
    const categories = await ctx.db.query("categories").collect();
    const users = await ctx.db.query("users").collect();


    // Deletar em ordem para evitar problemas de referência
    for (const item of saleItems) {
      await ctx.db.delete(item._id);
    }
    
    for (const sale of sales) {
      await ctx.db.delete(sale._id);
    }
    

    
    for (const product of products) {
      await ctx.db.delete(product._id);
    }
    
    for (const category of categories) {
      await ctx.db.delete(category._id);
    }
    
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    return {
      message: "Banco de dados limpo com sucesso!",
      deleted: {
        sales: sales.length,
        saleItems: saleItems.length,
        products: products.length,
        categories: categories.length,
        users: users.length,

      },
      timestamp: Date.now(),
    };
  },
});
