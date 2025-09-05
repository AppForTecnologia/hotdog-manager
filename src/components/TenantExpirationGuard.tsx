import React from 'react';
import { useTenantExpiration } from '@/hooks/useTenantExpiration';

/**
 * Componente para proteger rotas contra tenants expirados ou suspensos
 * Redireciona automaticamente para /plano-expirado quando necessário
 */
interface TenantExpirationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function TenantExpirationGuard({ children, fallback }: TenantExpirationGuardProps) {
  const { tenantStatus, isExpired, isSuspended } = useTenantExpiration();

  // Se está carregando, mostrar fallback ou children
  if (!tenantStatus) {
    return <>{fallback || children}</>;
  }

  // Se o tenant está expirado ou suspenso, o hook já redirecionou
  // Mas podemos mostrar um fallback enquanto o redirecionamento acontece
  if (isExpired || isSuspended) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status do plano...</p>
        </div>
      </div>
    );
  }

  // Se o tenant está ativo, renderizar children normalmente
  return <>{children}</>;
}

/**
 * Componente para exibir aviso de expiração próxima
 * Mostra um banner quando o tenant está próximo do vencimento
 */
interface ExpirationWarningBannerProps {
  className?: string;
}

export function ExpirationWarningBanner({ className = '' }: ExpirationWarningBannerProps) {
  const { isExpiringSoon, daysUntilExpiry, tenantStatus } = useTenantExpiration();

  if (!isExpiringSoon || !tenantStatus) {
    return null;
  }

  return (
    <div className={`bg-orange-50 border-l-4 border-orange-400 p-4 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-orange-400 text-xl">⚠️</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-orange-800">
            <strong>Seu plano expira em {daysUntilExpiry} dias!</strong>
            {' '}Renove agora para evitar interrupções no serviço.
          </p>
          <div className="mt-2">
            <button
              onClick={() => window.location.href = '/plano-expirado'}
              className="text-sm font-medium text-orange-800 hover:text-orange-900 underline"
            >
              Renovar Plano →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente para exibir status do tenant na interface
 * Mostra informações sobre expiração de forma discreta
 */
interface TenantStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function TenantStatusIndicator({ showDetails = false, className = '' }: TenantStatusIndicatorProps) {
  const { tenantStatus, isExpired, isSuspended, isExpiringSoon, daysUntilExpiry } = useTenantExpiration();

  if (!tenantStatus || tenantStatus.status === 'active') {
    return null;
  }

  const getStatusColor = () => {
    if (isExpired) return 'text-red-600 bg-red-50 border-red-200';
    if (isSuspended) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (isExpiringSoon) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = () => {
    if (isExpired) return '⏰';
    if (isSuspended) return '⏸️';
    if (isExpiringSoon) return '⚠️';
    return 'ℹ️';
  };

  const getStatusText = () => {
    if (isExpired) return 'Plano Expirado';
    if (isSuspended) return 'Plano Suspenso';
    if (isExpiringSoon) return `Expira em ${daysUntilExpiry} dias`;
    return 'Status Desconhecido';
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()} ${className}`}>
      <span className="mr-2">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
      {showDetails && (
        <button
          onClick={() => window.location.href = '/plano-expirado'}
          className="ml-2 text-xs underline hover:no-underline"
        >
          Ver detalhes
        </button>
      )}
    </div>
  );
}

/**
 * Hook para verificar se uma rota deve ser bloqueada por expiração
 * Útil para componentes que precisam verificar o status antes de renderizar
 */
export function useShouldBlockByExpiration(): boolean {
  const { isExpired, isSuspended, tenantStatus } = useTenantExpiration();
  
  return (isExpired || isSuspended) && tenantStatus !== null;
}

/**
 * Hook para obter informações de expiração para exibição
 * Retorna dados formatados para uso em componentes
 */
export function useExpirationInfo() {
  const { tenantStatus, isExpired, isSuspended, isExpiringSoon, daysUntilExpiry } = useTenantExpiration();

  if (!tenantStatus) {
    return {
      status: 'loading',
      message: 'Verificando status do plano...',
      isExpired: false,
      isSuspended: false,
      isExpiringSoon: false,
      daysUntilExpiry: 0,
      shouldShowWarning: false,
      shouldBlock: false,
    };
  }

  return {
    status: tenantStatus.status,
    message: tenantStatus.message,
    isExpired,
    isSuspended,
    isExpiringSoon,
    daysUntilExpiry,
    shouldShowWarning: isExpiringSoon && daysUntilExpiry <= 7,
    shouldBlock: isExpired || isSuspended,
    tenant: tenantStatus.tenant,
    membership: tenantStatus.membership,
  };
}
