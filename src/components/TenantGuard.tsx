import React from 'react';
import { useTenant, useTenantAccess } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TenantSelector } from './TenantSelector';

/**
 * Props para o TenantGuard
 */
interface TenantGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'employee';
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rotas baseadas no tenant
 * Verifica se o usuário tem acesso ao tenant atual
 * 
 * @param children - Componentes filhos a serem renderizados se tiver acesso
 * @param requiredRole - Role mínima necessária (opcional)
 * @param fallback - Componente a ser renderizado se não tiver acesso
 */
export function TenantGuard({ 
  children, 
  requiredRole, 
  fallback 
}: TenantGuardProps) {
  const { currentTenantId, isLoading, error } = useTenant();
  const { hasAccess, role, isAdmin, isManager, isEmployee } = useTenantAccess();

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">
              Verificando acesso ao tenant...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-500">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há tenant selecionado, mostrar seletor
  if (!currentTenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <TenantSelector />
      </div>
    );
  }

  // Se não tem acesso ao tenant atual
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Você não possui acesso ao tenant atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-gray-500">
                Entre em contato com um administrador para obter acesso
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar role se especificada
  if (requiredRole) {
    let hasRequiredRole = false;
    
    switch (requiredRole) {
      case 'admin':
        hasRequiredRole = isAdmin;
        break;
      case 'manager':
        hasRequiredRole = isAdmin || isManager;
        break;
      case 'employee':
        hasRequiredRole = isAdmin || isManager || isEmployee;
        break;
    }

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Permissão Insuficiente</CardTitle>
              <CardDescription>
                Você precisa da role '{requiredRole}' ou superior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-gray-500">
                  Sua role atual: <span className="font-medium">{role}</span>
                </div>
                <div className="text-gray-500">
                  Role necessária: <span className="font-medium">{requiredRole}</span>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Recarregar Página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Renderizar componente customizado se fornecido
  if (fallback) {
    return <>{fallback}</>;
  }

  // Renderizar children se tudo estiver ok
  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário pode acessar uma funcionalidade
 * 
 * @param requiredRole - Role mínima necessária
 * @returns Objeto com informações de acesso
 */
export function useCanAccess(requiredRole?: 'admin' | 'manager' | 'employee') {
  const { currentTenantId } = useTenant();
  const { hasAccess, role, isAdmin, isManager, isEmployee } = useTenantAccess();

  if (!currentTenantId || !hasAccess) {
    return {
      canAccess: false,
      reason: 'No tenant selected or no access',
      role: null,
    };
  }

  if (!requiredRole) {
    return {
      canAccess: true,
      reason: 'No role required',
      role,
    };
  }

  let canAccess = false;
  switch (requiredRole) {
    case 'admin':
      canAccess = isAdmin;
      break;
    case 'manager':
      canAccess = isAdmin || isManager;
      break;
    case 'employee':
      canAccess = isAdmin || isManager || isEmployee;
      break;
  }

  return {
    canAccess,
    reason: canAccess ? 'Access granted' : `Requires ${requiredRole} role`,
    role,
  };
}
