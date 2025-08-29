import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

/**
 * Página de Gerenciamento de CNPJs
 * Apenas usuários Master podem acessar esta funcionalidade
 */
const CnpjManagement = () => {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [selectedCnpj, setSelectedCnpj] = useState(null);
  const [selectedCnpjForRenewal, setSelectedCnpjForRenewal] = useState(null);
  const [selectedCnpjForLink, setSelectedCnpjForLink] = useState(null);

  // Estados para formulários
  const [createForm, setCreateForm] = useState({
    cnpj: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    plan: 'basic',
    days: 30,
    notes: ''
  });

  const [renewalForm, setRenewalForm] = useState({
    days: 30,
    amount: 0,
    paymentMethod: 'pix',
    notes: ''
  });

  const [linkForm, setLinkForm] = useState({
    userId: '',
    role: 'employee'
  });

  // Verificar se o usuário é Master
  const isMaster = useQuery(api.cnpjs.isUserMaster, { 
    userId: user?.id || '' 
  });

  // Buscar dados
  const cnpjs = useQuery(api.cnpjs.listAllCnpjs, { 
    userId: user?.id || '' 
  }) || [];

  const masterStats = useQuery(api.cnpjs.getMasterStats, { 
    masterUserId: user?.id || '' 
  });

  // Mutations
  const createCnpj = useMutation(api.cnpjs.createCnpj);
  const renewCnpj = useMutation(api.cnpjs.renewCnpj);
  const linkUserToCnpj = useMutation(api.cnpjs.linkUserToCnpj);
  const unlinkUserFromCnpj = useMutation(api.cnpjs.unlinkUserFromCnpj);

  // Filtrar CNPJs
  const filteredCnpjs = cnpjs.filter(cnpj => {
    const matchesSearch = 
      cnpj.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cnpj.cnpj.includes(searchTerm) ||
      cnpj.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cnpj.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Verificar se o usuário tem acesso
  useEffect(() => {
    if (isMaster === false) {
      toast({
        title: "Acesso Negado",
        description: "Apenas usuários Master podem acessar esta funcionalidade",
        variant: "destructive"
      });
    }
  }, [isMaster]);

  // Se não for Master, não mostrar nada
  if (isMaster === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="glass-effect border-red-500/20 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Acesso Negado</h3>
            <p className="text-white/70">
              Apenas usuários Master podem acessar o gerenciamento de CNPJs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se ainda está carregando
  if (isMaster === undefined || !cnpjs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  // Funções
  const handleCreateCnpj = async () => {
    try {
      await createCnpj({
        ...createForm,
        userId: user.id
      });
      
      toast({
        title: "CNPJ Criado!",
        description: "CNPJ cadastrado com sucesso no sistema",
      });
      
      setShowCreateForm(false);
      setCreateForm({
        cnpj: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        plan: 'basic',
        days: 30,
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRenewCnpj = async () => {
    try {
      await renewCnpj({
        cnpjId: selectedCnpjForRenewal._id,
        ...renewalForm,
        userId: user.id
      });
      
      toast({
        title: "CNPJ Renovado!",
        description: "Dias adicionados com sucesso",
      });
      
      setShowRenewalForm(false);
      setSelectedCnpjForRenewal(null);
      setRenewalForm({
        days: 30,
        amount: 0,
        paymentMethod: 'pix',
        notes: ''
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLinkUser = async () => {
    try {
      await linkUserToCnpj({
        userId: linkForm.userId,
        cnpjId: selectedCnpjForLink._id,
        role: linkForm.role,
        masterUserId: user.id
      });
      
      toast({
        title: "Usuário Vinculado!",
        description: "Usuário vinculado ao CNPJ com sucesso",
      });
      
      setShowLinkForm(false);
      setSelectedCnpjForLink(null);
      setLinkForm({
        userId: '',
        role: 'employee'
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status, daysUntilExpiration) => {
    if (status === 'active' && daysUntilExpiration > 7) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
    } else if (status === 'active' && daysUntilExpiration <= 7) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Expirando</Badge>;
    } else if (status === 'expired') {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expirado</Badge>;
    } else {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan) => {
    const colors = {
      basic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      premium: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      enterprise: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    
    return <Badge className={colors[plan] || colors.basic}>{plan}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">Gerenciamento de CNPJs</h1>
        <p className="text-white/70">Gerencie empresas e suas permissões de acesso</p>
      </motion.div>

      {/* Estatísticas */}
      {masterStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="glass-effect border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total de CNPJs</p>
                  <p className="text-2xl font-bold text-blue-400">{masterStats.totalCnpjs}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">CNPJs Ativos</p>
                  <p className="text-2xl font-bold text-green-400">{masterStats.activeCnpjs}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total de Usuários</p>
                  <p className="text-2xl font-bold text-purple-400">{masterStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Receita Total</p>
                  <p className="text-2xl font-bold text-orange-400">R$ {masterStats.revenue.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Controles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
      >
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Buscar por empresa, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/10 border-white/20 text-white pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all" className="bg-gray-800 text-white">Todos os Status</option>
            <option value="active" className="bg-gray-800 text-white">Ativos</option>
            <option value="expired" className="bg-gray-800 text-white">Expirados</option>
            <option value="suspended" className="bg-gray-800 text-white">Suspensos</option>
          </select>
        </div>

        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo CNPJ
        </Button>
      </motion.div>

      {/* Lista de CNPJs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredCnpjs.length === 0 ? (
          <Card className="glass-effect border-white/20">
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 text-lg">Nenhum CNPJ encontrado</p>
              <p className="text-white/40 text-sm">Crie o primeiro CNPJ para começar</p>
            </CardContent>
          </Card>
        ) : (
          filteredCnpjs.map((cnpj, index) => (
            <motion.div
              key={cnpj._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(cnpj.status, cnpj.daysUntilExpiration)}
                      {getPlanBadge(cnpj.plan)}
                      <div>
                        <h3 className="text-white font-semibold text-lg">{cnpj.companyName}</h3>
                        <p className="text-white/60 text-sm">{cnpj.cnpj}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        {cnpj.daysUntilExpiration > 0 
                          ? `${cnpj.daysUntilExpiration} dias restantes`
                          : 'Expirado'
                        }
                      </p>
                      <p className="text-white/60 text-sm">
                        {cnpj.userCount} usuário{cnpj.userCount !== 1 ? 's' : ''} vinculado{cnpj.userCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white/60">Email:</span>
                      <span className="text-white">{cnpj.email}</span>
                    </div>
                    {cnpj.phone && (
                      <div className="flex items-center space-x-2">
                        <span className="text-white/60">Telefone:</span>
                        <span className="text-white">{cnpj.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-white/60">Criado em:</span>
                      <span className="text-white">
                        {new Date(cnpj.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {cnpj.notes && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/60 text-sm">
                        <strong>Observações:</strong> {cnpj.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCnpj(cnpj);
                        // Aqui você pode implementar visualização detalhada
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCnpjForRenewal(cnpj);
                        setShowRenewalForm(true);
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Renovar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCnpjForLink(cnpj);
                        setShowLinkForm(true);
                      }}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Vincular Usuário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Modal de Criação de CNPJ */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="glass-effect border-white/20 w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle className="text-white">Criar Novo CNPJ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj" className="text-white">CNPJ</Label>
                  <Input
                    id="cnpj"
                    placeholder="XX.XXX.XXX/XXXX-XX"
                    value={createForm.cnpj}
                    onChange={(e) => setCreateForm({...createForm, cnpj: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyName" className="text-white">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    placeholder="Nome da empresa"
                    value={createForm.companyName}
                    onChange={(e) => setCreateForm({...createForm, companyName: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-white">Telefone (opcional)</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-white">Endereço (opcional)</Label>
                  <Input
                    id="address"
                    placeholder="Endereço completo"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({...createForm, address: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="plan" className="text-white">Plano</Label>
                  <select
                    id="plan"
                    value={createForm.plan}
                    onChange={(e) => setCreateForm({...createForm, plan: e.target.value})}
                    className="w-full bg-gray-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic" className="bg-gray-800 text-white">Basic</option>
                    <option value="premium" className="bg-gray-800 text-white">Premium</option>
                    <option value="enterprise" className="bg-gray-800 text-white">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="days" className="text-white">Dias para o Plano</Label>
                  <Input
                    id="days"
                    type="number"
                    placeholder="30"
                    value={createForm.days}
                    onChange={(e) => setCreateForm({...createForm, days: parseInt(e.target.value)})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="notes" className="text-white">Observações (opcional)</Label>
                  <Input
                    id="notes"
                    placeholder="Observações adicionais"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCnpj}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Criar CNPJ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Renovação */}
      {showRenewalForm && selectedCnpjForRenewal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="glass-effect border-white/20 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Renovar CNPJ</CardTitle>
              <p className="text-white/60 text-sm">
                {selectedCnpjForRenewal.companyName} - {selectedCnpjForRenewal.cnpj}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="renewalDays" className="text-white">Dias para Adicionar</Label>
                <Input
                  id="renewalDays"
                  type="number"
                  placeholder="30"
                  value={renewalForm.days}
                  onChange={(e) => setRenewalForm({...renewalForm, days: parseInt(e.target.value)})}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="amount" className="text-white">Valor Pago</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={renewalForm.amount}
                  onChange={(e) => setRenewalForm({...renewalForm, amount: parseFloat(e.target.value)})}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentMethod" className="text-white">Método de Pagamento</Label>
                <select
                  id="paymentMethod"
                  value={renewalForm.paymentMethod}
                  onChange={(e) => setRenewalForm({...renewalForm, paymentMethod: e.target.value})}
                  className="w-full bg-gray-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pix" className="bg-gray-800 text-white">PIX</option>
                  <option value="credit" className="bg-gray-800 text-white">Cartão de Crédito</option>
                  <option value="debit" className="bg-gray-800 text-white">Cartão de Débito</option>
                  <option value="money" className="bg-gray-800 text-white">Dinheiro</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="renewalNotes" className="text-white">Observações (opcional)</Label>
                <Input
                  id="renewalNotes"
                  placeholder="Observações da renovação"
                  value={renewalForm.notes}
                  onChange={(e) => setRenewalForm({...renewalForm, notes: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRenewalForm(false);
                    setSelectedCnpjForRenewal(null);
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRenewCnpj}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Renovar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Vinculação de Usuário */}
      {showLinkForm && selectedCnpjForLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="glass-effect border-white/20 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-white">Vincular Usuário</CardTitle>
              <p className="text-white/60 text-sm">
                {selectedCnpjForLink.companyName} - {selectedCnpjForLink.cnpj}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="linkUserId" className="text-white">ID do Usuário (Clerk)</Label>
                <Input
                  id="linkUserId"
                  placeholder="user_123456789"
                  value={linkForm.userId}
                  onChange={(e) => setLinkForm({...linkForm, userId: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                />
                <p className="text-white/40 text-xs mt-1">
                  ID do usuário no sistema Clerk
                </p>
              </div>
              
              <div>
                <Label htmlFor="linkRole" className="text-white">Role do Usuário</Label>
                <select
                  id="linkRole"
                  value={linkForm.role}
                  onChange={(e) => setLinkForm({...linkForm, role: e.target.value})}
                  className="w-full bg-gray-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin" className="bg-gray-800 text-white">Administrador</option>
                  <option value="manager" className="bg-gray-800 text-white">Gerente</option>
                  <option value="employee" className="bg-gray-800 text-white">Funcionário</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLinkForm(false);
                    setSelectedCnpjForLink(null);
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleLinkUser}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Vincular
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CnpjManagement;
