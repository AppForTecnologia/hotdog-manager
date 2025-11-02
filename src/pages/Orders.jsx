
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Truck, CheckCircle, Package } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchAllData = () => {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      setOrders(savedOrders);
      setClients(savedClients);
    };
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 3000); // Refresh data every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const saveOrders = (newOrders) => {
    localStorage.setItem('orders', JSON.stringify(newOrders));
    setOrders(newOrders);
  };

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderId) {
        const updatedOrder = { ...order, status: newStatus };
        if (newStatus === 'Em rota de entrega') {
          updatedOrder.saidaEntregaEm = new Date().toISOString();
        }
        if (newStatus === 'Entregue') {
          updatedOrder.entregueEm = new Date().toISOString();
        }
        return updatedOrder;
      }
      return order;
    });
    saveOrders(updatedOrders);
    toast({ title: "Status do Pedido Atualizado!", description: `Pedido movido para "${newStatus}".` });
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const getClientInfo = (clientId) => {
    return clients.find(c => c.id === clientId);
  };

  const filteredOrders = orders.filter(order => {
    const today = new Date().toDateString();
    const orderDate = new Date(order.createdAt).toDateString();
    
    let passesFilter = true;
    if (filter === 'today') passesFilter = orderDate === today;
    if (filter === 'open') passesFilter = !['Entregue', 'Cancelado', 'pending'].includes(order.status);
    if (filter === 'delivery_route') passesFilter = order.status === 'Em rota de entrega';
    if (filter === 'delivered') passesFilter = order.status === 'Entregue';
    if (filter === 'local') passesFilter = order.type === 'Local';
    if (filter === 'delivery') passesFilter = order.type === 'Delivery';

    if (!passesFilter) return false;

    const searchTermLower = searchTerm.toLowerCase();
    const client = order.clientId ? getClientInfo(order.clientId) : null;
    return (
      (order.tableNumber && order.tableNumber.toLowerCase().includes(searchTermLower)) ||
      (client && client.name.toLowerCase().includes(searchTermLower)) ||
      (client && client.phone.includes(searchTermLower)) ||
      order.id.toString().includes(searchTermLower)
    );
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos Operacional</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie as entregas e pedidos locais.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
        </div>
      </motion.div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="open">Abertos</TabsTrigger>
          <TabsTrigger value="delivery_route">Em Rota</TabsTrigger>
          <TabsTrigger value="delivered">Entregues</TabsTrigger>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order, index) => {
          const client = order.clientId ? getClientInfo(order.clientId) : null;
          return (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-effect h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-foreground flex justify-between items-center">
                    <span>{order.type === 'Local' ? order.tableNumber : `Delivery: ${client?.name || 'Cliente não encontrado'}`}</span>
                    <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Status: {order.status || 'Pendente'}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {order.items.slice(0, 3).map(item => (
                    <p key={item.itemId} className="text-sm text-muted-foreground">{item.quantity}x {item.name}</p>
                  ))}
                  {order.items.length > 3 && <p className="text-sm text-muted-foreground">... e mais {order.items.length - 3} itens.</p>}
                </CardContent>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => openDetails(order)}>Detalhes</Button>
                  {order.type === 'Delivery' && order.status !== 'Em rota de entrega' && order.status !== 'Entregue' && (
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={() => handleStatusChange(order.id, 'Em rota de entrega')}>
                      <Truck className="h-4 w-4 mr-2" />
                      Entregar
                    </Button>
                  )}
                  {order.type === 'Delivery' && order.status === 'Em rota de entrega' && (
                    <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handleStatusChange(order.id, 'Entregue')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="col-span-full text-center py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">Tente um filtro ou termo de busca diferente.</p>
          </motion.div>
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {selectedOrder.type === 'Delivery' && getClientInfo(selectedOrder.clientId) && (
                <div className="p-3 rounded-lg bg-accent">
                  <h4 className="font-semibold text-foreground">Cliente</h4>
                  <p className="text-sm text-muted-foreground">Nome: {getClientInfo(selectedOrder.clientId).name}</p>
                  <p className="text-sm text-muted-foreground">Telefone: {getClientInfo(selectedOrder.clientId).phone}</p>
                  <p className="text-sm text-muted-foreground">Endereço: {selectedOrder.deliveryAddress}</p>
                </div>
              )}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Itens do Pedido</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map(item => (
                    <div key={item.itemId} className="flex justify-between p-2 rounded bg-accent/50">
                      <p className="text-foreground">{item.quantity}x {item.name}</p>
                      <p className="text-green-400">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-border pt-2 text-right">
                <p className="text-lg font-bold text-foreground">Total: R$ {selectedOrder.total.toFixed(2)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
