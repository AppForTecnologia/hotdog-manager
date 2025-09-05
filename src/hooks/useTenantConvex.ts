/**
 * Hook para gerenciar clientes Convex por tenant
 * 
 * Este hook fornece funcionalidades para trocar entre diferentes
 * projetos Convex baseados no tenant selecionado.
 * 
 * IMPORTANTE: Funcionalidade de provisionamento físico está desabilitada por padrão
 */

import { useCallback, useEffect, useState } from 'react';
import { useDynamicConvex, TenantConvexConfig, createTenantConvexConfig } from '@/lib/convexClient';

/**
 * Hook para gerenciar clientes Convex por tenant
 * 
 * @returns Objeto com funções e estado para gerenciar clientes Convex
 */
export function useTenantConvex() {
  const {
    currentClient,
    currentTenantConfig,
    isConnected,
    connectionError,
    switchTenant,
    reconnect,
    isPhysicalProvisioningEnabled
  } = useDynamicConvex();

  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  /**
   * Troca para um tenant específico
   */
  const switchToTenant = useCallback(async (
    tenantId: string,
    cnpj: string,
    companyName: string,
    convexUrl?: string,
    convexKey?: string,
    convexProjectId?: string,
    provisioningStatus: TenantConvexConfig['provisioningStatus'] = 'not_provisioned'
  ) => {
    setIsSwitching(true);
    setSwitchError(null);

    try {
      // Criar configuração do tenant
      const tenantConfig = createTenantConvexConfig(
        tenantId,
        cnpj,
        companyName,
        convexUrl || 'https://placeholder.convex.cloud',
        convexKey,
        convexProjectId,
        provisioningStatus
      );

      // Trocar para o tenant
      const success = await switchTenant(tenantConfig);

      if (!success) {
        throw new Error('Falha ao trocar para o tenant');
      }

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSwitchError(errorMessage);
      console.error('❌ Erro ao trocar para tenant:', error);
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [switchTenant]);

  /**
   * Reconecta o cliente atual
   */
  const reconnectClient = useCallback(async () => {
    try {
      const success = await reconnect();
      return success;
    } catch (error) {
      console.error('❌ Erro ao reconectar:', error);
      return false;
    }
  }, [reconnect]);

  /**
   * Verifica se o tenant atual tem projeto próprio
   */
  const hasTenantOwnProject = useCallback(() => {
    return currentTenantConfig?.provisioningStatus === 'provisioned' && 
           !!currentTenantConfig?.convexUrl &&
           currentTenantConfig.convexUrl !== 'https://placeholder.convex.cloud';
  }, [currentTenantConfig]);

  /**
   * Obtém informações do tenant atual
   */
  const getCurrentTenantInfo = useCallback(() => {
    if (!currentTenantConfig) {
      return null;
    }

    return {
      tenantId: currentTenantConfig.tenantId,
      cnpj: currentTenantConfig.cnpj,
      companyName: currentTenantConfig.companyName,
      convexUrl: currentTenantConfig.convexUrl,
      convexProjectId: currentTenantConfig.convexProjectId,
      provisioningStatus: currentTenantConfig.provisioningStatus,
      hasOwnProject: hasTenantOwnProject(),
      lastUpdated: currentTenantConfig.lastUpdated
    };
  }, [currentTenantConfig, hasTenantOwnProject]);

  /**
   * Limpa erros de troca
   */
  const clearSwitchError = useCallback(() => {
    setSwitchError(null);
  }, []);

  /**
   * Verifica se está usando cliente padrão
   */
  const isUsingDefaultClient = useCallback(() => {
    return !currentTenantConfig || 
           currentTenantConfig.provisioningStatus !== 'provisioned' ||
           !hasTenantOwnProject();
  }, [currentTenantConfig, hasTenantOwnProject]);

  return {
    // Estado atual
    currentClient,
    currentTenantConfig,
    isConnected,
    connectionError,
    isSwitching,
    switchError,
    
    // Funcionalidades
    switchToTenant,
    reconnectClient,
    clearSwitchError,
    
    // Informações
    getCurrentTenantInfo,
    hasTenantOwnProject,
    isUsingDefaultClient,
    isPhysicalProvisioningEnabled,
    
    // Status
    isReady: isConnected && !isSwitching,
    hasError: !!connectionError || !!switchError
  };
}

/**
 * Hook para monitorar status de conexão Convex
 * 
 * @returns Objeto com status de conexão e funções de monitoramento
 */
export function useConvexConnectionStatus() {
  const { isConnected, connectionError, reconnect } = useDynamicConvex();
  const [lastConnectionTime, setLastConnectionTime] = useState<number | null>(null);
  const [connectionHistory, setConnectionHistory] = useState<Array<{
    timestamp: number;
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
  }>>([]);

  // Monitorar mudanças de conexão
  useEffect(() => {
    const now = Date.now();
    
    if (isConnected && !connectionError) {
      setLastConnectionTime(now);
      setConnectionHistory(prev => [...prev, {
        timestamp: now,
        status: 'connected'
      }]);
    } else if (connectionError) {
      setConnectionHistory(prev => [...prev, {
        timestamp: now,
        status: 'error',
        error: connectionError
      }]);
    } else {
      setConnectionHistory(prev => [...prev, {
        timestamp: now,
        status: 'disconnected'
      }]);
    }
  }, [isConnected, connectionError]);

  /**
   * Reconecta manualmente
   */
  const manualReconnect = useCallback(async () => {
    try {
      const success = await reconnect();
      return success;
    } catch (error) {
      console.error('❌ Erro na reconexão manual:', error);
      return false;
    }
  }, [reconnect]);

  /**
   * Limpa histórico de conexão
   */
  const clearHistory = useCallback(() => {
    setConnectionHistory([]);
  }, []);

  /**
   * Obtém estatísticas de conexão
   */
  const getConnectionStats = useCallback(() => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentHistory = connectionHistory.filter(
      entry => entry.timestamp > oneHourAgo
    );
    
    const connectedCount = recentHistory.filter(
      entry => entry.status === 'connected'
    ).length;
    
    const errorCount = recentHistory.filter(
      entry => entry.status === 'error'
    ).length;
    
    const disconnectedCount = recentHistory.filter(
      entry => entry.status === 'disconnected'
    ).length;
    
    return {
      totalEvents: recentHistory.length,
      connectedEvents: connectedCount,
      errorEvents: errorCount,
      disconnectedEvents: disconnectedCount,
      uptime: recentHistory.length > 0 ? 
        (connectedCount / recentHistory.length) * 100 : 0
    };
  }, [connectionHistory]);

  return {
    // Estado atual
    isConnected,
    connectionError,
    lastConnectionTime,
    connectionHistory,
    
    // Funcionalidades
    manualReconnect,
    clearHistory,
    
    // Estatísticas
    getConnectionStats
  };
}

/**
 * Hook para gerenciar feature flags de provisionamento
 * 
 * @returns Objeto com funções para gerenciar feature flags
 */
export function useProvisioningFeatureFlags() {
  const { isPhysicalProvisioningEnabled } = useDynamicConvex();
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});

  /**
   * Verifica se uma feature flag está habilitada
   */
  const isFeatureEnabled = useCallback((feature: string) => {
    return localFlags[feature] || false;
  }, [localFlags]);

  /**
   * Habilita uma feature flag
   */
  const enableFeature = useCallback((feature: string) => {
    setLocalFlags(prev => ({
      ...prev,
      [feature]: true
    }));
    console.log(`🔧 Feature flag ${feature} habilitada`);
  }, []);

  /**
   * Desabilita uma feature flag
   */
  const disableFeature = useCallback((feature: string) => {
    setLocalFlags(prev => ({
      ...prev,
      [feature]: false
    }));
    console.log(`🔧 Feature flag ${feature} desabilitada`);
  }, []);

  /**
   * Alterna uma feature flag
   */
  const toggleFeature = useCallback((feature: string) => {
    setLocalFlags(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
    console.log(`🔧 Feature flag ${feature} alternada para ${!localFlags[feature]}`);
  }, [localFlags]);

  /**
   * Obtém todas as feature flags
   */
  const getAllFlags = useCallback(() => {
    return {
      physicalProvisioning: isPhysicalProvisioningEnabled,
      ...localFlags
    };
  }, [isPhysicalProvisioningEnabled, localFlags]);

  return {
    isPhysicalProvisioningEnabled,
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    toggleFeature,
    getAllFlags
  };
}
