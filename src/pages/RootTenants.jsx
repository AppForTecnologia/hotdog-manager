import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRootUserInfo } from '@/components/RootGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * Página de gerenciamento de tenants no painel root
 * Permite criar, listar, buscar, renovar e suspender/reativar tenants
 */
export default function RootTenants() {
  const { isRootAdmin } = useRootUserInfo();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewDays, setRenewDays] = useState(30);

  // Estados para criação de tenant
  const [newTenant, setNewTenant] = useState({
    cnpj: '',
    companyName: '',
    plan: 'basic',
    days: 30,
    password: '',
    notes: ''
  });

  // Queries
  const tenants = useQuery(api.tenants.listTenants, { status: statusFilter === 'all' ? undefined : statusFilter });
  const tenantStats = useQuery(api.tenants.getTenantStats);

  // Mutations
  const createTenant = useMutation(api.tenants.createTenant);
  const renewTenant = useMutation(api.tenants.renewTenant);
  const suspendTenant = useMutation(api.tenants.suspendTenant);
  const reactivateTenant = useMutation(api.tenants.reactivateTenant);

  if (!isRootAdmin) {
    return null;
  }

  // Filtrar tenants por termo de busca
  const filteredTenants = tenants?.filter(tenant => 
    tenant.cnpj.includes(searchTerm) || 
    tenant.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Função para criar tenant
  const handleCreateTenant = async () => {
    try {
      await createTenant({
        cnpj: newTenant.cnpj,
        companyName: newTenant.companyName,
        plan: newTenant.plan,
        days: newTenant.days,
        password: newTenant.password,
        notes: newTenant.notes
      });
      
      setShowCreateDialog(false);
      setNewTenant({
        cnpj: '',
        companyName: '',
        plan: 'basic',
        days: 30,
        password: '',
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      alert('Erro ao criar tenant: ' + error.message);
    }
  };

  // Função para renovar tenant
  const handleRenewTenant = async () => {
    if (!selectedTenant) return;
    
    try {
      await renewTenant({
        tenantId: selectedTenant._id,
        days: renewDays
      });
      
      setShowRenewDialog(false);
      setSelectedTenant(null);
      setRenewDays(30);
    } catch (error) {
      console.error('Erro ao renovar tenant:', error);
      alert('Erro ao renovar tenant: ' + error.message);
    }
  };

  // Função para suspender/reativar tenant
  const handleToggleStatus = async (tenant) => {
    try {
      if (tenant.status === 'active') {
        await suspendTenant({ tenantId: tenant._id });
      } else {
        await reactivateTenant({ tenantId: tenant._id });
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status: ' + error.message);
    }
  };

  // Função para formatar CNPJ
  const formatCNPJ = (cnpj) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Função para verificar se está expirando
  const isExpiringSoon = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffDays = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Tenants</h1>
          <p className="text-gray-600 mt-2">Administrar empresas e CNPJs do sistema</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantStats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{tenantStats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Suspensos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{tenantStats?.suspended || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Expirando</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{tenantStats?.expiringSoon || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por CNPJ ou nome da empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="suspended">Suspensos</option>
                </select>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>➕ Criar Tenant</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Tenant</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        value={newTenant.cnpj}
                        onChange={(e) => setNewTenant({...newTenant, cnpj: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        placeholder="Nome da empresa"
                        value={newTenant.companyName}
                        onChange={(e) => setNewTenant({...newTenant, companyName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan">Plano</Label>
                      <select
                        id="plan"
                        value={newTenant.plan}
                        onChange={(e) => setNewTenant({...newTenant, plan: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="basic">Básico</option>
                        <option value="premium">Premium</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="days">Dias de Validade</Label>
                      <Input
                        id="days"
                        type="number"
                        value={newTenant.days}
                        onChange={(e) => setNewTenant({...newTenant, days: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Senha para acesso"
                        value={newTenant.password}
                        onChange={(e) => setNewTenant({...newTenant, password: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Observações adicionais"
                        value={newTenant.notes}
                        onChange={(e) => setNewTenant({...newTenant, notes: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateTenant}>
                        Criar Tenant
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Lista de Tenants */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tenants ({filteredTenants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTenants.length > 0 ? (
              <div className="space-y-4">
                {filteredTenants.map((tenant) => (
                  <div key={tenant._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{tenant.companyName}</h3>
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
                          {isExpiringSoon(tenant.expiresAt) && (
                            <Badge variant="destructive">Expirando</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>CNPJ:</strong> {formatCNPJ(tenant.cnpj)}
                          </div>
                          <div>
                            <strong>Plano:</strong> {tenant.plan}
                          </div>
                          <div>
                            <strong>Dias:</strong> {tenant.days}
                          </div>
                          <div>
                            <strong>Criado:</strong> {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <strong>Expira:</strong> {new Date(tenant.expiresAt).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <strong>Último Acesso:</strong> {tenant.lastAccess ? new Date(tenant.lastAccess).toLocaleDateString('pt-BR') : 'Nunca'}
                          </div>
                        </div>
                        {tenant.notes && (
                          <div className="mt-2 text-sm text-gray-500">
                            <strong>Observações:</strong> {tenant.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowRenewDialog(true);
                          }}
                        >
                          🔄 Renovar
                        </Button>
                        <Button
                          size="sm"
                          variant={tenant.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => handleToggleStatus(tenant)}
                        >
                          {tenant.status === 'active' ? '⏸️ Suspender' : '▶️ Reativar'}
                        </Button>
                      </div>
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

        {/* Dialog de Renovação */}
        <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Renovar Tenant</DialogTitle>
            </DialogHeader>
            {selectedTenant && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold">{selectedTenant.companyName}</h4>
                  <p className="text-sm text-gray-600">CNPJ: {formatCNPJ(selectedTenant.cnpj)}</p>
                  <p className="text-sm text-gray-600">
                    Expira em: {new Date(selectedTenant.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="renewDays">Dias para adicionar</Label>
                  <Input
                    id="renewDays"
                    type="number"
                    value={renewDays}
                    onChange={(e) => setRenewDays(parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowRenewDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleRenewTenant}>
                    Renovar Tenant
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
