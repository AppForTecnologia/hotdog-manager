import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTenant } from '@/contexts/TenantContext';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Hook para gerenciar vendas com isolamento por tenant
 * Todas as operações são automaticamente filtradas pelo tenant atual
 */
export function useSales() {
  const { currentTenantId } = useTenant();

  // Query para listar todas as vendas
  const sales = useQuery(
    api.sales.listAll,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para listar vendas por usuário
  const getSalesByUser = (userId: Id<"users">) => {
    return useQuery(
      api.sales.listByUser,
      currentTenantId ? { tenantId: currentTenantId, userId } : "skip"
    );
  };

  // Query para listar vendas por período
  const getSalesByDateRange = (startDate: number, endDate: number) => {
    return useQuery(
      api.sales.listByDateRange,
      currentTenantId ? { tenantId: currentTenantId, startDate, endDate } : "skip"
    );
  };

  // Query para buscar venda por ID
  const getSaleById = (saleId: Id<"sales">) => {
    return useQuery(
      api.sales.getById,
      currentTenantId ? { tenantId: currentTenantId, id: saleId } : "skip"
    );
  };

  // Query para buscar venda completa com itens
  const getSaleWithItems = (saleId: Id<"sales">) => {
    return useQuery(
      api.sales.getSaleWithItems,
      currentTenantId ? { tenantId: currentTenantId, id: saleId } : "skip"
    );
  };

  // Query para buscar itens de uma venda
  const getSaleItems = (saleId: Id<"sales">) => {
    return useQuery(
      api.sales.getSaleItems,
      currentTenantId ? { tenantId: currentTenantId, saleId } : "skip"
    );
  };

  // Query para listar vendas por status
  const getSalesByStatus = (status: string) => {
    return useQuery(
      api.sales.listByStatus,
      currentTenantId ? { tenantId: currentTenantId, status } : "skip"
    );
  };

  // Query para calcular total de vendas por período
  const getTotalByDateRange = (startDate: number, endDate: number) => {
    return useQuery(
      api.sales.getTotalByDateRange,
      currentTenantId ? { tenantId: currentTenantId, startDate, endDate } : "skip"
    );
  };

  // Query para buscar vendas por forma de pagamento
  const getSalesByPaymentMethod = (paymentMethod: string) => {
    return useQuery(
      api.sales.getByPaymentMethod,
      currentTenantId ? { tenantId: currentTenantId, paymentMethod } : "skip"
    );
  };

  // Query para buscar métodos de pagamento de uma venda
  const getPaymentMethods = (saleId: Id<"sales">) => {
    return useQuery(
      api.sales.getPaymentMethods,
      currentTenantId ? { tenantId: currentTenantId, saleId } : "skip"
    );
  };

  // Query para buscar produtos mais vendidos
  const getTopSellingProducts = (limit?: number, startDate?: number, endDate?: number) => {
    return useQuery(
      api.sales.getTopSellingProducts,
      currentTenantId ? { 
        tenantId: currentTenantId, 
        limit, 
        startDate, 
        endDate 
      } : "skip"
    );
  };

  // Query para listar produtos agrupados para vendas
  const getProductsGroupedForSales = () => {
    return useQuery(
      api.sales.listProductsGroupedForSales,
      currentTenantId ? { tenantId: currentTenantId } : "skip"
    );
  };

  // Mutations
  const createSale = useMutation(api.sales.create);
  const updateSaleStatus = useMutation(api.sales.updateStatus);
  const updatePaymentAndStatus = useMutation(api.sales.updatePaymentAndStatus);
  const processPaymentWithMethods = useMutation(api.sales.processPaymentWithMethods);
  const updateDiscount = useMutation(api.sales.updateDiscount);
  const payItem = useMutation(api.sales.payItem);
  const refundItemPayment = useMutation(api.sales.refundItemPayment);

  /**
   * Criar uma nova venda
   */
  const create = async (data: {
    userId: Id<"users">;
    clerkUserId: string;
    items: Array<{
      productId: Id<"products">;
      productName: string;
      unitPrice: number;
      quantity: number;
    }>;
    paymentMethod: string;
    saleType: string;
    customerId?: Id<"customers">;
    discount?: number;
    notes?: string;
  }) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await createSale({
      tenantId: currentTenantId,
      ...data,
    });
  };

  /**
   * Atualizar status de uma venda
   */
  const updateStatus = async (saleId: Id<"sales">, status: string) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updateSaleStatus({
      tenantId: currentTenantId,
      id: saleId,
      status,
    });
  };

  /**
   * Atualizar método de pagamento e status de uma venda
   */
  const updatePaymentAndStatus = async (
    saleId: Id<"sales">,
    status: string,
    paymentMethod: string
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updatePaymentAndStatus({
      tenantId: currentTenantId,
      id: saleId,
      status,
      paymentMethod,
    });
  };

  /**
   * Processar pagamento com múltiplos métodos
   */
  const processPayment = async (
    saleId: Id<"sales">,
    paymentMethods: Array<{
      method: string;
      amount: number;
    }>
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await processPaymentWithMethods({
      tenantId: currentTenantId,
      saleId,
      paymentMethods,
    });
  };

  /**
   * Adicionar desconto a uma venda
   */
  const addDiscount = async (saleId: Id<"sales">, discount: number) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updateDiscount({
      tenantId: currentTenantId,
      id: saleId,
      discount,
    });
  };

  /**
   * Pagar um item específico
   */
  const payItem = async (
    saleItemId: Id<"saleItems">,
    paymentMethod: string,
    amount: number,
    customerName?: string
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await payItem({
      tenantId: currentTenantId,
      saleItemId,
      paymentMethod,
      amount,
      customerName,
    });
  };

  /**
   * Estornar pagamento de um item
   */
  const refundPayment = async (
    paymentId: Id<"paymentMethods">,
    reason: string
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await refundItemPayment({
      tenantId: currentTenantId,
      paymentId,
      reason,
    });
  };

  return {
    // Dados
    sales,
    
    // Queries
    getSalesByUser,
    getSalesByDateRange,
    getSaleById,
    getSaleWithItems,
    getSaleItems,
    getSalesByStatus,
    getTotalByDateRange,
    getSalesByPaymentMethod,
    getPaymentMethods,
    getTopSellingProducts,
    getProductsGroupedForSales,
    
    // Mutations
    create,
    updateStatus,
    updatePaymentAndStatus,
    processPayment,
    addDiscount,
    payItem,
    refundPayment,
    
    // Estado
    isLoading: sales === undefined,
    hasTenant: !!currentTenantId,
  };
}

/**
 * Hook para gerenciar produção com isolamento por tenant
 */
export function useProduction() {
  const { currentTenantId } = useTenant();

  // Query para listar itens em produção
  const productionItems = useQuery(
    api.production.listProductionItems,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para listar todos os itens de produção
  const allProductionItems = useQuery(
    api.production.getAllProductionItems,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para buscar item de produção específico
  const getProductionItem = (saleItemId: Id<"saleItems">) => {
    return useQuery(
      api.production.getProductionItem,
      currentTenantId ? { tenantId: currentTenantId, saleItemId } : "skip"
    );
  };

  // Query para estatísticas de produção
  const productionStats = useQuery(
    api.production.getProductionStats,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Mutations
  const initializeBeverages = useMutation(api.production.initializeBeverages);
  const startProduction = useMutation(api.production.startProduction);
  const completeProduction = useMutation(api.production.completeProduction);
  const deliverItem = useMutation(api.production.deliverItem);
  const revertProductionStatus = useMutation(api.production.revertProductionStatus);

  /**
   * Inicializar bebidas automaticamente
   */
  const initializeBeverages = async () => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await initializeBeverages({
      tenantId: currentTenantId,
    });
  };

  /**
   * Iniciar produção de um item
   */
  const start = async (saleItemId: Id<"saleItems">, userId?: Id<"users">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await startProduction({
      tenantId: currentTenantId,
      saleItemId,
      userId,
    });
  };

  /**
   * Concluir produção de um item
   */
  const complete = async (saleItemId: Id<"saleItems">, userId?: Id<"users">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await completeProduction({
      tenantId: currentTenantId,
      saleItemId,
      userId,
    });
  };

  /**
   * Entregar um item concluído
   */
  const deliver = async (saleItemId: Id<"saleItems">, userId?: Id<"users">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await deliverItem({
      tenantId: currentTenantId,
      saleItemId,
      userId,
    });
  };

  /**
   * Reverter status de produção
   */
  const revertStatus = async (
    saleItemId: Id<"saleItems">,
    newStatus: string,
    userId?: Id<"users">
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await revertProductionStatus({
      tenantId: currentTenantId,
      saleItemId,
      newStatus,
      userId,
    });
  };

  return {
    // Dados
    productionItems,
    allProductionItems,
    productionStats,
    
    // Queries
    getProductionItem,
    
    // Mutations
    initializeBeverages,
    start,
    complete,
    deliver,
    revertStatus,
    
    // Estado
    isLoading: productionItems === undefined,
    hasTenant: !!currentTenantId,
  };
}
