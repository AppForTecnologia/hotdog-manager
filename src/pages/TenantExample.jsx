import React from 'react';
import { useTenant, useTenantAccess, useCurrentTenant, useAvailableTenants } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TenantSelector } from '@/components/TenantSelector';

/**
 * Página de exemplo mostrando como usar o TenantContext
 * Demonstra todas as funcionalidades disponíveis
 */
export default function TenantExample() {
  const { currentTenantId, setTenantId, memberships, isLoading, error } = useTenant();
  const { hasAccess, role, isAdmin, isManager, isEmployee } = useTenantAccess();
  const { tenantInfo, isLoaded } = useCurrentTenant();
  const availableTenants = useAvailableTenants();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Exemplo de TenantContext</h1>
        <p className="text-white/70">Demonstração das funcionalidades do contexto de tenant</p>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Status Geral</CardTitle>
          <CardDescription>Informações sobre o estado atual do contexto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Carregando:</strong> {isLoading ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Erro:</strong> {error || 'Nenhum'}
            </div>
            <div>
              <strong>Tenant Atual:</strong> {currentTenantId || 'Nenhum'}
            </div>
            <div>
              <strong>Tem Acesso:</strong> {hasAccess ? 'Sim' : 'Não'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Tenant Atual */}
      {tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Atual</CardTitle>
            <CardDescription>Informações do tenant selecionado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Nome:</strong> {tenantInfo.companyName}
              </div>
              <div>
                <strong>CNPJ:</strong> {tenantInfo.cnpj}
              </div>
              <div>
                <strong>Email:</strong> {tenantInfo.email}
              </div>
              <div>
                <strong>Plano:</strong> {tenantInfo.plan}
              </div>
              <div>
                <strong>Status:</strong> 
                <Badge variant={tenantInfo.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                  {tenantInfo.status}
                </Badge>
              </div>
              <div>
                <strong>Expirado:</strong> {tenantInfo.isExpired ? 'Sim' : 'Não'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações de Acesso */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Acesso</CardTitle>
          <CardDescription>Permissões do usuário no tenant atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Role:</strong> {role || 'Nenhuma'}
            </div>
            <div>
              <strong>É Admin:</strong> {isAdmin ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>É Manager:</strong> {isManager ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>É Employee:</strong> {isEmployee ? 'Sim' : 'Não'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Memberships */}
      <Card>
        <CardHeader>
          <CardTitle>Memberships</CardTitle>
          <CardDescription>Todos os tenants aos quais você tem acesso</CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center text-gray-500">
              Nenhum membership encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {memberships.map((membership) => (
                <div
                  key={membership._id}
                  className={`p-4 border rounded-lg ${
                    membership.tenantId === currentTenantId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      {membership.tenant?.companyName || 'Tenant não encontrado'}
                    </h3>
                    <div className="flex gap-2">
                      <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'}>
                        {membership.role}
                      </Badge>
                      <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                        {membership.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {membership.tenant && (
                    <div className="text-sm text-gray-600 mb-2">
                      <div>CNPJ: {membership.tenant.cnpj}</div>
                      <div>Plano: {membership.tenant.plan}</div>
                      <div>Status: {membership.tenant.status}</div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Criado em: {new Date(membership.createdAt).toLocaleDateString()}
                    {membership.lastAccess && (
                      <span className="ml-4">
                        Último acesso: {new Date(membership.lastAccess).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seletor de Tenant */}
      <Card>
        <CardHeader>
          <CardTitle>Seletor de Tenant</CardTitle>
          <CardDescription>Componente para seleção de tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <TenantSelector />
        </CardContent>
      </Card>

      {/* Controles de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Teste</CardTitle>
          <CardDescription>Botões para testar funcionalidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => setTenantId(null)}
              variant="outline"
            >
              Limpar Tenant
            </Button>
            
            {availableTenants.length > 0 && (
              <Button
                onClick={() => setTenantId(availableTenants[0].tenantId)}
                variant="outline"
              >
                Selecionar Primeiro Tenant
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <strong>Tenants Disponíveis:</strong> {availableTenants.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
