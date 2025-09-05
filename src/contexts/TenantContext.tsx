import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useNavigate } from 'react-router-dom';

/**
 * Tipos para o contexto de tenant
 */
interface TenantInfo {
  _id: string;
  cnpj: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  plan: string;
  status: string;
  expiresAt: number;
  isExpired: boolean;
}

interface Membership {
  _id: string;
  tenantId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  lastAccess?: number;
  accessCount: number;
  tenant: TenantInfo | null;
}

interface TenantContextType {
  currentTenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
  memberships: Membership[];
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshMemberships: () => void;
  // Informações de expiração
  isExpired: boolean;
  isSuspended: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  tenantStatus: any;
}

/**
 * Contexto para gerenciar o estado atual do tenant
 */
const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Chave para armazenar o tenant atual no localStorage
 */
const CURRENT_TENANT_KEY = 'hotdog_current_tenant_id';

/**
 * Provider do contexto de tenant
 * 
 * @param children - Componentes React filhos que terão acesso ao contexto
 * @returns Provider do contexto envolvendo os componentes filhos
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  const [currentTenantId, setCurrentTenantIdState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buscar memberships do usuário via Convex
  const memberships = useQuery(
    api.memberships.listUserMemberships,
    user?.id ? { userId: user.id } : "skip"
  );

  // Estado de carregamento
  const isLoading = !userLoaded || (user?.id && memberships === undefined);

  /**
   * Função para definir o tenant atual
   * 
   * @param tenantId - ID do tenant ou null para limpar
   */
  const setTenantId = (tenantId: string | null) => {
    setCurrentTenantIdState(tenantId);
    
    if (tenantId) {
      localStorage.setItem(CURRENT_TENANT_KEY, tenantId);
    } else {
      localStorage.removeItem(CURRENT_TENANT_KEY);
    }
  };

  /**
   * Função para recarregar memberships
   */
  const refreshMemberships = () => {
    // O Convex automaticamente recarrega quando a query muda
    // Esta função pode ser expandida para forçar refresh se necessário
  };

  /**
   * Buscar informações do tenant atual
   */
  const tenantInfo = useQuery(
    api.tenants.getTenantById,
    currentTenantId ? { tenantId: currentTenantId as any } : "skip"
  );

  /**
   * Buscar status detalhado do tenant atual (incluindo expiração)
   */
  const tenantStatus = useQuery(
    api.tenants.getCurrentTenantStatus,
    currentTenantId ? { tenantId: currentTenantId as any } : "skip"
  );

  /**
   * Efeito para inicializar o tenant atual do localStorage
   */
  useEffect(() => {
    if (!userLoaded || !user?.id || !memberships) {
      return;
    }

    // Buscar tenant salvo no localStorage
    const savedTenantId = localStorage.getItem(CURRENT_TENANT_KEY);
    
    if (savedTenantId) {
      // Verificar se o tenant salvo ainda pertence às memberships do usuário
      const hasAccess = memberships.some(
        membership => membership.tenantId === savedTenantId && 
                     membership.status === 'active' &&
                     membership.tenant?.status === 'active' &&
                     !membership.tenant?.isExpired
      );

      if (hasAccess) {
        setCurrentTenantIdState(savedTenantId);
      } else {
        // Tenant salvo não é mais válido, limpar localStorage
        localStorage.removeItem(CURRENT_TENANT_KEY);
        setCurrentTenantIdState(null);
      }
    } else if (memberships.length > 0) {
      // Se não há tenant salvo, mas há memberships, selecionar o primeiro ativo
      const firstActiveMembership = memberships.find(
        membership => membership.status === 'active' &&
                     membership.tenant?.status === 'active' &&
                     !membership.tenant?.isExpired
      );

      if (firstActiveMembership) {
        setTenantId(firstActiveMembership.tenantId);
      }
    }
  }, [userLoaded, user?.id, memberships]);

  /**
   * Efeito para limpar estado quando usuário faz logout
   */
  useEffect(() => {
    if (userLoaded && !user) {
      setCurrentTenantIdState(null);
      setError(null);
      localStorage.removeItem(CURRENT_TENANT_KEY);
    }
  }, [userLoaded, user]);

  /**
   * Efeito para gerenciar erros
   */
  useEffect(() => {
    if (memberships === null) {
      setError('Erro ao carregar memberships');
    } else {
      setError(null);
    }
  }, [memberships]);

  const contextValue: TenantContextType = {
    currentTenantId,
    setTenantId,
    memberships: memberships || [],
    tenantInfo: tenantInfo || null,
    isLoading,
    error,
    refreshMemberships,
    // Informações de expiração
    isExpired: tenantStatus?.isExpired || false,
    isSuspended: tenantStatus?.isSuspended || false,
    isExpiringSoon: tenantStatus?.status === 'expiring_soon',
    daysUntilExpiry: tenantStatus?.daysUntilExpiry || 0,
    tenantStatus: tenantStatus || null,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook para usar o contexto de tenant
 * 
 * @returns Contexto de tenant
 * @throws Error se usado fora do TenantProvider
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  
  return context;
}

/**
 * Hook para verificar se o usuário tem acesso ao tenant atual
 * 
 * @returns Objeto com informações de acesso
 */
export function useTenantAccess() {
  const { currentTenantId, memberships } = useTenant();
  
  const currentMembership = memberships.find(
    membership => membership.tenantId === currentTenantId
  );

  return {
    hasAccess: !!currentMembership,
    membership: currentMembership,
    role: currentMembership?.role || null,
    isAdmin: currentMembership?.role === 'admin',
    isManager: currentMembership?.role === 'manager',
    isEmployee: currentMembership?.role === 'employee',
  };
}

/**
 * Hook para obter informações do tenant atual
 * 
 * @returns Informações do tenant atual
 */
export function useCurrentTenant() {
  const { currentTenantId, tenantInfo, memberships } = useTenant();
  
  const currentMembership = memberships.find(
    membership => membership.tenantId === currentTenantId
  );

  return {
    tenantId: currentTenantId,
    tenantInfo,
    membership: currentMembership,
    isLoaded: tenantInfo !== undefined,
  };
}

/**
 * Hook para obter lista de tenants disponíveis
 * 
 * @returns Lista de tenants com informações de acesso
 */
export function useAvailableTenants() {
  const { memberships } = useTenant();
  
  return memberships
    .filter(membership => 
      membership.status === 'active' &&
      membership.tenant?.status === 'active' &&
      !membership.tenant?.isExpired
    )
    .map(membership => ({
      tenantId: membership.tenantId,
      tenantInfo: membership.tenant!,
      role: membership.role,
      membership,
    }));
}
