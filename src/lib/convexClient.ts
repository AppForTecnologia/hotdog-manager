/**
 * Cliente Convex Dinâmico
 * 
 * Este arquivo implementa um sistema de cliente Convex dinâmico que pode ser
 * inicializado com base nos dados do tenant. Permite conectar a diferentes
 * projetos Convex dependendo do tenant selecionado.
 * 
 * IMPORTANTE: Funcionalidade de provisionamento físico está desabilitada por padrão
 * Atualmente usa o cliente padrão, mas está preparado para clientes dinâmicos
 */

import { ConvexReactClient } from "convex/react";
import { ConvexHttpClient } from "convex/browser";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Configuração de um cliente Convex para um tenant específico
 */
export interface TenantConvexConfig {
  /** ID do tenant */
  tenantId: string;
  /** CNPJ da empresa */
  cnpj: string;
  /** Nome da empresa */
  companyName: string;
  /** URL do projeto Convex do tenant */
  convexUrl: string;
  /** Chave de acesso do projeto Convex */
  convexKey?: string;
  /** ID do projeto Convex */
  convexProjectId?: string;
  /** Status do provisionamento */
  provisioningStatus: 'not_provisioned' | 'provisioning' | 'provisioned' | 'failed';
  /** Data da última atualização */
  lastUpdated: number;
}

/**
 * Contexto do cliente Convex dinâmico
 */
interface DynamicConvexContextType {
  /** Cliente Convex atual */
  currentClient: ConvexReactClient;
  /** Configuração do tenant atual */
  currentTenantConfig: TenantConvexConfig | null;
  /** Status de conexão */
  isConnected: boolean;
  /** Erro de conexão */
  connectionError: string | null;
  /** Função para trocar de tenant */
  switchTenant: (tenantConfig: TenantConvexConfig) => Promise<boolean>;
  /** Função para reconectar */
  reconnect: () => Promise<boolean>;
  /** Verificar se provisionamento físico está habilitado */
  isPhysicalProvisioningEnabled: boolean;
}

// ============================================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================================

/**
 * Configuração padrão do cliente Convex
 */
const DEFAULT_CONVEX_CONFIG = {
  /** URL padrão do Convex (usado quando não há tenant específico) */
  defaultUrl: import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud',
  /** Timeout para conexão */
  connectionTimeout: 10000,
  /** Intervalo de reconexão automática */
  reconnectInterval: 5000,
  /** Máximo de tentativas de reconexão */
  maxReconnectAttempts: 3
};

/**
 * Feature flags para provisionamento físico
 */
const PROVISIONING_FEATURE_FLAGS = {
  /** Habilita clientes Convex dinâmicos por tenant */
  ENABLE_DYNAMIC_CONVEX_CLIENTS: false,
  
  /** Habilita reconexão automática */
  AUTO_RECONNECT: true,
  
  /** Habilita cache de configurações de tenant */
  ENABLE_TENANT_CACHE: true,
  
  /** Habilita logs detalhados de conexão */
  ENABLE_CONNECTION_LOGS: false
} as const;

// ============================================================================
// CLASSE DO CLIENTE DINÂMICO
// ============================================================================

/**
 * Classe para gerenciar clientes Convex dinâmicos
 * Permite trocar entre diferentes projetos Convex baseados no tenant
 */
class DynamicConvexManager {
  private currentClient: ConvexReactClient;
  private currentTenantConfig: TenantConvexConfig | null = null;
  private isConnected: boolean = false;
  private connectionError: string | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Inicializar com cliente padrão
    this.currentClient = new ConvexReactClient(DEFAULT_CONVEX_CONFIG.defaultUrl);
    this.initializeConnection();
  }

  /**
   * Inicializa a conexão com o cliente atual
   */
  private async initializeConnection(): Promise<void> {
    try {
      // TODO: Implementar verificação real de conexão
      // Por enquanto, assumir que está conectado
      this.isConnected = true;
      this.connectionError = null;
      this.reconnectAttempts = 0;
      
      if (PROVISIONING_FEATURE_FLAGS.ENABLE_CONNECTION_LOGS) {
        console.log('🔗 Cliente Convex inicializado');
      }
    } catch (error) {
      this.isConnected = false;
      this.connectionError = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao inicializar cliente Convex:', error);
    }
  }

  /**
   * Troca para um cliente Convex específico do tenant
   */
  async switchToTenant(tenantConfig: TenantConvexConfig): Promise<boolean> {
    try {
      if (PROVISIONING_FEATURE_FLAGS.ENABLE_CONNECTION_LOGS) {
        console.log(`🔄 Trocando para tenant ${tenantConfig.tenantId}`);
      }

      // Verificar se provisionamento físico está habilitado
      if (!PROVISIONING_FEATURE_FLAGS.ENABLE_DYNAMIC_CONVEX_CLIENTS) {
        console.log('⚠️ Clientes dinâmicos desabilitados - usando cliente padrão');
        this.currentTenantConfig = tenantConfig;
        return true;
      }

      // Verificar se o tenant tem projeto Convex próprio
      if (tenantConfig.provisioningStatus !== 'provisioned') {
        console.log('⚠️ Tenant não possui projeto Convex próprio - usando cliente padrão');
        this.currentTenantConfig = tenantConfig;
        return true;
      }

      // Criar novo cliente para o tenant
      const newClient = new ConvexReactClient(tenantConfig.convexUrl);
      
      // TODO: Implementar verificação real de conexão
      // Por enquanto, assumir que a conexão é bem-sucedida
      
      // Atualizar cliente atual
      this.currentClient = newClient;
      this.currentTenantConfig = tenantConfig;
      this.isConnected = true;
      this.connectionError = null;
      this.reconnectAttempts = 0;

      if (PROVISIONING_FEATURE_FLAGS.ENABLE_CONNECTION_LOGS) {
        console.log(`✅ Cliente trocado para tenant ${tenantConfig.tenantId}`);
        console.log(`🔗 URL: ${tenantConfig.convexUrl}`);
      }

      return true;

    } catch (error) {
      this.isConnected = false;
      this.connectionError = error instanceof Error ? error.message : String(error);
      console.error(`❌ Erro ao trocar para tenant ${tenantConfig.tenantId}:`, error);
      return false;
    }
  }

  /**
   * Reconecta o cliente atual
   */
  async reconnect(): Promise<boolean> {
    try {
      if (PROVISIONING_FEATURE_FLAGS.ENABLE_CONNECTION_LOGS) {
        console.log('🔄 Tentando reconectar cliente Convex...');
      }

      // Limpar timer de reconexão anterior
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Tentar reconectar
      await this.initializeConnection();

      if (this.isConnected) {
        this.reconnectAttempts = 0;
        if (PROVISIONING_FEATURE_FLAGS.ENABLE_CONNECTION_LOGS) {
          console.log('✅ Cliente Convex reconectado');
        }
        return true;
      } else {
        throw new Error('Falha na reconexão');
      }

    } catch (error) {
      this.reconnectAttempts++;
      this.connectionError = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Erro na reconexão (tentativa ${this.reconnectAttempts}):`, error);

      // Tentar reconexão automática se habilitada
      if (PROVISIONING_FEATURE_FLAGS.AUTO_RECONNECT && 
          this.reconnectAttempts < DEFAULT_CONVEX_CONFIG.maxReconnectAttempts) {
        
        this.reconnectTimer = setTimeout(() => {
          this.reconnect();
        }, DEFAULT_CONVEX_CONFIG.reconnectInterval);
      }

      return false;
    }
  }

  /**
   * Obtém o cliente Convex atual
   */
  getCurrentClient(): ConvexReactClient {
    return this.currentClient;
  }

  /**
   * Obtém a configuração do tenant atual
   */
  getCurrentTenantConfig(): TenantConvexConfig | null {
    return this.currentTenantConfig;
  }

  /**
   * Obtém o status de conexão
   */
  getConnectionStatus(): { isConnected: boolean; error: string | null } {
    return {
      isConnected: this.isConnected,
      error: this.connectionError
    };
  }

  /**
   * Verifica se provisionamento físico está habilitado
   */
  isPhysicalProvisioningEnabled(): boolean {
    return PROVISIONING_FEATURE_FLAGS.ENABLE_DYNAMIC_CONVEX_CLIENTS;
  }

  /**
   * Habilita/desabilita provisionamento físico
   */
  setPhysicalProvisioningEnabled(enabled: boolean): void {
    (PROVISIONING_FEATURE_FLAGS as any).ENABLE_DYNAMIC_CONVEX_CLIENTS = enabled;
    console.log(`🔧 Clientes dinâmicos ${enabled ? 'habilitados' : 'desabilitados'}`);
  }

  /**
   * Limpa recursos e desconecta
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isConnected = false;
    this.connectionError = null;
    this.reconnectAttempts = 0;
    
    if (PROVISIONING_FEATURE_FLAGS.ENABLE_CONNECTION_LOGS) {
      console.log('🔌 Cliente Convex desconectado');
    }
  }
}

// ============================================================================
// CONTEXTO REACT
// ============================================================================

/**
 * Instância global do gerenciador de clientes dinâmicos
 */
const dynamicConvexManager = new DynamicConvexManager();

/**
 * Contexto React para o cliente Convex dinâmico
 */
const DynamicConvexContext = createContext<DynamicConvexContextType | null>(null);

/**
 * Provider do cliente Convex dinâmico
 */
export function DynamicConvexProvider({ children }: { children: ReactNode }) {
  const [currentClient, setCurrentClient] = useState<ConvexReactClient>(
    dynamicConvexManager.getCurrentClient()
  );
  const [currentTenantConfig, setCurrentTenantConfig] = useState<TenantConvexConfig | null>(
    dynamicConvexManager.getCurrentTenantConfig()
  );
  const [isConnected, setIsConnected] = useState<boolean>(
    dynamicConvexManager.getConnectionStatus().isConnected
  );
  const [connectionError, setConnectionError] = useState<string | null>(
    dynamicConvexManager.getConnectionStatus().error
  );

  // Atualizar estado quando o gerenciador muda
  useEffect(() => {
    const updateStatus = () => {
      const status = dynamicConvexManager.getConnectionStatus();
      setIsConnected(status.isConnected);
      setConnectionError(status.error);
      setCurrentTenantConfig(dynamicConvexManager.getCurrentTenantConfig());
    };

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Troca para um tenant específico
   */
  const switchTenant = async (tenantConfig: TenantConvexConfig): Promise<boolean> => {
    const success = await dynamicConvexManager.switchToTenant(tenantConfig);
    
    if (success) {
      setCurrentClient(dynamicConvexManager.getCurrentClient());
      setCurrentTenantConfig(dynamicConvexManager.getCurrentTenantConfig());
      setIsConnected(dynamicConvexManager.getConnectionStatus().isConnected);
      setConnectionError(dynamicConvexManager.getConnectionStatus().error);
    }
    
    return success;
  };

  /**
   * Reconecta o cliente atual
   */
  const reconnect = async (): Promise<boolean> => {
    const success = await dynamicConvexManager.reconnect();
    
    if (success) {
      setIsConnected(true);
      setConnectionError(null);
    } else {
      setIsConnected(false);
      setConnectionError(dynamicConvexManager.getConnectionStatus().error);
    }
    
    return success;
  };

  const contextValue: DynamicConvexContextType = {
    currentClient,
    currentTenantConfig,
    isConnected,
    connectionError,
    switchTenant,
    reconnect,
    isPhysicalProvisioningEnabled: dynamicConvexManager.isPhysicalProvisioningEnabled()
  };

  return (
    <DynamicConvexContext.Provider value={contextValue}>
      {children}
    </DynamicConvexContext.Provider>
  );
}

/**
 * Hook para usar o cliente Convex dinâmico
 */
export function useDynamicConvex(): DynamicConvexContextType {
  const context = useContext(DynamicConvexContext);
  
  if (!context) {
    throw new Error('useDynamicConvex deve ser usado dentro de DynamicConvexProvider');
  }
  
  return context;
}

// ============================================================================
// FUNÇÕES DE UTILIDADE
// ============================================================================

/**
 * Cria uma configuração de tenant Convex
 */
export function createTenantConvexConfig(
  tenantId: string,
  cnpj: string,
  companyName: string,
  convexUrl: string,
  convexKey?: string,
  convexProjectId?: string,
  provisioningStatus: TenantConvexConfig['provisioningStatus'] = 'not_provisioned'
): TenantConvexConfig {
  return {
    tenantId,
    cnpj,
    companyName,
    convexUrl,
    convexKey,
    convexProjectId,
    provisioningStatus,
    lastUpdated: Date.now()
  };
}

/**
 * Verifica se um tenant tem projeto Convex próprio
 */
export function hasTenantOwnProject(tenantConfig: TenantConvexConfig): boolean {
  return tenantConfig.provisioningStatus === 'provisioned' && 
         !!tenantConfig.convexUrl && 
         tenantConfig.convexUrl !== DEFAULT_CONVEX_CONFIG.defaultUrl;
}

/**
 * Obtém URL do Convex para um tenant
 */
export function getTenantConvexUrl(tenantConfig: TenantConvexConfig | null): string {
  if (!tenantConfig || !hasTenantOwnProject(tenantConfig)) {
    return DEFAULT_CONVEX_CONFIG.defaultUrl;
  }
  
  return tenantConfig.convexUrl;
}

/**
 * Valida configuração de tenant Convex
 */
export function validateTenantConvexConfig(config: TenantConvexConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.tenantId) {
    errors.push('tenantId é obrigatório');
  }

  if (!config.cnpj) {
    errors.push('cnpj é obrigatório');
  }

  if (!config.companyName) {
    errors.push('companyName é obrigatório');
  }

  if (!config.convexUrl) {
    errors.push('convexUrl é obrigatório');
  }

  if (config.provisioningStatus === 'provisioned' && !config.convexProjectId) {
    errors.push('convexProjectId é obrigatório para tenants provisionados');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// EXPORTAÇÕES PRINCIPAIS
// ============================================================================

export {
  DynamicConvexManager,
  PROVISIONING_FEATURE_FLAGS,
  DEFAULT_CONVEX_CONFIG
};

// Exportar tipos
export type {
  TenantConvexConfig,
  DynamicConvexContextType
};
