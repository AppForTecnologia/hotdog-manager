import React from 'react';
import { useTenant, useAvailableTenants } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Componente para seleção de tenant
 * Permite ao usuário escolher entre os tenants disponíveis
 */
export function TenantSelector() {
  const { currentTenantId, setTenantId, isLoading, error } = useTenant();
  const availableTenants = useAvailableTenants();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Carregando Tenants...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Buscando seus tenants disponíveis...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableTenants.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Nenhum Tenant Disponível</CardTitle>
          <CardDescription>
            Você não possui acesso a nenhum tenant ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            Entre em contato com um administrador para obter acesso
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Selecionar Tenant</CardTitle>
        <CardDescription>
          Escolha o tenant que deseja acessar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableTenants.map(({ tenantId, tenantInfo, role }) => (
          <div
            key={tenantId}
            className={`p-4 border rounded-lg transition-all ${
              currentTenantId === tenantId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{tenantInfo.companyName}</h3>
              <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
                {role}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <div>CNPJ: {tenantInfo.cnpj}</div>
              <div>Plano: {tenantInfo.plan}</div>
              <div>Status: {tenantInfo.status}</div>
            </div>

            {currentTenantId === tenantId ? (
              <div className="text-center text-blue-600 font-medium">
                ✓ Tenant Atual
              </div>
            ) : (
              <Button
                onClick={() => setTenantId(tenantId)}
                className="w-full"
                variant="outline"
              >
                Selecionar
              </Button>
            )}
          </div>
        ))}
        
        {currentTenantId && (
          <div className="pt-3 border-t">
            <Button
              onClick={() => setTenantId(null)}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Limpar Seleção
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Componente compacto para mostrar o tenant atual
 */
export function CurrentTenantDisplay() {
  const { currentTenantId, tenantInfo, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Carregando tenant...
      </div>
    );
  }

  if (!currentTenantId || !tenantInfo) {
    return (
      <div className="text-sm text-gray-500">
        Nenhum tenant selecionado
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="font-medium">{tenantInfo.companyName}</div>
      <div className="text-gray-500">{tenantInfo.cnpj}</div>
    </div>
  );
}
