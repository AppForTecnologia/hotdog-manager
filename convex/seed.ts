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
 * Seed de desenvolvimento com dados demo completos
 * Cria 2 tenants (1 ativo, 1 expirado), 2 usuários demo, 3 registros por coleção
 */
export const seedDev = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const results = {
      users: [],
      tenants: [],
      memberships: [],
      categories: [],
      products: [],
      customers: [],
      sales: [],
      saleItems: [],
      cashRegister: [],
      productGroups: [],
      saleGroups: []
    };

    try {
      console.log("🌱 Iniciando seed de desenvolvimento...");

      // 1. Criar usuários demo
      console.log("👥 Criando usuários demo...");
      
      const user1 = await ctx.db.insert("users", {
        clerkId: "user_demo_1",
        email: "demo1@hotdogmanager.com",
        fullName: "João Silva - Demo",
        role: "admin",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.users.push(user1);

      const user2 = await ctx.db.insert("users", {
        clerkId: "user_demo_2", 
        email: "demo2@hotdogmanager.com",
        fullName: "Maria Santos - Demo",
        role: "employee",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      results.users.push(user2);

      // 2. Criar tenants (1 ativo, 1 expirado)
      console.log("🏢 Criando tenants demo...");
      
      const tenantAtivo = await ctx.db.insert("tenants", {
        cnpj: "11.222.333/0001-44",
        companyName: "Lanchonete do João Ltda",
        email: "contato@lanchonetedojoao.com",
        phone: "(11) 98765-4321",
        address: "Av. Paulista, 1000 - São Paulo/SP",
        plan: "premium",
        status: "active",
        createdAt: now,
        updatedAt: now,
        expiresAt: now + (90 * 24 * 60 * 60 * 1000), // 90 dias
        createdBy: user1,
        notes: "Tenant ativo para testes",
      });
      results.tenants.push(tenantAtivo);

      const tenantExpirado = await ctx.db.insert("tenants", {
        cnpj: "99.888.777/0001-66",
        companyName: "Hot Dog Express Ltda",
        email: "contato@hotdogexpress.com",
        phone: "(11) 91234-5678",
        address: "Rua das Flores, 500 - São Paulo/SP",
        plan: "basic",
        status: "expired",
        createdAt: now - (30 * 24 * 60 * 60 * 1000), // 30 dias atrás
        updatedAt: now,
        expiresAt: now - (5 * 24 * 60 * 60 * 1000), // 5 dias atrás (expirado)
        createdBy: user1,
        notes: "Tenant expirado para testes",
      });
      results.tenants.push(tenantExpirado);

      // 3. Criar memberships
      console.log("🔗 Criando memberships...");
      
      const membership1 = await ctx.db.insert("memberships", {
        tenantId: tenantAtivo,
        userId: "user_demo_1",
        role: "admin",
        status: "active",
        createdAt: now,
        updatedAt: now,
        createdBy: user1,
        accessCount: 0,
      });
      results.memberships.push(membership1);

      const membership2 = await ctx.db.insert("memberships", {
        tenantId: tenantAtivo,
        userId: "user_demo_2",
        role: "employee",
        status: "active",
        createdAt: now,
        updatedAt: now,
        createdBy: user1,
        accessCount: 0,
      });
      results.memberships.push(membership2);

      const membership3 = await ctx.db.insert("memberships", {
        tenantId: tenantExpirado,
        userId: "user_demo_1",
        role: "admin",
        status: "inactive", // Inativo por expiração
        createdAt: now - (30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
        createdBy: user1,
        accessCount: 0,
      });
      results.memberships.push(membership3);

      // 4. Criar categorias (3 por tenant)
      console.log("📂 Criando categorias...");
      
      const categoriasAtivo = [
        { name: "Lanches", description: "Sanduíches e lanches", color: "#FF6B6B" },
        { name: "Bebidas", description: "Refrigerantes e sucos", color: "#4ECDC4" },
        { name: "Porções", description: "Porções e acompanhamentos", color: "#45B7D1" }
      ];

      for (const cat of categoriasAtivo) {
        const categoryId = await ctx.db.insert("categories", {
          tenantId: tenantAtivo,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        results.categories.push(categoryId);
      }

      const categoriasExpirado = [
        { name: "Hot Dogs", description: "Cachorros quentes", color: "#FF9F43" },
        { name: "Refrigerantes", description: "Bebidas geladas", color: "#10AC84" },
        { name: "Batatas", description: "Batatas fritas", color: "#EE5A24" }
      ];

      for (const cat of categoriasExpirado) {
        const categoryId = await ctx.db.insert("categories", {
          tenantId: tenantExpirado,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          isActive: true,
          createdAt: now - (30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.categories.push(categoryId);
      }

      // 5. Criar produtos (3 por tenant)
      console.log("🍔 Criando produtos...");
      
      const produtosAtivo = [
        { name: "X-Burger", price: 15.90, costPrice: 8.50, sku: "XB001" },
        { name: "Coca-Cola 350ml", price: 4.50, costPrice: 2.00, sku: "CC001" },
        { name: "Batata Frita", price: 8.90, costPrice: 3.50, sku: "BF001" }
      ];

      for (let i = 0; i < produtosAtivo.length; i++) {
        const productId = await ctx.db.insert("products", {
          tenantId: tenantAtivo,
          name: produtosAtivo[i].name,
          description: `Produto ${produtosAtivo[i].name}`,
          price: produtosAtivo[i].price,
          costPrice: produtosAtivo[i].costPrice,
          categoryId: results.categories[i], // Usar categoria correspondente
          sku: produtosAtivo[i].sku,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        results.products.push(productId);
      }

      const produtosExpirado = [
        { name: "Hot Dog Completo", price: 12.90, costPrice: 6.50, sku: "HD001" },
        { name: "Guaraná 350ml", price: 4.00, costPrice: 1.80, sku: "GU001" },
        { name: "Batata Doce", price: 7.90, costPrice: 3.00, sku: "BD001" }
      ];

      for (let i = 0; i < produtosExpirado.length; i++) {
        const productId = await ctx.db.insert("products", {
          tenantId: tenantExpirado,
          name: produtosExpirado[i].name,
          description: `Produto ${produtosExpirado[i].name}`,
          price: produtosExpirado[i].price,
          costPrice: produtosExpirado[i].costPrice,
          categoryId: results.categories[i + 3], // Usar categoria correspondente
          sku: produtosExpirado[i].sku,
          isActive: true,
          createdAt: now - (30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.products.push(productId);
      }

      // 6. Criar clientes (3 por tenant)
      console.log("👥 Criando clientes...");
      
      const clientesAtivo = [
        { name: "Carlos Oliveira", phone: "(11) 99999-1111", address: "Rua A, 123" },
        { name: "Ana Costa", phone: "(11) 99999-2222", address: "Rua B, 456" },
        { name: "Pedro Lima", phone: "(11) 99999-3333", address: "Rua C, 789" }
      ];

      for (const cliente of clientesAtivo) {
        const customerId = await ctx.db.insert("customers", {
          tenantId: tenantAtivo,
          name: cliente.name,
          phone: cliente.phone,
          address: cliente.address,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        results.customers.push(customerId);
      }

      const clientesExpirado = [
        { name: "Roberto Silva", phone: "(11) 88888-1111", address: "Av. X, 100" },
        { name: "Lucia Ferreira", phone: "(11) 88888-2222", address: "Av. Y, 200" },
        { name: "Marcos Santos", phone: "(11) 88888-3333", address: "Av. Z, 300" }
      ];

      for (const cliente of clientesExpirado) {
        const customerId = await ctx.db.insert("customers", {
          tenantId: tenantExpirado,
          name: cliente.name,
          phone: cliente.phone,
          address: cliente.address,
          isActive: true,
          createdAt: now - (30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.customers.push(customerId);
      }

      // 7. Criar vendas (3 por tenant)
      console.log("💰 Criando vendas...");
      
      const vendasAtivo = [
        { total: 25.30, paymentMethod: "money", status: "paid", saleType: "local" },
        { total: 18.90, paymentMethod: "card", status: "paid", saleType: "delivery" },
        { total: 32.70, paymentMethod: "pix", status: "paid", saleType: "local" }
      ];

      for (let i = 0; i < vendasAtivo.length; i++) {
        const saleId = await ctx.db.insert("sales", {
          tenantId: tenantAtivo,
          userId: user1,
          clerkUserId: "user_demo_1",
          total: vendasAtivo[i].total,
          paymentMethod: vendasAtivo[i].paymentMethod,
          status: vendasAtivo[i].status,
          saleType: vendasAtivo[i].saleType,
          customerId: i === 1 ? results.customers[1] : undefined, // Delivery tem cliente
          saleDate: now - (i * 24 * 60 * 60 * 1000), // Vendas em dias diferentes
          createdAt: now - (i * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.sales.push(saleId);
      }

      const vendasExpirado = [
        { total: 20.80, paymentMethod: "money", status: "paid", saleType: "local" },
        { total: 15.40, paymentMethod: "card", status: "paid", saleType: "delivery" },
        { total: 28.60, paymentMethod: "pix", status: "paid", saleType: "local" }
      ];

      for (let i = 0; i < vendasExpirado.length; i++) {
        const saleId = await ctx.db.insert("sales", {
          tenantId: tenantExpirado,
          userId: user1,
          clerkUserId: "user_demo_1",
          total: vendasExpirado[i].total,
          paymentMethod: vendasExpirado[i].paymentMethod,
          status: vendasExpirado[i].status,
          saleType: vendasExpirado[i].saleType,
          customerId: i === 1 ? results.customers[4] : undefined, // Delivery tem cliente
          saleDate: now - (30 + i) * 24 * 60 * 60 * 1000, // Vendas antigas
          createdAt: now - (30 + i) * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
        results.sales.push(saleId);
      }

      // 8. Criar itens de venda (3 por venda)
      console.log("🛒 Criando itens de venda...");
      
      for (let i = 0; i < results.sales.length; i++) {
        const saleId = results.sales[i];
        const tenantId = i < 3 ? tenantAtivo : tenantExpirado;
        const productStartIndex = i < 3 ? 0 : 3;
        
        for (let j = 0; j < 3; j++) {
          const productId = results.products[productStartIndex + j];
          const product = await ctx.db.get(productId);
          
          const saleItemId = await ctx.db.insert("saleItems", {
            tenantId,
            saleId,
            productId,
            productName: product?.name || `Produto ${j + 1}`,
            unitPrice: product?.price || 10.00,
            quantity: j + 1,
            subtotal: (product?.price || 10.00) * (j + 1),
            paymentStatus: "paid",
            amountPaid: (product?.price || 10.00) * (j + 1),
            createdAt: now - (i * 24 * 60 * 60 * 1000),
          });
          results.saleItems.push(saleItemId);
        }
      }

      // 9. Criar fechamentos de caixa (3 por tenant)
      console.log("💼 Criando fechamentos de caixa...");
      
      const fechamentosAtivo = [
        { totalSales: 150.50, totalCount: 148.30, moneyDiff: -2.20 },
        { totalSales: 200.80, totalCount: 200.80, moneyDiff: 0.00 },
        { totalSales: 175.20, totalCount: 180.00, moneyDiff: 4.80 }
      ];

      for (let i = 0; i < fechamentosAtivo.length; i++) {
        const cashId = await ctx.db.insert("cashRegister", {
          tenantId: tenantAtivo,
          userId: user1,
          clerkUserId: "user_demo_1",
          moneyCount: fechamentosAtivo[i].totalCount * 0.6,
          creditCount: fechamentosAtivo[i].totalCount * 0.2,
          debitCount: fechamentosAtivo[i].totalCount * 0.15,
          pixCount: fechamentosAtivo[i].totalCount * 0.05,
          totalCount: fechamentosAtivo[i].totalCount,
          moneySales: fechamentosAtivo[i].totalSales * 0.6,
          creditSales: fechamentosAtivo[i].totalSales * 0.2,
          debitSales: fechamentosAtivo[i].totalSales * 0.15,
          pixSales: fechamentosAtivo[i].totalSales * 0.05,
          totalSales: fechamentosAtivo[i].totalSales,
          moneyDiff: fechamentosAtivo[i].moneyDiff,
          creditDiff: 0,
          debitDiff: 0,
          pixDiff: 0,
          totalDiff: fechamentosAtivo[i].moneyDiff,
          closeDate: now - (i * 24 * 60 * 60 * 1000),
          createdAt: now - (i * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.cashRegister.push(cashId);
      }

      const fechamentosExpirado = [
        { totalSales: 120.30, totalCount: 118.50, moneyDiff: -1.80 },
        { totalSales: 180.60, totalCount: 180.60, moneyDiff: 0.00 },
        { totalSales: 160.40, totalCount: 165.00, moneyDiff: 4.60 }
      ];

      for (let i = 0; i < fechamentosExpirado.length; i++) {
        const cashId = await ctx.db.insert("cashRegister", {
          tenantId: tenantExpirado,
          userId: user1,
          clerkUserId: "user_demo_1",
          moneyCount: fechamentosExpirado[i].totalCount * 0.6,
          creditCount: fechamentosExpirado[i].totalCount * 0.2,
          debitCount: fechamentosExpirado[i].totalCount * 0.15,
          pixCount: fechamentosExpirado[i].totalCount * 0.05,
          totalCount: fechamentosExpirado[i].totalCount,
          moneySales: fechamentosExpirado[i].totalSales * 0.6,
          creditSales: fechamentosExpirado[i].totalSales * 0.2,
          debitSales: fechamentosExpirado[i].totalSales * 0.15,
          pixSales: fechamentosExpirado[i].totalSales * 0.05,
          totalSales: fechamentosExpirado[i].totalSales,
          moneyDiff: fechamentosExpirado[i].moneyDiff,
          creditDiff: 0,
          debitDiff: 0,
          pixDiff: 0,
          totalDiff: fechamentosExpirado[i].moneyDiff,
          closeDate: now - (30 + i) * 24 * 60 * 60 * 1000,
          createdAt: now - (30 + i) * 24 * 60 * 60 * 1000,
          updatedAt: now,
        });
        results.cashRegister.push(cashId);
      }

      // 10. Criar grupos de produtos (3 por tenant)
      console.log("📦 Criando grupos de produtos...");
      
      const gruposAtivo = [
        { name: "lanches", title: "Lanches", icon: "🍔", color: "#FF6B6B", order: 1 },
        { name: "bebidas", title: "Bebidas", icon: "🥤", color: "#4ECDC4", order: 2 },
        { name: "porcoes", title: "Porções", icon: "🍟", color: "#45B7D1", order: 3 }
      ];

      for (const grupo of gruposAtivo) {
        const groupId = await ctx.db.insert("productGroups", {
          tenantId: tenantAtivo,
          name: grupo.name,
          title: grupo.title,
          icon: grupo.icon,
          color: grupo.color,
          order: grupo.order,
          isActive: true,
          keywords: [grupo.name],
          createdAt: now,
          updatedAt: now,
        });
        results.productGroups.push(groupId);
      }

      const gruposExpirado = [
        { name: "hotdogs", title: "Hot Dogs", icon: "🌭", color: "#FF9F43", order: 1 },
        { name: "refrigerantes", title: "Refrigerantes", icon: "🥤", color: "#10AC84", order: 2 },
        { name: "batatas", title: "Batatas", icon: "🍟", color: "#EE5A24", order: 3 }
      ];

      for (const grupo of gruposExpirado) {
        const groupId = await ctx.db.insert("productGroups", {
          tenantId: tenantExpirado,
          name: grupo.name,
          title: grupo.title,
          icon: grupo.icon,
          color: grupo.color,
          order: grupo.order,
          isActive: true,
          keywords: [grupo.name],
          createdAt: now - (30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.productGroups.push(groupId);
      }

      // 11. Criar grupos de vendas (3 por tenant)
      console.log("🛍️ Criando grupos de vendas...");
      
      const gruposVendasAtivo = [
        { name: "vendas_locais", title: "Vendas Locais", icon: "🏪", color: "#6C5CE7", order: 1 },
        { name: "delivery", title: "Delivery", icon: "🚚", color: "#A29BFE", order: 2 },
        { name: "balcao", title: "Balcão", icon: "🍽️", color: "#74B9FF", order: 3 }
      ];

      for (const grupo of gruposVendasAtivo) {
        const groupId = await ctx.db.insert("saleGroups", {
          tenantId: tenantAtivo,
          name: grupo.name,
          title: grupo.title,
          icon: grupo.icon,
          color: grupo.color,
          order: grupo.order,
          isActive: true,
          keywords: [grupo.name],
          createdAt: now,
          updatedAt: now,
        });
        results.saleGroups.push(groupId);
      }

      const gruposVendasExpirado = [
        { name: "vendas_rua", title: "Vendas na Rua", icon: "🚶", color: "#FD79A8", order: 1 },
        { name: "entrega", title: "Entrega", icon: "🏍️", color: "#FDCB6E", order: 2 },
        { name: "mesa", title: "Mesa", icon: "🪑", color: "#E17055", order: 3 }
      ];

      for (const grupo of gruposVendasExpirado) {
        const groupId = await ctx.db.insert("saleGroups", {
          tenantId: tenantExpirado,
          name: grupo.name,
          title: grupo.title,
          icon: grupo.icon,
          color: grupo.color,
          order: grupo.order,
          isActive: true,
          keywords: [grupo.name],
          createdAt: now - (30 * 24 * 60 * 60 * 1000),
          updatedAt: now,
        });
        results.saleGroups.push(groupId);
      }

      console.log("✅ Seed de desenvolvimento concluído com sucesso!");

      return {
        success: true,
        message: "Seed de desenvolvimento executado com sucesso!",
        summary: {
          users: results.users.length,
          tenants: results.tenants.length,
          memberships: results.memberships.length,
          categories: results.categories.length,
          products: results.products.length,
          customers: results.customers.length,
          sales: results.sales.length,
          saleItems: results.saleItems.length,
          cashRegister: results.cashRegister.length,
          productGroups: results.productGroups.length,
          saleGroups: results.saleGroups.length
        },
        details: {
          tenantAtivo: {
            id: tenantAtivo,
            cnpj: "11.222.333/0001-44",
            companyName: "Lanchonete do João Ltda",
            status: "active",
            expiresAt: new Date(now + (90 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')
          },
          tenantExpirado: {
            id: tenantExpirado,
            cnpj: "99.888.777/0001-66",
            companyName: "Hot Dog Express Ltda",
            status: "expired",
            expiresAt: new Date(now - (5 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')
          },
          users: [
            { id: user1, email: "demo1@hotdogmanager.com", name: "João Silva - Demo", role: "admin" },
            { id: user2, email: "demo2@hotdogmanager.com", name: "Maria Santos - Demo", role: "employee" }
          ]
        },
        instructions: [
          "1. Dois usuários demo foram criados: demo1@hotdogmanager.com (admin) e demo2@hotdogmanager.com (employee)",
          "2. Dois tenants foram criados: um ativo e um expirado",
          "3. Três registros foram criados para cada coleção por tenant",
          "4. Use estes dados para testar o sistema completo",
          "5. O tenant expirado permitirá testar o bloqueio por expiração"
        ],
        timestamp: now
      };

    } catch (error) {
      console.error("❌ Erro no seed de desenvolvimento:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        results,
        timestamp: now
      };
    }
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
