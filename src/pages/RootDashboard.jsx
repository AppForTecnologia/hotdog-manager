import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRootUserInfo } from '@/components/RootGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Dashboard principal do painel administrativo root
 * Exibe estatísticas gerais dos tenants
 */
export default function RootDashboard() {
  const { userEmail, isRootAdmin } = useRootUserInfo();

  // Buscar estatísticas dos tenants
  const tenantStats = useQuery(api.tenants.getTenantStats);

  // Buscar lista de tenants
  const tenants = useQuery(api.tenants.listTenants, { status: undefined });

  if (!isRootAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo Root</h1>
          <p className="text-gray-600 mt-2">
            Bem-vindo, <span className="font-semibold">{userEmail}</span>
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
              <div className="text-2xl">🏢</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantStats?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Empresas cadastradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
              <div className="text-2xl">✅</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {tenantStats?.active || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Empresas ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Suspensos</CardTitle>
              <div className="text-2xl">⏸️</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {tenantStats?.suspended || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Empresas suspensas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirando em 7 dias</CardTitle>
              <div className="text-2xl">⚠️</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {tenantStats?.expiringSoon || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Precisam de renovação
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Tenants Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Tenants Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {tenants && tenants.length > 0 ? (
              <div className="space-y-4">
                {tenants.slice(0, 5).map((tenant) => (
                  <div key={tenant._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{tenant.companyName}</h3>
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
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        CNPJ: {tenant.cnpj} • Criado em {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expira em: {new Date(tenant.expiresAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {tenant.plan}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tenant.days} dias
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum tenant encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">➕</span>
                Criar Novo Tenant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Adicionar uma nova empresa ao sistema
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                Gerenciar Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Visualizar e editar todos os tenants
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Relatórios detalhados do sistema
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
