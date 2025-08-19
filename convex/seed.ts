import { mutation } from "./_generated/server";

/**
 * Função para popular o banco de dados com dados iniciais
 * Útil para desenvolvimento e demonstração
 */

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Criar categorias padrão
    const categories = await Promise.all([
      ctx.db.insert("categories", {
        name: "Lanches",
        description: "Hambúrgueres, cachorros-quentes e sanduíches",
        color: "#FF6B6B",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("categories", {
        name: "Bebidas",
        description: "Refrigerantes, sucos e água",
        color: "#4ECDC4",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("categories", {
        name: "Acompanhamentos",
        description: "Batatas, saladas e outros acompanhamentos",
        color: "#45B7D1",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("categories", {
        name: "Sobremesas",
        description: "Doces, sorvetes e sobremesas",
        color: "#96CEB4",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    // Criar produtos de exemplo
    const products = await Promise.all([
      // Lanches
      ctx.db.insert("products", {
        name: "Cachorro-Quente Clássico",
        description: "Pão, salsicha, mostarda, ketchup e cebola",
        price: 8.50,
        costPrice: 4.00,
        stock: 50,
        categoryId: categories[0], // Lanches
        sku: "CQ001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("products", {
        name: "Hambúrguer Simples",
        description: "Pão, carne, alface, tomate e queijo",
        price: 12.00,
        costPrice: 6.00,
        stock: 30,
        categoryId: categories[0], // Lanches
        sku: "HB001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("products", {
        name: "X-Bacon",
        description: "Hambúrguer com bacon, queijo e molho especial",
        price: 15.50,
        costPrice: 8.00,
        stock: 25,
        categoryId: categories[0], // Lanches
        sku: "XB001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),

      // Bebidas
      ctx.db.insert("products", {
        name: "Refrigerante Cola 350ml",
        description: "Refrigerante cola em lata",
        price: 4.50,
        costPrice: 2.00,
        stock: 100,
        categoryId: categories[1], // Bebidas
        sku: "RC001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("products", {
        name: "Suco de Laranja Natural",
        description: "Suco de laranja fresco",
        price: 6.00,
        costPrice: 3.00,
        stock: 40,
        categoryId: categories[1], // Bebidas
        sku: "SL001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("products", {
        name: "Água Mineral 500ml",
        description: "Água mineral sem gás",
        price: 3.00,
        costPrice: 1.00,
        stock: 80,
        categoryId: categories[1], // Bebidas
        sku: "AM001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),

      // Acompanhamentos
      ctx.db.insert("products", {
        name: "Batata Frita Média",
        description: "Porção de batatas fritas crocantes",
        price: 8.00,
        costPrice: 3.50,
        stock: 60,
        categoryId: categories[2], // Acompanhamentos
        sku: "BF001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("products", {
        name: "Salada Caesar",
        description: "Alface, croutons, parmesão e molho caesar",
        price: 10.00,
        costPrice: 5.00,
        stock: 20,
        categoryId: categories[2], // Acompanhamentos
        sku: "SC001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),

      // Sobremesas
      ctx.db.insert("products", {
        name: "Sorvete de Chocolate",
        description: "Sorvete cremoso de chocolate",
        price: 7.00,
        costPrice: 3.50,
        stock: 35,
        categoryId: categories[3], // Sobremesas
        sku: "SC001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      ctx.db.insert("products", {
        name: "Pudim de Leite",
        description: "Pudim tradicional de leite condensado",
        price: 6.50,
        costPrice: 3.00,
        stock: 25,
        categoryId: categories[3], // Sobremesas
        sku: "PL001",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
    ]);

    return {
      message: "Banco de dados populado com sucesso!",
      categories: categories.length,
      products: products.length,
      timestamp: now,
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
    const stockMovements = await ctx.db.query("stockMovements").collect();

    // Deletar em ordem para evitar problemas de referência
    for (const item of saleItems) {
      await ctx.db.delete(item._id);
    }
    
    for (const sale of sales) {
      await ctx.db.delete(sale._id);
    }
    
    for (const movement of stockMovements) {
      await ctx.db.delete(movement._id);
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
        stockMovements: stockMovements.length,
      },
      timestamp: Date.now(),
    };
  },
});
