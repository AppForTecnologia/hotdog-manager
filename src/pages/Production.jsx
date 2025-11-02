import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Hourglass, UtensilsCrossed, Bell, CheckCircle2, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const statusConfig = {
  Pendente: { icon: Hourglass, color: "bg-red-500/20 text-red-400 border-red-500/30", bgColor: "bg-red-500" },
  'Em Produção': { icon: UtensilsCrossed, color: "bg-orange-500/20 text-orange-400 border-orange-500/30", bgColor: "bg-orange-500" },
  Concluído: { icon: Bell, color: "bg-blue-500/20 text-blue-400 border-blue-500/30", bgColor: "bg-blue-500" },
  Entregue: { icon: CheckCircle2, color: "bg-green-500/20 text-green-400 border-green-500/30", bgColor: "bg-green-500" }
};

const statusTransitions = {
  Pendente: ['Em Produção'],
  'Em Produção': ['Concluído'],
  Concluído: ['Entregue'],
  Entregue: []
};

const ProductionItem = ({ item, onStatusChange, isBeverage }) => {
  const currentStatusInfo = statusConfig[item.status];
  
  let possibleNextStatus = statusTransitions[item.status] || [];
  if (isBeverage && item.status === 'Concluído') {
    possibleNextStatus = ['Entregue'];
  }

  const handleStatusChange = (nextStatus) => {
    onStatusChange(item.itemId, nextStatus);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} className={cn("p-4 rounded-lg border", currentStatusInfo.color)}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-bold text-foreground">{item.quantity}x {item.name}</p>
          {item.notes && <p className="text-sm text-muted-foreground">Obs: {item.notes}</p>}
        </div>
        <div className={`flex items-center space-x-2 text-sm font-semibold px-3 py-1 rounded-full ${currentStatusInfo.color}`}>
          <currentStatusInfo.icon className="h-4 w-4" />
          <span>{item.status}</span>
        </div>
      </div>
      {possibleNextStatus.length > 0 && (
        <div className="mt-3 flex flex-col space-y-2">
          {possibleNextStatus.map(status => {
            const nextStatusInfo = statusConfig[status];
            return (
              <Button key={status} onClick={() => handleStatusChange(status)} className={`w-full ${nextStatusInfo.bgColor} text-white hover:opacity-90`}>
                <nextStatusInfo.icon className="h-4 w-4 mr-2" />
                Mover para "{status}"
              </Button>
            )
          })}
        </div>
      )}
    </motion.div>
  );
};

const Production = () => {
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const beverageCategory = categories.find(c => c.name.toLowerCase() === 'bebidas');
  const beverageCategoryId = beverageCategory ? beverageCategory.id : null;

  useEffect(() => {
    const fetchCategories = () => {
      const savedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
      setCategories(savedCategories);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchOrders = () => {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const productionOrders = savedOrders
        .map(order => ({
          ...order,
          items: order.items.map(item => {
            const isBeverage = item.categoryId === beverageCategoryId;
            let status = item.status || 'Pendente';
            if (isBeverage && !item.status) {
              status = 'Concluído';
            }
            return { ...item, status };
          })
        }))
        .filter(order => order.items.some(item => item.status !== 'Entregue'));
      setOrders(productionOrders);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [beverageCategoryId]);

  const handleStatusChange = (itemId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    let updated = false;

    const newAllOrders = allOrders.map(order => {
      const itemIndex = order.items.findIndex(item => item.itemId === itemId);
      if (itemIndex > -1) {
        order.items[itemIndex].status = newStatus;
        updated = true;
      }
      return order;
    });

    if (updated) {
      localStorage.setItem('orders', JSON.stringify(newAllOrders));
      setOrders(prevOrders => {
        const updatedOrders = prevOrders
          .map(order => ({
            ...order,
            items: order.items.map(item =>
              item.itemId === itemId ? { ...item, status: newStatus } : item
            )
          }))
          .filter(order => order.items.some(item => item.status !== 'Entregue'));
        return updatedOrders;
      });

      toast({ title: "Status Atualizado!", description: `Item movido para "${newStatus}".` });
    }
  };

  const filteredOrders = orders.filter(order =>
    order.tableNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tela de Produção</h1>
          <p className="text-muted-foreground">Acompanhe os pedidos em tempo real</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar comanda..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-effect h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-foreground flex justify-between items-center">
                    <span>{order.tableNumber}</span>
                    <span className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3">
                  {order.items
                    .filter(item => item.status !== 'Entregue')
                    .map(item => (
                      <ProductionItem key={item.itemId} item={item} onStatusChange={handleStatusChange} isBeverage={item.categoryId === beverageCategoryId} />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
              <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Nenhum pedido em produção</h3>
              <p className="text-muted-foreground">Aguardando novos pedidos da tela de Pedidos.</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Production;