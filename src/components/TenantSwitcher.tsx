import React, { useState } from 'react';
import { useTenant, useAvailableTenants } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Users, 
  Calendar,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';

/**
 * Props para o TenantSwitcher
 */
interface TenantSwitcherProps {
  variant?: 'default' | 'compact' | 'minimal';
  showCurrentTenant?: boolean;
  className?: string;
}

/**
 * Componente para alternar entre tenants
 * Permite que usuários com múltiplos CNPJs alternem facilmente
 */
export function TenantSwitcher({ 
  variant = 'default', 
  showCurrentTenant = true,
  className = '' 
}: TenantSwitcherProps) {
  const { currentTenantId, setTenantId, isLoading } = useTenant();
  const availableTenants = useAvailableTenants();
  const [isOpen, setIsOpen] = useState(false);

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  // Se não há tenants disponíveis, não mostrar nada
  if (availableTenants.length === 0) {
    return null;
  }

  // Se há apenas um tenant, mostrar apenas o nome
  if (availableTenants.length === 1) {
    const tenant = availableTenants[0];
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Building2 className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">{tenant.tenantInfo.companyName}</span>
        <Badge variant="secondary" className="text-xs">
          {tenant.role}
        </Badge>
      </div>
    );
  }

  // Encontrar tenant atual
  const currentTenant = availableTenants.find(t => t.tenantId === currentTenantId);

  /**
   * Alternar para um tenant específico
   */
  const handleTenantSwitch = (tenantId: string) => {
    setTenantId(tenantId);
    setIsOpen(false);
  };

  /**
   * Obter ícone baseado na role
   */
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'manager':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'employee':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  /**
   * Obter cor do badge baseado na role
   */
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'manager':
        return 'default' as const;
      case 'employee':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  /**
   * Verificar se o tenant está próximo do vencimento
   */
  const isNearExpiration = (tenantInfo: any) => {
    if (!tenantInfo.expiresAt) return false;
    const now = Date.now();
    const expirationDate = tenantInfo.expiresAt;
    const daysUntilExpiration = (expirationDate - now) / (1000 * 60 * 60 * 24);
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  };

  /**
   * Verificar se o tenant está expirado
   */
  const isExpired = (tenantInfo: any) => {
    if (!tenantInfo.expiresAt) return false;
    return tenantInfo.expiresAt < Date.now();
  };

  /**
   * Renderizar variante compacta
   */
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Building2 className="h-4 w-4 mr-2" />
            {currentTenant ? currentTenant.tenantInfo.companyName : 'Selecionar'}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Alternar Tenant</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableTenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.tenantId}
              onClick={() => handleTenantSwitch(tenant.tenantId)}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                {getRoleIcon(tenant.role)}
                <div>
                  <div className="font-medium">{tenant.tenantInfo.companyName}</div>
                  <div className="text-xs text-gray-500">{tenant.tenantInfo.cnpj}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(tenant.role)} className="text-xs">
                  {tenant.role}
                </Badge>
                {tenant.tenantId === currentTenantId && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /**
   * Renderizar variante mínima
   */
  if (variant === 'minimal') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Building2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Alternar Tenant</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableTenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.tenantId}
              onClick={() => handleTenantSwitch(tenant.tenantId)}
              className="flex items-center justify-between p-3"
            >
              <div className="flex items-center gap-3">
                {getRoleIcon(tenant.role)}
                <div>
                  <div className="font-medium">{tenant.tenantInfo.companyName}</div>
                  <div className="text-xs text-gray-500">{tenant.tenantInfo.cnpj}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(tenant.role)} className="text-xs">
                  {tenant.role}
                </Badge>
                {tenant.tenantId === currentTenantId && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  /**
   * Renderizar variante padrão
   */
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-10 min-w-0">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-gray-600" />
              <div className="text-left min-w-0">
                {currentTenant ? (
                  <div>
                    <div className="font-medium truncate max-w-32">
                      {currentTenant.tenantInfo.companyName}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-32">
                      {currentTenant.tenantInfo.cnpj}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Selecionar Tenant</div>
                )}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Alternar Tenant</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {availableTenants.map((tenant) => {
            const isCurrent = tenant.tenantId === currentTenantId;
            const nearExpiration = isNearExpiration(tenant.tenantInfo);
            const expired = isExpired(tenant.tenantInfo);
            
            return (
              <DropdownMenuItem
                key={tenant.tenantId}
                onClick={() => handleTenantSwitch(tenant.tenantId)}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3">
                  {getRoleIcon(tenant.role)}
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {tenant.tenantInfo.companyName}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {tenant.tenantInfo.cnpj}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(tenant.role)} className="text-xs">
                        {tenant.role}
                      </Badge>
                      {expired && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expirado
                        </Badge>
                      )}
                      {nearExpiration && !expired && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          Expira em breve
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setTenantId(null);
              setIsOpen(false);
            }}
            className="text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Limpar Seleção
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Componente compacto para mostrar apenas o tenant atual
 */
export function CurrentTenantDisplay() {
  const { currentTenantId, tenantInfo, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  if (!currentTenantId || !tenantInfo) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Nenhum tenant selecionado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-600" />
      <div>
        <div className="text-sm font-medium">{tenantInfo.companyName}</div>
        <div className="text-xs text-gray-500">{tenantInfo.cnpj}</div>
      </div>
    </div>
  );
}

/**
 * Hook para verificar se o usuário tem múltiplos tenants
 */
export function useHasMultipleTenants() {
  const { memberships, isLoading } = useTenant();
  
  return {
    hasMultipleTenants: !isLoading && memberships.length > 1,
    isLoading,
    tenantsCount: memberships.length,
  };
}
