import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTenant } from '@/contexts/TenantContext';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Hook para gerenciar produtos com isolamento por tenant
 * Todas as operações são automaticamente filtradas pelo tenant atual
 */
export function useProducts() {
  const { currentTenantId } = useTenant();

  // Query para listar produtos ativos
  const products = useQuery(
    api.products.listActive,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para buscar produtos por categoria
  const getProductsByCategory = (categoryId: Id<"categories">) => {
    return useQuery(
      api.products.listByCategory,
      currentTenantId ? { tenantId: currentTenantId, categoryId } : "skip"
    );
  };

  // Query para buscar produto por ID
  const getProductById = (productId: Id<"products">) => {
    return useQuery(
      api.products.getById,
      currentTenantId ? { tenantId: currentTenantId, id: productId } : "skip"
    );
  };

  // Query para buscar produto por SKU
  const getProductBySku = (sku: string) => {
    return useQuery(
      api.products.getBySku,
      currentTenantId ? { tenantId: currentTenantId, sku } : "skip"
    );
  };

  // Query para buscar produtos por nome
  const searchProductsByName = (searchTerm: string) => {
    return useQuery(
      api.products.searchByName,
      currentTenantId && searchTerm.trim() 
        ? { tenantId: currentTenantId, searchTerm } 
        : "skip"
    );
  };

  // Mutation para criar produto
  const createProduct = useMutation(api.products.create);

  // Mutation para atualizar produto
  const updateProduct = useMutation(api.products.update);

  // Mutation para deletar produto
  const deleteProduct = useMutation(api.products.removeProduct);

  /**
   * Criar um novo produto
   */
  const create = async (data: {
    name: string;
    description?: string;
    price: number;
    image?: string;
    categoryId: Id<"categories">;
  }) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await createProduct({
      tenantId: currentTenantId,
      ...data,
    });
  };

  /**
   * Atualizar um produto existente
   */
  const update = async (
    productId: Id<"products">,
    data: {
      name?: string;
      description?: string;
      price?: number;
      image?: string;
      categoryId?: Id<"categories">;
    }
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updateProduct({
      tenantId: currentTenantId,
      id: productId,
      ...data,
    });
  };

  /**
   * Deletar um produto
   */
  const remove = async (productId: Id<"products">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await deleteProduct({
      tenantId: currentTenantId,
      id: productId,
    });
  };

  return {
    // Dados
    products,
    
    // Queries
    getProductsByCategory,
    getProductById,
    getProductBySku,
    searchProductsByName,
    
    // Mutations
    create,
    update,
    remove,
    
    // Estado
    isLoading: products === undefined,
    hasTenant: !!currentTenantId,
  };
}

/**
 * Hook para gerenciar categorias com isolamento por tenant
 */
export function useCategories() {
  const { currentTenantId } = useTenant();

  // Query para listar categorias ativas
  const categories = useQuery(
    api.categories.listActive,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para listar categorias com contagem de produtos
  const categoriesWithCount = useQuery(
    api.categories.listWithProductCount,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para buscar categoria por ID
  const getCategoryById = (categoryId: Id<"categories">) => {
    return useQuery(
      api.categories.getById,
      currentTenantId ? { tenantId: currentTenantId, id: categoryId } : "skip"
    );
  };

  // Query para buscar categoria por nome
  const getCategoryByName = (name: string) => {
    return useQuery(
      api.categories.getByName,
      currentTenantId ? { tenantId: currentTenantId, name } : "skip"
    );
  };

  // Query para buscar categorias por nome
  const searchCategoriesByName = (searchTerm: string) => {
    return useQuery(
      api.categories.searchByName,
      currentTenantId && searchTerm.trim() 
        ? { tenantId: currentTenantId, searchTerm } 
        : "skip"
    );
  };

  // Mutations
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  /**
   * Criar uma nova categoria
   */
  const create = async (data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await createCategory({
      tenantId: currentTenantId,
      ...data,
    });
  };

  /**
   * Atualizar uma categoria existente
   */
  const update = async (
    categoryId: Id<"categories">,
    data: {
      name?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
    }
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updateCategory({
      tenantId: currentTenantId,
      id: categoryId,
      ...data,
    });
  };

  /**
   * Deletar uma categoria
   */
  const remove = async (categoryId: Id<"categories">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await removeCategory({
      tenantId: currentTenantId,
      id: categoryId,
    });
  };

  return {
    // Dados
    categories,
    categoriesWithCount,
    
    // Queries
    getCategoryById,
    getCategoryByName,
    searchCategoriesByName,
    
    // Mutations
    create,
    update,
    remove,
    
    // Estado
    isLoading: categories === undefined,
    hasTenant: !!currentTenantId,
  };
}

/**
 * Hook para gerenciar clientes com isolamento por tenant
 */
export function useCustomers() {
  const { currentTenantId } = useTenant();

  // Query para listar clientes ativos
  const customers = useQuery(
    api.customers.listActive,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  // Query para buscar clientes
  const searchCustomers = (searchTerm: string) => {
    return useQuery(
      api.customers.search,
      currentTenantId && searchTerm.trim() 
        ? { tenantId: currentTenantId, searchTerm } 
        : "skip"
    );
  };

  // Query para buscar cliente por ID
  const getCustomerById = (customerId: Id<"customers">) => {
    return useQuery(
      api.customers.getById,
      currentTenantId ? { tenantId: currentTenantId, customerId } : "skip"
    );
  };

  // Mutations
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  const deactivateCustomer = useMutation(api.customers.deactivate);

  /**
   * Criar um novo cliente
   */
  const create = async (data: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  }) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await createCustomer({
      tenantId: currentTenantId,
      ...data,
    });
  };

  /**
   * Atualizar um cliente existente
   */
  const update = async (
    customerId: Id<"customers">,
    data: {
      name: string;
      phone: string;
      address: string;
      notes?: string;
    }
  ) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await updateCustomer({
      tenantId: currentTenantId,
      customerId,
      ...data,
    });
  };

  /**
   * Desativar um cliente
   */
  const deactivate = async (customerId: Id<"customers">) => {
    if (!currentTenantId) {
      throw new Error("Nenhum tenant selecionado");
    }

    return await deactivateCustomer({
      tenantId: currentTenantId,
      customerId,
    });
  };

  return {
    // Dados
    customers,
    
    // Queries
    searchCustomers,
    getCustomerById,
    
    // Mutations
    create,
    update,
    deactivate,
    
    // Estado
    isLoading: customers === undefined,
    hasTenant: !!currentTenantId,
  };
}
