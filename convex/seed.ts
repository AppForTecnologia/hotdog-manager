import { mutation } from "./_generated/server";

/**
 * Seed inicial para o sistema
 * Cria dados básicos necessários para o funcionamento
 */
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Criar usuário Master (Pedro Cornetti)
    const masterUserId = await ctx.db.insert("users", {
      clerkId: "user_master_example", // Será atualizado automaticamente
      email: "pedrinhocornetti@gmail.com",
      fullName: "Pedro Cornetti - Master",
      role: "master",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Criar tenant de exemplo
    const tenantId = await ctx.db.insert("tenants", {
      cnpj: "12.345.678/0001-90",
      companyName: "HotDog Manager Ltda",
      email: "contato@hotdogmanager.com",
      phone: "(11) 99999-9999",
      address: "Rua das Lanchonetes, 123 - São Paulo/SP",
      plan: "enterprise",
      status: "active",
      createdAt: now,
      updatedAt: now,
      expiresAt: now + (365 * 24 * 60 * 60 * 1000), // 1 ano
      createdBy: masterUserId,
      notes: "Tenant principal do sistema",
    });

    // Vincular usuário Master ao tenant
    await ctx.db.insert("memberships", {
      tenantId,
      userId: "user_master_example", // Será atualizado automaticamente
      role: "admin",
      status: "active",
      createdAt: now,
      updatedAt: now,
      createdBy: masterUserId,
      accessCount: 0,
    });

    return {
      message: "Seed executado com sucesso!",
      masterUserId,
      tenantId,
      instructions: [
        "1. O usuário Master 'pedrinhocornetti@gmail.com' foi criado",
        "2. Execute este seed apenas uma vez",
        "3. Faça login com o email Master para configurar automaticamente",
        "4. Após o login, você terá acesso total ao sistema"
      ]
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
