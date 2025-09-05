import { ConvexError, v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { requireUserId } from "../utils/auth";
import { api } from "../_generated/api";

/**
 * Sistema de Migração de Dados Legados
 * 
 * Este arquivo contém funções para migrar dados legados que não possuem tenantId
 * para o novo modelo multi-tenant. Inclui análise, migração automática e exportação CSV.
 */

/**
 * Query para analisar dados legados que precisam de migração
 * Retorna estatísticas detalhadas sobre registros sem tenantId
 */
export const analyzeLegacyData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    
    // Verificar se o usuário é admin (opcional - pode ser removido para permitir acesso geral)
    // const user = await ctx.db.get(userId);
    // if (!user || user.role !== 'admin') {
    //   throw new ConvexError("Acesso negado. Apenas administradores podem executar esta operação.");
    // }

    const analysis = {
      collections: {} as Record<string, any>,
      totalRecords: 0,
      recordsWithoutTenantId: 0,
      migrationNeeded: false,
      timestamp: Date.now(),
    };

    // Lista de coleções que precisam de tenantId
    const collectionsToAnalyze = [
      'categories',
      'products', 
      'sales',
      'saleItems',
      'cashRegister',
      'paymentMethods',
      'productionItems',
      'productGroups',
      'saleGroups',
      'customers'
    ];

    for (const collectionName of collectionsToAnalyze) {
      try {
        // Buscar todos os registros da coleção
        const allRecords = await ctx.db.query(collectionName as any).collect();
        
        // Contar registros sem tenantId
        const recordsWithoutTenantId = allRecords.filter((record: any) => !record.tenantId);
        
        analysis.collections[collectionName] = {
          total: allRecords.length,
          withoutTenantId: recordsWithoutTenantId.length,
          withTenantId: allRecords.length - recordsWithoutTenantId.length,
          percentage: allRecords.length > 0 ? Math.round((recordsWithoutTenantId.length / allRecords.length) * 100) : 0,
          sampleRecords: recordsWithoutTenantId.slice(0, 5).map((record: any) => ({
            _id: record._id,
            name: record.name || record.companyName || record.productName || 'N/A',
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          }))
        };

        analysis.totalRecords += allRecords.length;
        analysis.recordsWithoutTenantId += recordsWithoutTenantId.length;

      } catch (error) {
        console.error(`Erro ao analisar coleção ${collectionName}:`, error);
        analysis.collections[collectionName] = {
          error: `Erro ao acessar coleção: ${error}`,
          total: 0,
          withoutTenantId: 0,
          withTenantId: 0,
          percentage: 0,
          sampleRecords: []
        };
      }
    }

    analysis.migrationNeeded = analysis.recordsWithoutTenantId > 0;

    return analysis;
  },
});

/**
 * Query para obter lista de tenants disponíveis para migração
 * Retorna todos os tenants ativos que podem ser usados como destino
 */
export const getAvailableTenants = query({
  args: {},
  handler: async (ctx) => {
    const tenants = await ctx.db
      .query("tenants")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .collect();

    return tenants.map(tenant => ({
      _id: tenant._id,
      companyName: tenant.companyName,
      cnpj: tenant.cnpj,
      plan: tenant.plan,
      createdAt: tenant.createdAt,
      expiresAt: tenant.expiresAt,
    }));
  },
});

/**
 * Mutation para migração automática de dados legados
 * Atribui tenantId a registros que não possuem baseado em regras temporárias
 */
export const migrateLegacyData = mutation({
  args: {
    targetTenantId: v.id("tenants"),
    collections: v.array(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    
    // Verificar se o tenant de destino existe e está ativo
    const targetTenant = await ctx.db.get(args.targetTenantId);
    if (!targetTenant || targetTenant.status !== "active") {
      throw new ConvexError("Tenant de destino não encontrado ou inativo");
    }

    const results = {
      success: true,
      targetTenant: {
        _id: targetTenant._id,
        companyName: targetTenant.companyName,
        cnpj: targetTenant.cnpj,
      },
      collections: {} as Record<string, any>,
      totalProcessed: 0,
      totalUpdated: 0,
      errors: [] as string[],
      timestamp: now,
      dryRun: args.dryRun || false,
    };

    // Lista de coleções válidas para migração
    const validCollections = [
      'categories',
      'products', 
      'sales',
      'saleItems',
      'cashRegister',
      'paymentMethods',
      'productionItems',
      'productGroups',
      'saleGroups',
      'customers'
    ];

    // Filtrar apenas coleções válidas
    const collectionsToProcess = args.collections.filter(col => validCollections.includes(col));

    for (const collectionName of collectionsToProcess) {
      try {
        // Buscar registros sem tenantId
        const recordsWithoutTenantId = await ctx.db
          .query(collectionName as any)
          .filter((q: any) => q.eq(q.field("tenantId"), undefined))
          .collect();

        results.collections[collectionName] = {
          total: recordsWithoutTenantId.length,
          updated: 0,
          errors: 0,
        };

        results.totalProcessed += recordsWithoutTenantId.length;

        // Atualizar cada registro (se não for dry run)
        if (!args.dryRun) {
          for (const record of recordsWithoutTenantId) {
            try {
              await ctx.db.patch(record._id, {
                tenantId: args.targetTenantId,
                updatedAt: now,
              });
              
              results.collections[collectionName].updated++;
              results.totalUpdated++;
            } catch (error) {
              results.collections[collectionName].errors++;
              results.errors.push(`Erro ao atualizar ${collectionName} ${record._id}: ${error}`);
            }
          }
        } else {
          // Dry run - apenas simular
          results.collections[collectionName].updated = recordsWithoutTenantId.length;
          results.totalUpdated += recordsWithoutTenantId.length;
        }

      } catch (error) {
        results.errors.push(`Erro ao processar coleção ${collectionName}: ${error}`);
        results.collections[collectionName] = {
          total: 0,
          updated: 0,
          errors: 1,
          error: `Erro ao acessar coleção: ${error}`,
        };
      }
    }

    return results;
  },
});

/**
 * Action para exportar dados legados para CSV
 * Gera arquivos CSV com dados que precisam de migração manual
 */
export const exportLegacyDataToCSV = action({
  args: {
    collections: v.array(v.string()),
    includeHeaders: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Em actions, não podemos usar requireUserId diretamente
    // Vamos usar uma abordagem diferente para validação
    
    const exportData = {
      success: true,
      files: {} as Record<string, string>,
      errors: [] as string[],
      timestamp: Date.now(),
    };

    // Lista de coleções válidas para exportação
    const validCollections = [
      'categories',
      'products', 
      'sales',
      'saleItems',
      'cashRegister',
      'paymentMethods',
      'productionItems',
      'productGroups',
      'saleGroups',
      'customers'
    ];

    const collectionsToExport = args.collections.filter(col => validCollections.includes(col));

    for (const collectionName of collectionsToExport) {
      try {
        // Buscar registros sem tenantId usando a mutation auxiliar que criamos
        const recordsWithoutTenantId = await ctx.runMutation(api.admin.migrateTenantId.getLegacyRecordsForExport, {
          collection: collectionName,
        });

        if (recordsWithoutTenantId.length === 0) {
          exportData.files[collectionName] = "Nenhum registro encontrado";
          continue;
        }

        // Gerar CSV
        const csvContent = generateCSV(recordsWithoutTenantId, args.includeHeaders || true);
        exportData.files[collectionName] = csvContent;

      } catch (error) {
        exportData.errors.push(`Erro ao exportar ${collectionName}: ${error}`);
        exportData.files[collectionName] = `Erro: ${error}`;
      }
    }

    return exportData;
  },
});

/**
 * Mutation auxiliar para obter registros legados de uma coleção específica (para uso em actions)
 */
export const getLegacyRecordsForExport = mutation({
  args: {
    collection: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    
    // Lista de coleções válidas
    const validCollections = [
      'categories',
      'products', 
      'sales',
      'saleItems',
      'cashRegister',
      'paymentMethods',
      'productionItems',
      'productGroups',
      'saleGroups',
      'customers'
    ];

    if (!validCollections.includes(args.collection)) {
      throw new ConvexError(`Coleção ${args.collection} não é válida para migração`);
    }

    // Buscar registros sem tenantId
    const records = await ctx.db.query(args.collection as any).collect();
    return records.filter((record: any) => !record.tenantId);
  },
});

/**
 * Query auxiliar para obter registros legados de uma coleção específica
 */
export const getLegacyRecords = query({
  args: {
    collection: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    
    // Lista de coleções válidas
    const validCollections = [
      'categories',
      'products', 
      'sales',
      'saleItems',
      'cashRegister',
      'paymentMethods',
      'productionItems',
      'productGroups',
      'saleGroups',
      'customers'
    ];

    if (!validCollections.includes(args.collection)) {
      throw new ConvexError(`Coleção ${args.collection} não é válida para migração`);
    }

    // Buscar registros sem tenantId
    const recordsWithoutTenantId = await ctx.db
      .query(args.collection as any)
      .filter((q: any) => q.eq(q.field("tenantId"), undefined))
      .collect();

    // Retornar apenas campos relevantes para exportação
    return recordsWithoutTenantId.map((record: any) => {
      const cleanRecord: any = {
        _id: record._id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };

      // Adicionar campos específicos de cada coleção
      switch (args.collection) {
        case 'categories':
          cleanRecord.name = record.name;
          cleanRecord.description = record.description;
          cleanRecord.isActive = record.isActive;
          break;
        case 'products':
          cleanRecord.name = record.name;
          cleanRecord.price = record.price;
          cleanRecord.categoryId = record.categoryId;
          cleanRecord.isActive = record.isActive;
          break;
        case 'sales':
          cleanRecord.total = record.total;
          cleanRecord.userId = record.userId;
          cleanRecord.status = record.status;
          cleanRecord.saleDate = record.saleDate;
          break;
        case 'saleItems':
          cleanRecord.saleId = record.saleId;
          cleanRecord.productId = record.productId;
          cleanRecord.quantity = record.quantity;
          cleanRecord.unitPrice = record.unitPrice;
          break;
        case 'customers':
          cleanRecord.name = record.name;
          cleanRecord.phone = record.phone;
          cleanRecord.address = record.address;
          cleanRecord.isActive = record.isActive;
          break;
        // Adicionar outros casos conforme necessário
        default:
          // Para outras coleções, incluir todos os campos não-sistema
          Object.keys(record).forEach(key => {
            if (!['_id', 'tenantId', '_creationTime'].includes(key)) {
              cleanRecord[key] = record[key];
            }
          });
      }

      return cleanRecord;
    });
  },
});

/**
 * Mutation para migração seletiva baseada em critérios específicos
 * Permite migrar apenas registros que atendem a critérios específicos
 */
export const migrateSelectiveData = mutation({
  args: {
    targetTenantId: v.id("tenants"),
    collection: v.string(),
    criteria: v.object({
      field: v.string(),
      operator: v.string(), // 'equals', 'contains', 'greaterThan', 'lessThan'
      value: v.any(),
    }),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    
    // Verificar se o tenant de destino existe
    const targetTenant = await ctx.db.get(args.targetTenantId);
    if (!targetTenant || targetTenant.status !== "active") {
      throw new ConvexError("Tenant de destino não encontrado ou inativo");
    }

    // Buscar registros que atendem aos critérios
    let matchingRecords = await ctx.db
      .query(args.collection as any)
      .filter((q: any) => {
        const tenantIdFilter = q.eq(q.field("tenantId"), undefined);
        
        // Aplicar critério adicional
        let criteriaFilter;
        switch (args.criteria.operator) {
          case 'equals':
            criteriaFilter = q.eq(q.field(args.criteria.field), args.criteria.value);
            break;
          case 'contains':
            criteriaFilter = q.eq(q.field(args.criteria.field), args.criteria.value);
            break;
          case 'greaterThan':
            criteriaFilter = q.gt(q.field(args.criteria.field), args.criteria.value);
            break;
          case 'lessThan':
            criteriaFilter = q.lt(q.field(args.criteria.field), args.criteria.value);
            break;
          default:
            throw new ConvexError(`Operador ${args.criteria.operator} não suportado`);
        }
        
        return q.and(tenantIdFilter, criteriaFilter);
      })
      .collect();

    const results = {
      success: true,
      targetTenant: {
        _id: targetTenant._id,
        companyName: targetTenant.companyName,
        cnpj: targetTenant.cnpj,
      },
      collection: args.collection,
      criteria: args.criteria,
      totalFound: matchingRecords.length,
      totalUpdated: 0,
      errors: [] as string[],
      timestamp: now,
      dryRun: args.dryRun || false,
    };

    // Atualizar registros (se não for dry run)
    if (!args.dryRun) {
      for (const record of matchingRecords) {
        try {
          await ctx.db.patch(record._id, {
            tenantId: args.targetTenantId,
            updatedAt: now,
          });
          
          results.totalUpdated++;
        } catch (error) {
          results.errors.push(`Erro ao atualizar ${record._id}: ${error}`);
        }
      }
    } else {
      results.totalUpdated = matchingRecords.length;
    }

    return results;
  },
});

/**
 * Função auxiliar para gerar CSV
 */
function generateCSV(data: any[], includeHeaders: boolean = true): string {
  if (data.length === 0) {
    return "Nenhum dado encontrado";
  }

  const headers = Object.keys(data[0]);
  let csv = '';

  // Adicionar cabeçalhos se solicitado
  if (includeHeaders) {
    csv += headers.join(',') + '\n';
  }

  // Adicionar dados
  for (const record of data) {
    const row = headers.map(header => {
      const value = record[header];
      // Escapar vírgulas e aspas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Query para verificar status da migração
 * Retorna informações sobre o progresso da migração
 */
export const getMigrationStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    
    const status = {
      collections: {} as Record<string, any>,
      overallProgress: 0,
      totalRecords: 0,
      migratedRecords: 0,
      remainingRecords: 0,
      timestamp: Date.now(),
    };

    const collectionsToCheck = [
      'categories',
      'products', 
      'sales',
      'saleItems',
      'cashRegister',
      'paymentMethods',
      'productionItems',
      'productGroups',
      'saleGroups',
      'customers'
    ];

    for (const collectionName of collectionsToCheck) {
      try {
        const allRecords = await ctx.db.query(collectionName as any).collect();
        const recordsWithTenantId = allRecords.filter((record: any) => record.tenantId);
        const recordsWithoutTenantId = allRecords.filter((record: any) => !record.tenantId);

        status.collections[collectionName] = {
          total: allRecords.length,
          migrated: recordsWithTenantId.length,
          remaining: recordsWithoutTenantId.length,
          progress: allRecords.length > 0 ? Math.round((recordsWithTenantId.length / allRecords.length) * 100) : 100,
        };

        status.totalRecords += allRecords.length;
        status.migratedRecords += recordsWithTenantId.length;
        status.remainingRecords += recordsWithoutTenantId.length;

      } catch (error) {
        status.collections[collectionName] = {
          error: `Erro ao verificar: ${error}`,
          total: 0,
          migrated: 0,
          remaining: 0,
          progress: 0,
        };
      }
    }

    status.overallProgress = status.totalRecords > 0 
      ? Math.round((status.migratedRecords / status.totalRecords) * 100) 
      : 100;

    return status;
  },
});
