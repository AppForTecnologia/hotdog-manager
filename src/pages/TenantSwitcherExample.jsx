import React, { useState } from 'react';
import { useTenant, useAvailableTenants, useHasMultipleTenants } from '@/contexts/TenantContext';
import { TenantSwitcher, CurrentTenantDisplay } from '@/components/TenantSwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Users, Shield, Calendar, AlertCircle } from 'lucide-react';

/**
 * Página de exemplo mostrando o uso do TenantSwitcher
 * Demonstra todas as variantes e funcionalidades
 */
export default function TenantSwitcherExample() {
  const { currentTenantId, setTenantId, memberships, isLoading } = useTenant();
  const availableTenants = useAvailableTenants();
  const { hasMultipleTenants, tenantsCount } = useHasMultipleTenants();
  const [selectedVariant, setSelectedVariant] = useState('default');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Exemplo de TenantSwitcher</h1>
        <p className="text-white/70">Demonstração do componente de alternância de tenant</p>
      </div>

      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Status Atual
          </CardTitle>
          <CardDescription>Informações sobre o tenant atual e memberships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Carregando:</strong> {isLoading ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Tenant Atual:</strong> {currentTenantId || 'Nenhum'}
            </div>
            <div>
              <strong>Múltiplos Tenants:</strong> {hasMultipleTenants ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Total de Tenants:</strong> {tenantsCount}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variantes do TenantSwitcher */}
      <Card>
        <CardHeader>
          <CardTitle>Variantes do TenantSwitcher</CardTitle>
          <CardDescription>Diferentes estilos de exibição</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controles de Variante */}
          <div className="flex gap-2">
            <Button
              variant={selectedVariant === 'default' ? 'default' : 'outline'}
              onClick={() => setSelectedVariant('default')}
              size="sm"
            >
              Padrão
            </Button>
            <Button
              variant={selectedVariant === 'compact' ? 'default' : 'outline'}
              onClick={() => setSelectedVariant('compact')}
              size="sm"
            >
              Compacto
            </Button>
            <Button
              variant={selectedVariant === 'minimal' ? 'default' : 'outline'}
              onClick={() => setSelectedVariant('minimal')}
              size="sm"
            >
              Mínimo
            </Button>
          </div>

          {/* Exibição da Variante Selecionada */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Variante: {selectedVariant}</h4>
            <div className="flex items-center gap-4">
              <TenantSwitcher variant={selectedVariant} />
              <span className="text-sm text-gray-500">
                {selectedVariant === 'default' && 'Versão completa com informações detalhadas'}
                {selectedVariant === 'compact' && 'Versão compacta para espaços menores'}
                {selectedVariant === 'minimal' && 'Versão mínima apenas com ícone'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tenants Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants Disponíveis</CardTitle>
          <CardDescription>Lista de todos os tenants aos quais você tem acesso</CardDescription>
        </CardHeader>
        <CardContent>
          {availableTenants.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum tenant disponível
            </div>
          ) : (
            <div className="space-y-3">
              {availableTenants.map(({ tenantId, tenantInfo, role, membership }) => {
                const isCurrent = tenantId === currentTenantId;
                const isExpired = tenantInfo.expiresAt && tenantInfo.expiresAt < Date.now();
                const isNearExpiration = tenantInfo.expiresAt && 
                  (tenantInfo.expiresAt - Date.now()) / (1000 * 60 * 60 * 24) <= 7 && 
                  !isExpired;

                return (
                  <div
                    key={tenantId}
                    className={`p-4 border rounded-lg ${
                      isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {role === 'admin' && <Shield className="h-5 w-5 text-red-500" />}
                        {role === 'manager' && <Users className="h-5 w-5 text-blue-500" />}
                        {role === 'employee' && <Users className="h-5 w-5 text-green-500" />}
                        <h3 className="font-semibold">{tenantInfo.companyName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={role === 'admin' ? 'destructive' : 'secondary'}>
                          {role}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="default">Atual</Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        )}
                        {isNearExpiration && (
                          <Badge variant="outline" className="text-orange-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            Expira em breve
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <div>CNPJ: {tenantInfo.cnpj}</div>
                      <div>Plano: {tenantInfo.plan}</div>
                      <div>Status: {tenantInfo.status}</div>
                      {tenantInfo.expiresAt && (
                        <div>
                          Expira em: {new Date(tenantInfo.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Criado em: {new Date(membership.createdAt).toLocaleDateString()}
                      {membership.lastAccess && (
                        <span className="ml-4">
                          Último acesso: {new Date(membership.lastAccess).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <div className="mt-3">
                        <Button
                          onClick={() => setTenantId(tenantId)}
                          size="sm"
                          variant="outline"
                        >
                          Selecionar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exibição do Tenant Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Atual</CardTitle>
          <CardDescription>Componente para exibir apenas o tenant atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-gray-50">
            <CurrentTenantDisplay />
          </div>
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
              Limpar Seleção
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
            <strong>Estado Atual:</strong> {
              isLoading ? 'Carregando...' :
              !currentTenantId ? 'Nenhum tenant selecionado' :
              'Tenant selecionado'
            }
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Variantes */}
      <Card>
        <CardHeader>
          <CardTitle>Informações sobre Variantes</CardTitle>
          <CardDescription>Detalhes sobre cada variante do TenantSwitcher</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Variante Padrão (default)</h4>
              <p className="text-sm text-gray-600 mb-2">
                Exibe o nome da empresa, CNPJ e permite alternância completa com dropdown detalhado.
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside">
                <li>Nome da empresa e CNPJ visíveis</li>
                <li>Dropdown com informações completas</li>
                <li>Indicadores de expiração e status</li>
                <li>Opção para limpar seleção</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Variante Compacta (compact)</h4>
              <p className="text-sm text-gray-600 mb-2">
                Versão mais compacta para espaços menores, ideal para headers.
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside">
                <li>Botão menor com nome da empresa</li>
                <li>Dropdown com informações essenciais</li>
                <li>Indicadores de role e status</li>
                <li>Ideal para barras de navegação</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Variante Mínima (minimal)</h4>
              <p className="text-sm text-gray-600 mb-2">
                Apenas um ícone clicável, ideal para sidebars ou espaços muito pequenos.
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside">
                <li>Apenas ícone de edifício</li>
                <li>Dropdown completo ao clicar</li>
                <li>Mínimo espaço ocupado</li>
                <li>Ideal para sidebars</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
