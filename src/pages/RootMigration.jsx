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

/**
 * Página de migração de dados legados
 * Permite analisar, migrar e exportar dados que não possuem tenantId
 */
export default function RootMigration() {
  const { isRootAdmin } = useRootUserInfo();
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [migrationResult, setMigrationResult] = useState(null);
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // Queries
  const legacyAnalysis = useQuery(api.admin.migrateTenantId.analyzeLegacyData);
  const availableTenants = useQuery(api.admin.migrateTenantId.getAvailableTenants);
  const migrationStatus = useQuery(api.admin.migrateTenantId.getMigrationStatus);

  // Mutations
  const migrateLegacyData = useMutation(api.admin.migrateTenantId.migrateLegacyData);
  const exportLegacyData = useMutation(api.admin.migrateTenantId.exportLegacyDataToCSV);

  if (!isRootAdmin) {
    return null;
  }

  // Lista de coleções disponíveis para migração
  const availableCollections = [
    { key: 'categories', name: 'Categorias', description: 'Categorias de produtos' },
    { key: 'products', name: 'Produtos', description: 'Produtos cadastrados' },
    { key: 'sales', name: 'Vendas', description: 'Vendas realizadas' },
    { key: 'saleItems', name: 'Itens de Venda', description: 'Itens individuais das vendas' },
    { key: 'cashRegister', name: 'Fechamento de Caixa', description: 'Registros de fechamento' },
    { key: 'paymentMethods', name: 'Métodos de Pagamento', description: 'Formas de pagamento' },
    { key: 'productionItems', name: 'Itens de Produção', description: 'Controle de produção' },
    { key: 'productGroups', name: 'Grupos de Produtos', description: 'Agrupamentos de produtos' },
    { key: 'saleGroups', name: 'Grupos de Vendas', description: 'Agrupamentos de vendas' },
    { key: 'customers', name: 'Clientes', description: 'Clientes cadastrados' },
  ];

  // Função para executar migração
  const handleMigration = async (dryRun = false) => {
    if (!selectedTenant || selectedCollections.length === 0) {
      alert('Selecione um tenant e pelo menos uma coleção');
      return;
    }

    setIsRunningMigration(true);
    setMigrationResult(null);

    try {
      const result = await migrateLegacyData({
        targetTenantId: selectedTenant,
        collections: selectedCollections,
        dryRun,
      });

      setMigrationResult(result);
    } catch (error) {
      setMigrationResult({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    } finally {
      setIsRunningMigration(false);
    }
  };

  // Função para exportar dados
  const handleExport = async () => {
    if (selectedCollections.length === 0) {
      alert('Selecione pelo menos uma coleção para exportar');
      return;
    }

    setExportResult(null);

    try {
      const result = await exportLegacyData({
        collections: selectedCollections,
        includeHeaders: true,
      });

      setExportResult(result);
    } catch (error) {
      setExportResult({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
    }
  };

  // Função para baixar CSV
  const downloadCSV = (collectionName, csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${collectionName}_legacy_data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para formatar timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Migração de Dados Legados</h1>
          <p className="text-gray-600 mt-2">Migre dados antigos para o novo modelo multi-tenant</p>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <div className="text-2xl">📊</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {legacyAnalysis?.totalRecords || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Registros no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sem TenantId</CardTitle>
              <div className="text-2xl">⚠️</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {legacyAnalysis?.recordsWithoutTenantId || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Precisam de migração
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <div className="text-2xl">📈</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {migrationStatus?.overallProgress || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Migração concluída
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Disponíveis</CardTitle>
              <div className="text-2xl">🏢</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {availableTenants?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Para migração
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Análise Detalhada */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔍</span>
              Análise de Dados Legados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {legacyAnalysis ? (
              <div className="space-y-4">
                {Object.entries(legacyAnalysis.collections).map(([collectionName, data]) => (
                  <div key={collectionName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg capitalize">{collectionName}</h3>
                      <Badge 
                        variant={data.withoutTenantId > 0 ? 'destructive' : 'default'}
                        className={data.withoutTenantId > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}
                      >
                        {data.withoutTenantId > 0 ? 'Precisa Migração' : 'Migrado'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium ml-2">{data.total}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sem TenantId:</span>
                        <span className="font-medium ml-2 text-orange-600">{data.withoutTenantId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Com TenantId:</span>
                        <span className="font-medium ml-2 text-green-600">{data.withTenantId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Progresso:</span>
                        <span className="font-medium ml-2">{data.percentage}%</span>
                      </div>
                    </div>
                    {data.sampleRecords && data.sampleRecords.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Registros de Exemplo:</h4>
                        <div className="space-y-1">
                          {data.sampleRecords.map((record, index) => (
                            <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>ID:</strong> {record._id} | <strong>Nome:</strong> {record.name} | 
                              <strong> Criado:</strong> {formatTimestamp(record.createdAt)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando análise...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações de Migração */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Migração Automática */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🚀</span>
                Migração Automática
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tenant-select">Tenant de Destino</Label>
                  <select
                    id="tenant-select"
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um tenant</option>
                    {availableTenants?.map(tenant => (
                      <option key={tenant._id} value={tenant._id}>
                        {tenant.companyName} ({tenant.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Coleções para Migrar</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {availableCollections.map(collection => (
                      <label key={collection.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollections([...selectedCollections, collection.key]);
                            } else {
                              setSelectedCollections(selectedCollections.filter(c => c !== collection.key));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">
                          <strong>{collection.name}</strong> - {collection.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleMigration(true)}
                    disabled={!selectedTenant || selectedCollections.length === 0 || isRunningMigration}
                    variant="outline"
                    className="flex-1"
                  >
                    🧪 Teste (Dry Run)
                  </Button>
                  <Button
                    onClick={() => handleMigration(false)}
                    disabled={!selectedTenant || selectedCollections.length === 0 || isRunningMigration}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isRunningMigration ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Migrando...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">🚀</span>
                        Migrar Dados
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exportação CSV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📄</span>
                Exportação CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Coleções para Exportar</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {availableCollections.map(collection => (
                      <label key={collection.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(collection.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollections([...selectedCollections, collection.key]);
                            } else {
                              setSelectedCollections(selectedCollections.filter(c => c !== collection.key));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">
                          <strong>{collection.name}</strong> - {collection.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleExport}
                  disabled={selectedCollections.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <span className="mr-2">📄</span>
                  Exportar para CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultado da Migração */}
        {migrationResult && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={migrationResult.success ? 'text-green-600' : 'text-red-600'}>
                  {migrationResult.success ? '✅' : '❌'}
                </span>
                Resultado da Migração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border ${
                migrationResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="space-y-3">
                  <div>
                    <strong>Status:</strong> {migrationResult.success ? 'Sucesso' : 'Erro'}
                  </div>
                  <div>
                    <strong>Tenant de Destino:</strong> {migrationResult.targetTenant?.companyName}
                  </div>
                  <div>
                    <strong>Modo:</strong> {migrationResult.dryRun ? 'Teste (Dry Run)' : 'Migração Real'}
                  </div>
                  <div>
                    <strong>Total Processado:</strong> {migrationResult.totalProcessed}
                  </div>
                  <div>
                    <strong>Total Atualizado:</strong> {migrationResult.totalUpdated}
                  </div>
                  <div>
                    <strong>Executado em:</strong> {formatTimestamp(migrationResult.timestamp)}
                  </div>

                  {migrationResult.collections && (
                    <div>
                      <strong>Detalhes por Coleção:</strong>
                      <div className="mt-2 space-y-2">
                        {Object.entries(migrationResult.collections).map(([collection, data]) => (
                          <div key={collection} className="text-sm bg-white p-2 rounded border">
                            <strong>{collection}:</strong> {data.total} encontrados, {data.updated} atualizados
                            {data.errors > 0 && <span className="text-red-600">, {data.errors} erros</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {migrationResult.errors && migrationResult.errors.length > 0 && (
                    <div>
                      <strong>Erros:</strong>
                      <div className="mt-2 space-y-1">
                        {migrationResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado da Exportação */}
        {exportResult && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={exportResult.success ? 'text-green-600' : 'text-red-600'}>
                  {exportResult.success ? '✅' : '❌'}
                </span>
                Resultado da Exportação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border ${
                exportResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="space-y-3">
                  <div>
                    <strong>Status:</strong> {exportResult.success ? 'Sucesso' : 'Erro'}
                  </div>
                  <div>
                    <strong>Executado em:</strong> {formatTimestamp(exportResult.timestamp)}
                  </div>

                  {exportResult.files && (
                    <div>
                      <strong>Arquivos Gerados:</strong>
                      <div className="mt-2 space-y-2">
                        {Object.entries(exportResult.files).map(([collection, content]) => (
                          <div key={collection} className="flex items-center justify-between bg-white p-2 rounded border">
                            <span className="text-sm">
                              <strong>{collection}.csv</strong> - {content.length} caracteres
                            </span>
                            <Button
                              size="sm"
                              onClick={() => downloadCSV(collection, content)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              📥 Baixar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {exportResult.errors && exportResult.errors.length > 0 && (
                    <div>
                      <strong>Erros:</strong>
                      <div className="mt-2 space-y-1">
                        {exportResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 bg-red-100 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status da Migração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Status da Migração
            </CardTitle>
          </CardHeader>
          <CardContent>
            {migrationStatus ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{migrationStatus.totalRecords}</div>
                    <div className="text-sm text-gray-600">Total de Registros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{migrationStatus.migratedRecords}</div>
                    <div className="text-sm text-gray-600">Migrados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{migrationStatus.remainingRecords}</div>
                    <div className="text-sm text-gray-600">Restantes</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(migrationStatus.collections).map(([collectionName, data]) => (
                    <div key={collectionName} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{collectionName}</h4>
                        <Badge 
                          variant={data.progress === 100 ? 'default' : 'secondary'}
                          className={data.progress === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                        >
                          {data.progress}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium ml-2">{data.total}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Migrados:</span>
                          <span className="font-medium ml-2 text-green-600">{data.migrated}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Restantes:</span>
                          <span className="font-medium ml-2 text-orange-600">{data.remaining}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando status...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
