import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTenant } from '@/contexts/TenantContext';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Hook para gerenciar caixa com isolamento por tenant
 * Todas as operações são automaticamente filtradas pelo tenant atual
 */
export function useCashRegister() {
  const { currentTenantId } = useTenant();

  // Query para listar todo o histórico de caixa
  const cashRegisterHistory = useQuery(
    api.cashRegister.listAll,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para buscar registro de caixa por ID
  const getCashRegisterById = (recordId: Id<"cashRegister">) => {
    return useQuery(
      api.cashRegister.getById,
      currentTenantId ? { tenantId: currentTenantId, id: recordId } : "skip"
    );
  };

  // Query para buscar registro de caixa por data
  const getCashRegisterByDate = (date: number) => {
    return useQuery(
      api.cashRegister.getByDate,
      currentTenantId ? { tenantId: currentTenantId, date } : "skip"
    );
  };

  // Query para listar registros de caixa por período
  const getCashRegisterByDateRange = (startDate: number, endDate: number) => {
    return useQuery(
      api.cashRegister.listByDateRange,
      currentTenantId ? { tenantId: currentTenantId, startDate, endDate } : "skip"
    );
  };

  // Mutations
  const createCashRegisterRecord = useMutation(api.cashRegister.create);
  const updateCashRegisterRecord = useMutation(api.cashRegister.update);
  const removeCashRegisterRecord = useMutation(api.cashRegister.remove);

  /**
   * Criar um novo registro de fechamento de caixa
   */
  const create = async (data: {
    userId: Id<"users">;
    clerkUserId: string;
    moneyCount: number;
    creditCount: number;
    debitCount: number;
    pixCount: number;
    totalCount: number;
    moneySales: number;
    creditSales: number;
    debitSales: number;
    pixSales: number;
    totalSales: number;
    moneyDiff: number;
    creditDiff: number;
    debitDiff: number;
    pixDiff: number;
    totalDiff: number;
    notes?: string;
  }) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await createCashRegisterRecord({
      tenantId: currentTenantId,
      ...data,
    });
  };

  /**
   * Atualizar um registro de caixa
   */
  const update = async (
    recordId: Id<"cashRegister">,
    data: {
      notes?: string;
    }
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updateCashRegisterRecord({
      tenantId: currentTenantId,
      id: recordId,
      ...data,
    });
  };

  /**
   * Deletar um registro de caixa
   */
  const remove = async (recordId: Id<"cashRegister">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await removeCashRegisterRecord({
      tenantId: currentTenantId,
      id: recordId,
    });
  };

  return {
    // Dados
    cashRegisterHistory,
    
    // Queries
    getCashRegisterById,
    getCashRegisterByDate,
    getCashRegisterByDateRange,
    
    // Mutations
    create,
    update,
    remove,
    
    // Estado
    isLoading: cashRegisterHistory === undefined,
    hasTenant: !!currentTenantId,
  };
}
