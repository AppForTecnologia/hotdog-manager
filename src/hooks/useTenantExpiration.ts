import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook para detectar expiração de tenant e redirecionar automaticamente
 * Monitora o status do tenant atual e redireciona para /plano-expirado quando necessário
 */
export function useTenantExpiration() {
  const navigate = useNavigate();
  const { currentTenantId } = useTenant();

  // Buscar status do tenant atual
  const tenantStatus = useQuery(
    api.tenants.getCurrentTenantStatus,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  useEffect(() => {
    if (tenantStatus && currentTenantId) {
      const { status, isExpired, isSuspended } = tenantStatus;
      
      // Redirecionar se o tenant está expirado ou suspenso
      if (status === 'expired' || status === 'suspended' || isExpired || isSuspended) {
        navigate('/plano-expirado', { replace: true });
      }
    }
  }, [tenantStatus, currentTenantId, navigate]);

  return {
    tenantStatus,
    isExpired: tenantStatus?.isExpired || false,
    isSuspended: tenantStatus?.isSuspended || false,
    isExpiringSoon: tenantStatus?.status === 'expiring_soon',
    daysUntilExpiry: tenantStatus?.daysUntilExpiry || 0,
  };
}

/**
 * Hook para interceptar erros de Convex e detectar expiração
 * Captura erros de TENANT_EXPIRED e TENANT_SUSPENDED e redireciona
 */
export function useConvexErrorHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Interceptar erros globais do Convex
    const handleConvexError = (error: any) => {
      if (error?.message) {
        const message = error.message;
        
        // Detectar erros de expiração ou suspensão
        if (message.includes('TENANT_EXPIRED') || message.includes('TENANT_SUSPENDED')) {
          navigate('/plano-expirado', { replace: true });
          return true; // Erro tratado
        }
      }
      return false; // Erro não tratado
    };

    // Adicionar listener global para erros
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const error = args[0];
      if (error && typeof error === 'object') {
        handleConvexError(error);
      }
      originalConsoleError.apply(console, args);
    };

    // Cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, [navigate]);
}

/**
 * Hook para verificar se o tenant está próximo do vencimento
 * Exibe alertas ou notificações quando o tenant está prestes a expirar
 */
export function useTenantExpirationWarning() {
  const { tenantStatus } = useTenantExpiration();

  useEffect(() => {
    if (tenantStatus && tenantStatus.status === 'expiring_soon') {
      const daysLeft = tenantStatus.daysUntilExpiry;
      
      // Exibir notificação se restam 3 dias ou menos
      if (daysLeft <= 3) {
        const message = `Seu plano expira em ${daysLeft} dias. Renove para evitar interrupções.`;
        
        // Usar a API de notificação do navegador se disponível
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('HotDog Manager - Plano Expirando', {
            body: message,
            icon: '/favicon.ico',
          });
        }
        
        // Log para console (pode ser substituído por toast/alert)
        console.warn('⚠️', message);
      }
    }
  }, [tenantStatus]);

  return {
    isExpiringSoon: tenantStatus?.status === 'expiring_soon',
    daysUntilExpiry: tenantStatus?.daysUntilExpiry || 0,
    shouldShowWarning: tenantStatus?.status === 'expiring_soon' && tenantStatus?.daysUntilExpiry <= 7,
  };
}

/**
 * Hook para obter informações completas sobre expiração do tenant
 * Combina todos os hooks de expiração em uma única interface
 */
export function useTenantExpirationStatus() {
  const tenantExpiration = useTenantExpiration();
  const expirationWarning = useTenantExpirationWarning();
  
  useConvexErrorHandler(); // Interceptar erros automaticamente

  return {
    ...tenantExpiration,
    ...expirationWarning,
    
    // Status consolidado
    status: tenantExpiration.tenantStatus?.status || 'unknown',
    message: tenantExpiration.tenantStatus?.message || '',
    
    // Informações do tenant
    tenant: tenantExpiration.tenantStatus?.tenant,
    membership: tenantExpiration.tenantStatus?.membership,
    
    // Flags de status
    isActive: tenantExpiration.tenantStatus?.status === 'active',
    isExpired: tenantExpiration.isExpired,
    isSuspended: tenantExpiration.isSuspended,
    isExpiringSoon: tenantExpiration.isExpiringSoon,
    hasNoAccess: tenantExpiration.tenantStatus?.status === 'no_access',
    notFound: tenantExpiration.tenantStatus?.status === 'not_found',
    
    // Datas
    expiresAt: tenantExpiration.tenantStatus?.expiresAt,
    daysUntilExpiry: tenantExpiration.daysUntilExpiry,
    
    // Ações
    shouldRedirect: tenantExpiration.isExpired || tenantExpiration.isSuspended,
    shouldShowWarning: expirationWarning.shouldShowWarning,
  };
}
