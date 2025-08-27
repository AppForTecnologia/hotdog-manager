import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const Customers = () => {
  const customers = useQuery(api.customers.listActive) || [];
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  const deactivateCustomer = useMutation(api.customers.deactivate);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  // Formatar telefone automaticamente
  const formatPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    if (cleaned.length <= 11) {
      return cleaned.replace(/^(\d{0,2})(\d{0,5})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return phone;
  };

  // Abrir modal para adicionar novo cliente
  const openAddDialog = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  // Abrir modal para editar cliente
  const openEditDialog = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes || ''
    });
    setIsDialogOpen(true);
  };

  // Salvar cliente
  const saveCustomer = async () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer({
          customerId: editingCustomer._id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim()
        });
        
        toast({
          title: "Cliente atualizado!",
          description: `${formData.name} foi atualizado com sucesso.`
        });
      } else {
        await createCustomer({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          notes: formData.notes.trim()
        });
        
        toast({
          title: "Cliente cadastrado!",
          description: `${formData.name} foi cadastrado com sucesso.`
        });
      }
      
      setIsDialogOpen(false);
      setFormData({
        name: '',
        phone: '',
        address: '',
        notes: ''
      });
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Excluir cliente
  const deleteCustomer = async (customer) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${customer.name}?`)) {
      try {
        await deactivateCustomer({ customerId: customer._id });
        toast({
          title: "Cliente excluído!",
          description: `${customer.name} foi excluído com sucesso.`
        });
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        toast({
          title: "Erro",
          description: "Erro ao excluir cliente. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  // Filtrar clientes por termo de busca
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Formatar a data de criação
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">Clientes</h1>
        <p className="text-white/70">Gerencie os clientes para delivery</p>
      </motion.div>

      {/* Barra de busca e botão adicionar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="btn-gradient">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          
          <DialogContent className="glass-effect border-white/20 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome completo"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-white">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              
              <div>
                <Label htmlFor="address" className="text-white">Endereço *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Digite o endereço completo"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-white">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ponto de referência, instruções especiais..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveCustomer} className="btn-gradient flex-1">
                  {editingCustomer ? 'Atualizar' : 'Cadastrar'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-effect border-white/20 card-hover">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header do card */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" />
                      <h3 className="font-semibold text-white truncate">
                        {customer.name}
                      </h3>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(customer)}
                        className="text-blue-400 hover:bg-blue-500/10 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCustomer(customer)}
                        className="text-red-400 hover:bg-red-500/10 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Informações do cliente */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-400" />
                      <span className="text-white/80 text-sm">
                        {customer.phone}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-orange-400 mt-0.5" />
                      <span className="text-white/70 text-sm leading-relaxed">
                        {customer.address}
                      </span>
                    </div>
                    
                    {customer.notes && (
                      <div className="mt-2 p-2 bg-white/5 rounded text-white/60 text-xs">
                        {customer.notes}
                      </div>
                    )}
                  </div>

                  {/* Data de cadastro */}
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/50 text-xs">
                      Cadastrado em {formatDate(customer.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Estado vazio */}
      {filteredCustomers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          {searchTerm.trim() !== '' ? (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum cliente encontrado
              </h3>
              <p className="text-white/60">
                Tente buscar por outro termo ou cadastre um novo cliente.
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum cliente cadastrado
              </h3>
              <p className="text-white/60">
                Cadastre clientes para começar a fazer deliveries!
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Customers;
