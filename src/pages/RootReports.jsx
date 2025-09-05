import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRootUserInfo } from '@/components/RootGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Página de relatórios do painel root
 * Exibe estatísticas detalhadas e relatórios do sistema
 */
export default function RootReports() {
  const { isRootAdmin } = useRootUserInfo();
  const [dateRange, setDateRange] = useState('30'); // últimos 30 dias

  // Queries
  const tenantStats = useQuery(api.tenants.getTenantStats);
  const tenants = useQuery(api.tenants.listTenants, { status: undefined });

  if (!isRootAdmin) {
    return null;
  }

  // Calcular estatísticas adicionais
  const totalTenants = tenants?.length || 0;
  const activeTenants = tenants?.filter(t => t.status === 'active').length || 0;
  const suspendedTenants = tenants?.filter(t => t.status === 'suspended').length || 0;
  const expiringSoon = tenants?.filter(t => {
    const now = new Date();
    const expires = new Date(t.expiresAt);
    const diffDays = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  }).length || 0;

  // Estatísticas por plano
  const planStats = tenants?.reduce((acc, tenant) => {
    acc[tenant.plan] = (acc[tenant.plan] || 0) + 1;
    return acc;
  }, {}) || {};

  // Tenants mais antigos
  const oldestTenants = tenants?.sort((a, b) => a.createdAt - b.createdAt).slice(0, 5) || [];

  // Tenants que nunca acessaram
  const neverAccessed = tenants?.filter(t => !t.lastAccess).length || 0;

  // Tenants com mais acessos
  const mostAccessed = tenants?.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0)).slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relatórios do Sistema</h1>
          <p className="text-gray-600 mt-2">Estatísticas detalhadas e análises do sistema</p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros de Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="365">Último ano</option>
                </select>
              </div>
              <div className="flex-1" />
              <Button>📊 Exportar Relatório</Button>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <div className="text-2xl">🏢</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                Empresas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
              <div className="text-2xl">📈</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {activeTenants} de {totalTenants} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nunca Acessaram</CardTitle>
              <div className="text-2xl">🚫</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{neverAccessed}</div>
              <p className="text-xs text-muted-foreground">
                Tenants inativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirando em 7 dias</CardTitle>
              <div className="text-2xl">⚠️</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoon}</div>
              <p className="text-xs text-muted-foreground">
                Precisam de renovação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição por Plano */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(planStats).map(([plan, count]) => (
                <div key={plan} className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{plan}</div>
                  <div className="text-xs text-gray-500">
                    {totalTenants > 0 ? Math.round((count / totalTenants) * 100) : 0}% do total
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenants Mais Antigos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tenants Mais Antigos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {oldestTenants.map((tenant, index) => (
                <div key={tenant._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <h3 className="font-semibold">{tenant.companyName}</h3>
                      <p className="text-sm text-gray-600">
                        Criado em {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                      className={
                        tenant.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {tenant.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {tenant.plan} • {tenant.days} dias
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tenants com Mais Acessos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tenants com Mais Acessos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mostAccessed.map((tenant, index) => (
                <div key={tenant._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-blue-600">#{index + 1}</div>
                    <div>
                      <h3 className="font-semibold">{tenant.companyName}</h3>
                      <p className="text-sm text-gray-600">
                        Último acesso: {tenant.lastAccess ? new Date(tenant.lastAccess).toLocaleDateString('pt-BR') : 'Nunca'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{tenant.accessCount || 0}</div>
                    <p className="text-sm text-gray-500">acessos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status dos Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ativos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${totalTenants > 0 ? (activeTenants / totalTenants) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{activeTenants}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Suspensos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full" 
                        style={{ width: `${totalTenants > 0 ? (suspendedTenants / totalTenants) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{suspendedTenants}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nunca Acessaram</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${totalTenants > 0 ? (neverAccessed / totalTenants) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{neverAccessed}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Recomendadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringSoon > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">⚠️</span>
                      <span className="text-sm font-medium text-orange-800">
                        {expiringSoon} tenant(s) expirando em 7 dias
                      </span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">
                      Considere entrar em contato para renovação
                    </p>
                  </div>
                )}
                {neverAccessed > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">🚫</span>
                      <span className="text-sm font-medium text-red-800">
                        {neverAccessed} tenant(s) nunca acessaram
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      Considere verificar se os dados estão corretos
                    </p>
                  </div>
                )}
                {suspendedTenants > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600">⏸️</span>
                      <span className="text-sm font-medium text-yellow-800">
                        {suspendedTenants} tenant(s) suspensos
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Verifique se há necessidade de reativação
                    </p>
                  </div>
                )}
                {expiringSoon === 0 && neverAccessed === 0 && suspendedTenants === 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-green-800">
                        Sistema funcionando normalmente
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Todos os tenants estão ativos e atualizados
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
