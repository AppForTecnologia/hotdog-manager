import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Hourglass, UtensilsCrossed, Bell, CheckCircle2, AlertTriangle, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const statusConfig = {
  Pendente: {
    icon: Hourglass,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    bgColor: "bg-red-500",
  },
  'Em Produção': {
    icon: UtensilsCrossed,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    bgColor: "bg-orange-500",
  },
  Concluído: {
    icon: Bell,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    bgColor: "bg-blue-500",
  },
  Entregue: {
    icon: CheckCircle2,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    bgColor: "bg-green-500",
  }
};

const statusTransitions = {
  Pendente: ['Em Produção'],
  'Em Produção': ['Concluído'],
  Concluído: ['Entregue'],
  Entregue: []
};

const ProductionItem = ({ item, onStatusChange }) => {
  const currentStatusInfo = statusConfig[item.status];
  const nextStatus = statusTransitions[item.status]?.[0];
  const nextStatusInfo = nextStatus ? statusConfig[nextStatus] : null;

  const handleStatusChange = () => {
    if (nextStatus) {
      onStatusChange(item.itemId, nextStatus);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn("p-4 rounded-lg border", currentStatusInfo.color)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-bold text-white">{item.quantity}x {item.name}</p>
          {item.notes && item.notes !== item.name && (
            <p className="text-sm text-white/60">{item.notes}</p>
          )}
        </div>
        <div className={`flex items-center space-x-2 text-sm font-semibold px-3 py-1 rounded-full ${currentStatusInfo.color}`}>
          <currentStatusInfo.icon className="h-4 w-4" />
          <span>{item.status}</span>
        </div>
      </div>
      {nextStatus && (
        <Button 
          onClick={handleStatusChange} 
          className={`w-full mt-3 ${nextStatusInfo.bgColor} text-white hover:opacity-90`}
        >
          <nextStatusInfo.icon className="h-4 w-4 mr-2" />
          Mover para "{nextStatus}"
        </Button>
      )}
    </motion.div>
  );
};

const Production = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Buscar dados do Convex
  const sales = useQuery(api.sales.listAll) || [];
  const updateSaleStatus = useMutation(api.sales.updateStatus);

  // Converter vendas para pedidos de produção
  const orders = sales
    .filter(sale => sale.status === 'pendente')
    .map(sale => ({
      ...sale,
      // Por enquanto, criar um item por venda
      // TODO: Implementar busca de itens reais da tabela saleItems
      items: [{
        _id: sale._id,
        name: sale.notes ? sale.notes.replace('Mesa: ', '') : `Pedido ${sale._id.slice(-6)}`,
        quantity: 1,
        status: 'Pendente',
        notes: sale.notes || '',
        itemId: sale._id
      }]
    }))
    .filter(order => order.items.some(item => item.status !== 'Entregue'));

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      // Atualizar status da venda no Convex
      await updateSaleStatus({ id: itemId, status: newStatus });
      
      toast({
        title: "Status atualizado",
        description: `Item movido para ${newStatus}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do item",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order =>
    (order.tableNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Tela de Produção</h1>
          <p className="text-white/70">Acompanhe os pedidos em tempo real</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <Input
            placeholder="Buscar comanda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <Card className="glass-effect border-white/20 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-lg">{order.notes ? order.notes.replace('Mesa: ', '') : 'Pedido'}</span>
                    <span className="text-sm text-white/70">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3">
                  {order.items
                    .filter(item => item.status !== 'Entregue')
                    .map(item => (
                      <ProductionItem key={item.itemId} item={item} onStatusChange={handleStatusChange} />
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ChefHat className="h-16 w-16 mx-auto text-white/50 mb-4" />
              <h3 className="text-2xl font-bold text-white">Nenhum pedido em produção</h3>
              <p className="text-white/70">Aguardando novos pedidos da tela de vendas.</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Production;