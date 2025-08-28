import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Hourglass, UtensilsCrossed, Bell, CheckCircle2, AlertTriangle, ChefHat, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const statusConfig = {
  pendente: {
    icon: Hourglass,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    bgColor: "bg-red-500",
    label: "Pendente",
  },
  em_producao: {
    icon: UtensilsCrossed,
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    bgColor: "bg-orange-500",
    label: "Em Produção",
  },
  concluido: {
    icon: Bell,
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    bgColor: "bg-blue-500",
    label: "Concluído",
  },
  pronto: {
    icon: CheckCircle2,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    bgColor: "bg-green-500",
    label: "Pronto",
  },
  entregue: {
    icon: CheckCircle2,
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    bgColor: "bg-green-500",
    label: "Entregue",
  }
};

const statusTransitions = {
  pendente: ['em_producao'],
  em_producao: ['concluido'],
  concluido: [], // Não permite ir para "entregue" na tela de produção
  // Para bebidas, "concluido" é exibido como "pronto" e não tem próximo status
  entregue: []
};

/**
 * Componente para exibir um item individual de produção
 * Cada item tem seu próprio botão de ação baseado no status atual
 * Bebidas entram automaticamente como "Pronto" (concluído)
 */
const ProductionItem = ({ item, onStatusChange, isFirstItem }) => {
  const currentStatusInfo = statusConfig[item.productionStatus];
  
  // Determinar se é bebida
  const isBeverage = item.isBeverage || 
                     item.category?.name?.toLowerCase().includes('bebida') ||
                     item.product?.name?.toLowerCase().includes('refrigerante') ||
                     item.product?.name?.toLowerCase().includes('suco') ||
                     item.product?.name?.toLowerCase().includes('água');
  
  // Para bebidas, determinar o próximo status baseado no status real, não no exibido
  let nextStatus;
  if (isBeverage && item.productionStatus === "concluido") {
    // Bebidas "concluido" (exibidas como "pronto") NÃO podem ir para "entregue" na tela de produção
    nextStatus = null;
  } else {
    nextStatus = statusTransitions[item.productionStatus]?.[0];
  }
  
  const nextStatusInfo = nextStatus ? statusConfig[nextStatus] : null;

  const handleStatusChange = () => {
    if (nextStatus) {
      onStatusChange(item._id, nextStatus);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Para bebidas, mostrar status especial
  // Bebidas com status "concluido" são exibidas como "pronto" na interface
  const displayStatus = isBeverage && item.productionStatus === "concluido" ? "pronto" : item.productionStatus;
  const statusDisplayInfo = statusConfig[displayStatus] || currentStatusInfo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "p-4 rounded-lg border",
        statusDisplayInfo.color,
        isFirstItem && "border-l-4 border-l-white/30",
        isBeverage && "border-l-4 border-l-blue-400/50"
      )}
    >
      {/* Indicador de grupo */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isBeverage ? (
            <div className="flex items-center space-x-1 text-blue-400 text-xs font-medium">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>BEBIDA</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-orange-400 text-xs font-medium">
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
              <span>LANCHE</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 text-sm font-semibold px-3 py-1 rounded-full ${statusDisplayInfo.color}`}>
          <statusDisplayInfo.icon className="h-4 w-4" />
          <span>
            {isBeverage && item.productionStatus === "concluido" ? "Pronto" : statusDisplayInfo.label}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <p className="font-bold text-white text-lg">
            {item.quantity}x {item.productName}
          </p>
          {item.notes && item.notes !== item.productName && (
            <p className="text-sm text-white/60 mt-1">{item.notes}</p>
          )}
        </div>
      </div>

      {/* Informações de tempo */}
      <div className="flex items-center justify-between text-sm text-white/70 mb-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-3 w-3" />
          <span>
            {isBeverage && item.productionStatus === "concluido" 
              ? "Pronto para entrega" 
              : item.startedAt 
                ? `Iniciado: ${formatTime(item.startedAt)}` 
                : 'Aguardando início'
            }
          </span>
        </div>
        {item.completedAt && !isBeverage && (
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-3 w-3" />
            <span>Concluído: {formatTime(item.completedAt)}</span>
          </div>
        )}
      </div>

      {/* Botão de ação */}
      {nextStatus && (
        <Button 
          onClick={handleStatusChange} 
          className={`w-full ${nextStatusInfo.bgColor} text-white hover:opacity-90 transition-all duration-200`}
        >
          <nextStatusInfo.icon className="h-4 w-4 mr-2" />
          {nextStatus === 'em_producao' && 'Iniciar Produção'}
          {nextStatus === 'concluido' && 'Marcar Concluído'}
        </Button>
      )}

      {/* Botão para reverter status (apenas para lanches em produção ou concluídos) */}
      {!isBeverage && (item.productionStatus === 'em_producao' || item.productionStatus === 'concluido') && (
        <Button 
          onClick={() => onStatusChange(item._id, 'pendente')}
          variant="outline"
          className="w-full mt-2 border-white/30 text-white hover:bg-white/10"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Reverter para Pendente
        </Button>
      )}
    </motion.div>
  );
};

/**
 * Componente principal da tela de produção
 * Gerencia o estado e as operações de produção
 */
const Production = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Buscar dados de produção do Convex
  const productionOrders = useQuery(api.production.listProductionItems) || [];
  const defaultUser = useQuery(api.production.getDefaultUser);
  const startProduction = useMutation(api.production.startProduction);
  const completeProduction = useMutation(api.production.completeProduction);
  const revertStatus = useMutation(api.production.revertProductionStatus);

  /**
   * Função para gerenciar mudanças de status dos itens
   * @param {string} itemId - ID do item de venda
   * @param {string} newStatus - Novo status para o item
   */
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      // Usar usuário padrão se disponível, senão não passar userId
      const userId = defaultUser?._id;
      
      let result;
      
      switch (newStatus) {
        case 'em_producao':
          result = await startProduction({ 
            saleItemId: itemId, 
            ...(userId && { userId }) 
          });
          break;
        case 'concluido':
          result = await completeProduction({ 
            saleItemId: itemId, 
            ...(userId && { userId }) 
          });
          break;
        case 'pendente':
          result = await revertStatus({ 
            saleItemId: itemId, 
            newStatus: 'pendente', 
            ...(userId && { userId }) 
          });
          break;
        default:
          throw new Error('Status inválido');
      }
      
      toast({
        title: "Status atualizado",
        description: `Item movido para ${statusConfig[newStatus]?.label || newStatus}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar status do item: ${error.message || 'Tente novamente'}`,
        variant: "destructive"
      });
    }
  };

  // Filtrar pedidos baseado no termo de busca
  const filteredOrders = productionOrders.filter(order =>
    (order.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
          <p className="text-white/70">Controle o status dos pedidos até "Pronto" - itens prontos somem automaticamente</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <Input
            placeholder="Buscar comanda ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 w-full"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, orderIndex) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: orderIndex * 0.1 }}
              className="w-full"
            >
              <Card className="glass-effect border-white/20 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-lg">
                      {order.notes ? order.notes.replace('Mesa: ', '') : `Pedido ${order._id.slice(-6)}`}
                    </span>
                    <span className="text-sm text-white/70">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-3">
                  {order.items
                    .filter(item => item.productionStatus !== 'entregue')
                    .map((item, itemIndex) => (
                      <ProductionItem 
                        key={item._id} 
                        item={item} 
                        onStatusChange={handleStatusChange}
                        isFirstItem={itemIndex === 0}
                      />
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
              <p className="text-white/70">Todos os pedidos estão prontos ou aguardando novos pedidos da tela de vendas.</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Production;