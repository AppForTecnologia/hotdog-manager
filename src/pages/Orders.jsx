import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle, 
  RefreshCw, 
  Filter,
  Search,
  Eye,
  Phone,
  MapPin,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  // Buscar dados do Convex
  const sales = useQuery(api.sales.listAll) || [];
  const saleItems = useQuery(api.sales.getSaleItemsWithProducts) || [];
  const productionItems = useQuery(api.production.getAllProductionItems) || [];
  const customers = useQuery(api.customers.listActive) || [];
  
  // Mutation para marcar pedido como entregue
  const deliverItem = useMutation(api.production.deliverItem);

  // Estados para filtros
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    console.log('Orders component mounted');
    console.log('Sales:', sales);
    console.log('SaleItems:', saleItems);
    console.log('ProductionItems:', productionItems);
    console.log('Customers:', customers);
  }, [sales, saleItems, productionItems, customers]);

  useEffect(() => {
    filterOrders();
  }, [sales, saleItems, productionItems, customers, searchTerm, statusFilter, orderTypeFilter]);

  const filterOrders = () => {
    let filtered = sales;

    // IMPORTANTE: Tela de Pedidos só mostra pedidos que estão "Pronto" ou "Entregue"
    // Pedidos em produção (Pendente, Em Preparo) não aparecem aqui
    filtered = filtered.filter(sale => {
      const status = getOrderStatus(sale).status;
      return status === 'ready' || status === 'delivered';
    });

    // Filtrar por tipo de pedido
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(sale => sale.saleType === orderTypeFilter);
    }

    // Filtrar por status (agora só ready e delivered)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => getOrderStatus(sale).status === statusFilter);
    }

    // Filtrar por termo de busca (cliente, produtos, etc.)
    if (searchTerm) {
      filtered = filtered.filter(sale => {
        // Buscar por nome do cliente
        if (sale.customerId) {
          const customer = customers.find(c => c._id === sale.customerId);
          if (customer && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return true;
          }
        }

        // Buscar por produtos na venda
        const saleItemsForSale = saleItems.filter(item => item.saleId === sale._id);
        const hasMatchingProduct = saleItemsForSale.some(item => 
          item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return hasMatchingProduct;
      });
    }

    setFilteredOrders(filtered);
    console.log('Filtered orders:', filtered);
  };

  const getOrderStatus = (sale) => {
    try {
      // Buscar itens de venda para esta venda
      const saleItemsForSale = saleItems.filter(item => item.saleId === sale._id);
      
      if (saleItemsForSale.length === 0) {
        return { status: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-500' };
      }

      // Buscar itens de produção para esta venda
      const productionItemsForSale = productionItems.filter(item => item.saleId === sale._id);
      
      // Se não há itens de produção, considerar como "em preparo" (produção ainda não iniciou)
      if (productionItemsForSale.length === 0) {
        return { status: 'preparing', label: 'Em Preparo', icon: RefreshCw, color: 'text-orange-500' };
      }

      // Verificar status dos itens de produção
      const allCompleted = productionItemsForSale.every(item => 
        item.productionStatus === 'concluido'
      );
      const anyInProduction = productionItemsForSale.some(item => 
        item.productionStatus === 'em_producao'
      );

      // Lógica simplificada: produção só controla até "Pronto"
      if (allCompleted) {
        return { status: 'ready', label: 'Pronto', icon: Truck, color: 'text-blue-500' };
      } else if (anyInProduction) {
        return { status: 'preparing', label: 'Em Preparo', icon: RefreshCw, color: 'text-orange-500' };
      } else {
        return { status: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-500' };
      }
    } catch (error) {
      console.error('Error in getOrderStatus:', error);
      return { status: 'pending', label: 'Pendente', icon: Clock, color: 'text-yellow-500' };
    }
  };

  const getOrderItems = (saleId) => {
    return saleItems.filter(item => item.saleId === saleId);
  };

  const getCustomerInfo = (customerId) => {
    return customers.find(c => c._id === customerId);
  };

  const updateOrderStatus = async (saleId, newStatus) => {
    try {
      if (newStatus === 'delivered') {
        // Buscar todos os itens de produção desta venda
        const saleItemsForSale = saleItems.filter(item => item.saleId === saleId);
        
        // Marcar todos os itens como entregues
        await Promise.all(
          saleItemsForSale.map(item => 
            deliverItem({ saleItemId: item._id })
          )
        );
        
        toast({
          title: "Pedido entregue!",
          description: "Status atualizado com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: `Erro ao marcar como entregue: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'preparing':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ready':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Renderizar ícone de status de forma mais simples
  const renderStatusIcon = (iconComponent, className) => {
    try {
      const IconComponent = iconComponent;
      return <IconComponent className={className} />;
    } catch (error) {
      console.error('Error rendering icon:', error);
      return <Clock className={className} />;
    }
  };

  console.log('Rendering Orders component');

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
                 <h1 className="text-2xl font-bold text-white mb-2">Acompanhamento de Pedidos</h1>
         <p className="text-white/70">Pedidos prontos para entrega - marque como entregue após servir o cliente</p>
      </motion.div>

      

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-white">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input
                    id="search"
                    placeholder="Cliente, produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/10 border-white/20 text-white pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                                 <select
                   id="status"
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="w-full bg-gray-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                   <option value="all" className="bg-gray-800 text-white">Todos os Status</option>
                   <option value="ready" className="bg-gray-800 text-white">Pronto</option>
                   <option value="delivered" className="bg-gray-800 text-white">Entregue</option>
                 </select>
              </div>

              <div>
                <Label htmlFor="orderType" className="text-white">Tipo de Pedido</Label>
                <select
                  id="orderType"
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-white/20 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all" className="bg-gray-800 text-white">Todos os Tipos</option>
                  <option value="local" className="bg-gray-800 text-white">Local</option>
                  <option value="delivery" className="bg-gray-800 text-white">Delivery</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setOrderTypeFilter('all');
                  }} 
                  variant="outline" 
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Pedidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredOrders.length === 0 ? (
          <Card className="glass-effect border-white/20">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 text-lg">Nenhum pedido encontrado</p>
              <p className="text-white/40 text-sm">Tente ajustar os filtros ou aguarde novos pedidos</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((sale, index) => {
            try {
              const orderStatus = getOrderStatus(sale);
              const orderItems = getOrderItems(sale._id);
              const customer = getCustomerInfo(sale.customerId);
              
              return (
                <motion.div
                  key={sale._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-effect border-white/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge className={`${getStatusBadgeColor(orderStatus.status)} border`}>
                            {renderStatusIcon(orderStatus.icon, `h-4 w-4 mr-2`)}
                            {orderStatus.label}
                          </Badge>
                          <div>
                            <h3 className="text-white font-semibold">
                              Pedido #{index + 1} - {sale.saleType === 'delivery' ? 'Delivery' : 'Local'}
                            </h3>
                            <p className="text-white/60 text-sm">
                              {new Date(sale.saleDate).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">R$ {sale.total.toFixed(2)}</p>
                          <p className="text-white/60 text-sm">
                            {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Informações do Cliente (se delivery) */}
                      {sale.saleType === 'delivery' && customer && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <User className="h-5 w-5 text-blue-400" />
                            <div>
                              <p className="text-white font-medium">{customer.name}</p>
                              <div className="flex items-center space-x-2 text-sm text-white/60">
                                <Phone className="h-4 w-4" />
                                <span>{customer.phone}</span>
                              </div>
                            </div>
                            <MapPin className="h-5 w-5 text-green-400" />
                            <div className="text-sm text-white/60 max-w-xs">
                              {customer.address}
                            </div>
                          </div>
                          {customer.notes && (
                            <p className="text-sm text-white/50 mt-2 italic">
                              📝 {customer.notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Itens do Pedido */}
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div key={item._id} className="flex items-center justify-between p-2 bg-white/5 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-white font-medium">{item.productName}</span>
                              <Badge variant="outline" className="text-xs">
                                Qtd: {item.quantity}
                              </Badge>
                              <span className="text-white/60 text-sm">
                                R$ {item.unitPrice.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-white font-bold">
                                R$ {item.subtotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Observações da Venda */}
                      {sale.notes && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-yellow-400 text-sm">
                            <AlertCircle className="h-4 w-4 inline mr-2" />
                            <strong>Observações:</strong> {sale.notes}
                          </p>
                        </div>
                      )}

                                             {/* Ações do Garçom */}
                       <div className="mt-4 flex justify-end space-x-2">
                         {/* Garçom só pode marcar como Entregue quando estiver Pronto */}
                         {orderStatus.status === 'ready' && (
                           <Button
                             onClick={() => updateOrderStatus(sale._id, 'delivered')}
                             size="sm"
                             className="bg-green-500 hover:bg-green-600"
                           >
                             <Truck className="h-4 w-4 mr-2" />
                             Entregar
                           </Button>
                         )}
                         
                         {/* Status de produção são controlados pela cozinha, não pelo garçom */}
                         {(orderStatus.status === 'pending' || orderStatus.status === 'preparing') && (
                           <div className="text-sm text-white/60 italic">
                             Aguardando produção...
                           </div>
                         )}
                         
                         <Button
                           variant="outline"
                           size="sm"
                           className="border-white/20 text-white hover:bg-white/10"
                         >
                           <Eye className="h-4 w-4 mr-2" />
                           Detalhes
                         </Button>
                       </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            } catch (error) {
              console.error('Error rendering order:', error);
              return (
                <Card key={sale._id} className="glass-effect border-red-500/20">
                  <CardContent className="p-4">
                    <p className="text-red-400">Erro ao renderizar pedido: {error.message}</p>
                  </CardContent>
                </Card>
              );
            }
          })
        )}
      </motion.div>

      {/* Estatísticas Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
                 className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
                 <Card className="glass-effect border-white/20">
           <CardContent className="p-4">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-white/60 text-sm">Aguardando Entrega</p>
                 <p className="text-2xl font-bold text-blue-400">
                   {filteredOrders.filter(sale => getOrderStatus(sale).status === 'ready').length}
                 </p>
               </div>
               <Truck className="h-8 w-8 text-blue-400" />
             </div>
           </CardContent>
         </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Prontos</p>
                <p className="text-2xl font-bold text-blue-400">
                  {filteredOrders.filter(sale => getOrderStatus(sale).status === 'ready').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Entregues</p>
                <p className="text-2xl font-bold text-green-400">
                  {filteredOrders.filter(sale => getOrderStatus(sale).status === 'delivered').length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Orders;
