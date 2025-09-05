import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRootUserInfo } from '@/components/RootGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTenantConvex, useConvexConnectionStatus, useProvisioningFeatureFlags } from '@/hooks/useTenantConvex';

/**
 * Página de gerenciamento de provisionamento físico
 * Permite gerenciar projetos Convex individuais por tenant
 */
export default function RootProvisioning() {
  const { isRootAdmin } = useRootUserInfo();
  const [selectedTenant, setSelectedTenant] = useState('');
  const [provisioningResult, setProvisioningResult] = useState(null);
  const [isRunningProvisioning, setIsRunningProvisioning] = useState(false);
  const [showProvisioningDialog, setShowProvisioningDialog] = useState(false);
  const [showFeatureFlagsDialog, setShowFeatureFlagsDialog] = useState(false);

  // Hooks para gerenciamento de Convex dinâmico
  const {
    currentTenantConfig,
    isConnected,
    connectionError,
    switchToTenant,
    hasTenantOwnProject,
    isPhysicalProvisioningEnabled
  } = useTenantConvex();

  const {
    isConnected: convexConnected,
    connectionError: convexError,
    getConnectionStats
  } = useConvexConnectionStatus();

  const {
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    toggleFeature,
    getAllFlags
  } = useProvisioningFeatureFlags();

  // Queries
  const tenants = useQuery(api.tenants.listTenants);
  const provisioningStatus = useQuery(api.admin.migrateTenantId.getProvisioningStatus);

  if (!isRootAdmin) {
    return null;
  }

  // Função para executar provisionamento
  const handleProvisioning = async (tenantId, cnpj, companyName, plan) => {
    if (!tenantId || !cnpj || !companyName) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setIsRunningProvisioning(true);
    setProvisioningResult(null);

    try {
      // TODO: Implementar provisionamento real
      // Por enquanto, simular provisionamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult = {
        success: true,
        tenantId,
        convexProjectId: `proj_${tenantId}_${Date.now()}`,
        convexUrl: `https://hotdog-tenant-${tenantId}.convex.cloud`,
        convexKey: `key_${tenantId}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

      setProvisioningResult(mockResult);
      
      // Trocar para o tenant provisionado
      await switchToTenant(
        tenantId,
        cnpj,
        companyName,
        mockResult.convexUrl,
        mockResult.convexKey,
        mockResult.convexProjectId,
        'provisioned'
      );

    } catch (error) {
      setProvisioningResult({
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
    } finally {
      setIsRunningProvisioning(false);
    }
  };

  // Função para formatar timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // Estatísticas de conexão
  const connectionStats = getConnectionStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Provisionamento Físico</h1>
          <p className="text-gray-600 mt-2">Gerencie projetos Convex individuais por tenant</p>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Convex</CardTitle>
              <div className="text-2xl">🔗</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={convexConnected ? 'text-green-600' : 'text-red-600'}>
                  {convexConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {convexError || 'Conexão estável'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Provisionamento</CardTitle>
              <div className="text-2xl">🚀</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span className={isPhysicalProvisioningEnabled ? 'text-green-600' : 'text-orange-600'}>
                  {isPhysicalProvisioningEnabled ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Feature flag ativa
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants</CardTitle>
              <div className="text-2xl">🏢</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {tenants?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para provisionamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <div className="text-2xl">📈</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {connectionStats.uptime.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Última hora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Flags */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🔧</span>
                Feature Flags
              </span>
              <Button
                onClick={() => setShowFeatureFlagsDialog(true)}
                variant="outline"
                size="sm"
              >
                Gerenciar Flags
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Provisionamento Físico</h4>
                  <p className="text-sm text-gray-600">Habilita projetos Convex individuais</p>
                </div>
                <Badge 
                  variant={isPhysicalProvisioningEnabled ? 'default' : 'secondary'}
                  className={isPhysicalProvisioningEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {isPhysicalProvisioningEnabled ? 'Habilitado' : 'Desabilitado'}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Clientes Dinâmicos</h4>
                  <p className="text-sm text-gray-600">Troca automática de clientes Convex</p>
                </div>
                <Badge 
                  variant={isFeatureEnabled('dynamicClients') ? 'default' : 'secondary'}
                  className={isFeatureEnabled('dynamicClients') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {isFeatureEnabled('dynamicClients') ? 'Habilitado' : 'Desabilitado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status do Tenant Atual */}
        {currentTenantConfig && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏢</span>
                Tenant Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Empresa</Label>
                    <p className="text-lg font-semibold">{currentTenantConfig.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">CNPJ</Label>
                    <p className="text-lg font-semibold">{currentTenantConfig.cnpj}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status de Provisionamento</Label>
                    <Badge 
                      variant={currentTenantConfig.provisioningStatus === 'provisioned' ? 'default' : 'secondary'}
                      className={currentTenantConfig.provisioningStatus === 'provisioned' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {currentTenantConfig.provisioningStatus}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Projeto Próprio</Label>
                    <Badge 
                      variant={hasTenantOwnProject() ? 'default' : 'secondary'}
                      className={hasTenantOwnProject() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {hasTenantOwnProject() ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>

                {currentTenantConfig.convexUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">URL do Convex</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {currentTenantConfig.convexUrl}
                    </p>
                  </div>
                )}

                {currentTenantConfig.convexProjectId && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">ID do Projeto</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {currentTenantConfig.convexProjectId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provisionamento de Tenant */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🚀</span>
              Provisionar Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tenant-select">Selecionar Tenant</Label>
                <select
                  id="tenant-select"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um tenant</option>
                  {tenants?.map(tenant => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.companyName} ({tenant.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTenant && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Informações do Tenant</h4>
                  {(() => {
                    const tenant = tenants?.find(t => t._id === selectedTenant);
                    if (!tenant) return null;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Empresa:</span> {tenant.companyName}
                        </div>
                        <div>
                          <span className="font-medium">CNPJ:</span> {tenant.cnpj}
                        </div>
                        <div>
                          <span className="font-medium">Plano:</span> {tenant.plan}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> {tenant.status}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const tenant = tenants?.find(t => t._id === selectedTenant);
                    if (tenant) {
                      handleProvisioning(
                        tenant._id,
                        tenant.cnpj,
                        tenant.companyName,
                        tenant.plan
                      );
                    }
                  }}
                  disabled={!selectedTenant || isRunningProvisioning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isRunningProvisioning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Provisionando...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      Provisionar Tenant
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado do Provisionamento */}
        {provisioningResult && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={provisioningResult.success ? 'text-green-600' : 'text-red-600'}>
                  {provisioningResult.success ? '✅' : '❌'}
                </span>
                Resultado do Provisionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border ${
                provisioningResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="space-y-3">
                  <div>
                    <strong>Status:</strong> {provisioningResult.success ? 'Sucesso' : 'Erro'}
                  </div>
                  <div>
                    <strong>Tenant ID:</strong> {provisioningResult.tenantId}
                  </div>
                  {provisioningResult.success && (
                    <>
                      <div>
                        <strong>Projeto Convex:</strong> {provisioningResult.convexProjectId}
                      </div>
                      <div>
                        <strong>URL:</strong> {provisioningResult.convexUrl}
                      </div>
                      <div>
                        <strong>Chave:</strong> {provisioningResult.convexKey?.substring(0, 20)}...
                      </div>
                    </>
                  )}
                  {provisioningResult.error && (
                    <div>
                      <strong>Erro:</strong> {provisioningResult.error}
                    </div>
                  )}
                  <div>
                    <strong>Executado em:</strong> {formatTimestamp(provisioningResult.timestamp)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas de Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Estatísticas de Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connectionStats.totalEvents}</div>
                <div className="text-sm text-gray-600">Eventos Totais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{connectionStats.connectedEvents}</div>
                <div className="text-sm text-gray-600">Conexões</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{connectionStats.errorEvents}</div>
                <div className="text-sm text-gray-600">Erros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{connectionStats.disconnectedEvents}</div>
                <div className="text-sm text-gray-600">Desconexões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Feature Flags */}
        <Dialog open={showFeatureFlagsDialog} onOpenChange={setShowFeatureFlagsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Feature Flags</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Object.entries(getAllFlags()).map(([flag, enabled]) => (
                <div key={flag} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{flag.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <p className="text-sm text-gray-600">Feature flag para {flag}</p>
                  </div>
                  <Button
                    onClick={() => toggleFeature(flag)}
                    variant={enabled ? 'default' : 'outline'}
                    size="sm"
                  >
                    {enabled ? 'Desabilitar' : 'Habilitar'}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
