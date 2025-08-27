import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const Payment = () => {
  const orders = useQuery(api.sales.listByStatus, { status: "pendente" }) || [];
  const updateSaleStatus = useMutation(api.sales.updateStatus);
  const updatePaymentAndStatus = useMutation(api.sales.updatePaymentAndStatus);
  const processPaymentWithMethods = useMutation(api.sales.processPaymentWithMethods);
  const payItem = useMutation(api.sales.payItem);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    method: 'money',
    amount: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Hook para buscar os itens da venda selecionada com status de pagamento
  const saleItems = useQuery(
    api.sales.getSaleItemsWithPaymentStatus, 
    selectedOrder ? { saleId: selectedOrder._id } : "skip"
  ) || [];

  // Função para selecionar um pedido
  const selectOrder = (order) => {
    setSelectedOrder(order);
    setPaymentMethods([]);
    setCurrentPayment({ method: 'money', amount: '' });
    // Inicialmente selecionar apenas itens pendentes
    if (saleItems.length > 0) {
      const pendingItemIds = saleItems
        .filter(item => item.paymentStatus === 'pendente')
        .map(item => item._id);
      setSelectedItems(new Set(pendingItemIds));
    }
  };

  // Atualizar itens quando saleItems mudar
  useEffect(() => {
    if (saleItems && saleItems.length > 0 && selectedOrder) {
      // Inicialmente selecionar apenas itens pendentes
      const pendingItemIds = saleItems
        .filter(item => item.paymentStatus === 'pendente')
        .map(item => item._id);
      setSelectedItems(new Set(pendingItemIds));
    }
  }, [saleItems, selectedOrder]);

  // Calcular total dos itens selecionados
  const getSelectedTotal = () => {
    if (!selectedOrder || selectedItems.size === 0) return 0;
    
    return saleItems
      .filter(item => selectedItems.has(item._id))
      .reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getRemainingAmount = () => {
    const total = getSelectedTotal();
    const paid = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, total - paid);
  };

  const handleItemSelection = (itemId, isChecked) => {
    const newSelectedItems = new Set(selectedItems);
    if (isChecked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  const addPaymentMethod = () => {
    if (!currentPayment.amount || parseFloat(currentPayment.amount) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido!",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(currentPayment.amount);
    const remaining = getRemainingAmount();

    if (amount > remaining) {
      toast({
        title: "Erro",
        description: "Valor maior que o restante a pagar!",
        variant: "destructive"
      });
      return;
    }

    setPaymentMethods([...paymentMethods, {
      id: Date.now(),
      method: currentPayment.method,
      amount: amount
    }]);

    setCurrentPayment({ method: 'money', amount: '' });
  };

  const removePaymentMethod = (id) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      money: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX'
    };
    return methods[method] || method;
  };

  const processPayment = async () => {
    if (!selectedOrder) {
      toast({
        title: "Erro",
        description: "Selecione um pedido!",
        variant: "destructive"
      });
      return;
    }

    if (selectedItems.size === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um item!",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethods.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma forma de pagamento!",
        variant: "destructive"
      });
      return;
    }

    if (getRemainingAmount() > 0) {
      toast({
        title: "Erro",
        description: "Valor pago é menor que o total selecionado!",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Calcular valor por item (distribuir proporcionalmente)
      const selectedItemsList = saleItems.filter(item => selectedItems.has(item._id));
      const totalSelected = selectedItemsList.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Pagar cada item selecionado proporcionalmente
      for (const item of selectedItemsList) {
        const itemProportion = item.subtotal / totalSelected;
        const itemPaymentAmount = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0) * itemProportion;
        
        if (itemPaymentAmount > 0) {
          await payItem({
            saleItemId: item._id,
            paymentMethod: paymentMethods[0].method, // Usar o primeiro método
            amount: itemPaymentAmount,
            customerName: undefined,
          });
        }
      }

      toast({
        title: "Pagamento processado!",
        description: `Pagamento de R$ ${getSelectedTotal().toFixed(2)} realizado com sucesso.`
      });

      // Reset state
      setSelectedOrder(null);
      setSelectedItems(new Set());
      setPaymentMethods([]);
      setCurrentPayment({ method: 'money', amount: '' });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Formatar a data da venda
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extrair número da mesa das notas
  const getTableNumber = (notes) => {
    if (!notes) return "Sem mesa";
    const match = notes.match(/Mesa:\s*(.+)/);
    return match ? match[1] : notes;
  };

  return (
    <div className={orders.length === 0 ? "flex items-center justify-center min-h-[60vh]" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum pedido pendente
          </h3>
          <p className="text-white/60">
            Todos os pedidos foram pagos ou não há pedidos criados.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Orders List */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">Pagamentos</h1>
              <p className="text-white/70">Selecione um pedido para processar o pagamento</p>
            </motion.div>

            <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide p-1">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`glass-effect border-white/20 card-hover cursor-pointer ${
                      selectedOrder?._id === order._id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => selectOrder(order)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-white">
                            Mesa: {getTableNumber(order.notes)}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {formatDate(order.saleDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">R$ {order.total.toFixed(2)}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            order.status === 'parcialmente_paga' 
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {order.status === 'parcialmente_paga' ? 'Parcialmente Pago' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm">
                          Pedido #{order._id.slice(-6)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Payment Processing */}
          <div className="space-y-6">
            {selectedOrder && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Order Details */}
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Detalhes do Pedido - Mesa {getTableNumber(selectedOrder.notes)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>Pedido:</span>
                    <span>#{selectedOrder._id.slice(-6)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Data:</span>
                    <span>{formatDate(selectedOrder.saleDate)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-white/70">
                      <span>Desconto:</span>
                      <span className="text-red-400">-R$ {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-white/20 pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-green-400">R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seleção de Itens para Pagar */}
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">🎯 Selecionar Itens para Pagar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {saleItems.map((item) => {
                    const isPaid = item.paymentStatus === 'pago';
                    const isPartial = item.paymentStatus === 'parcial';
                    const isPending = item.paymentStatus === 'pendente';
                    
                    return (
                      <div 
                        key={item._id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          isPaid 
                            ? 'border-green-500 bg-green-500/10 opacity-60' 
                            : isPartial
                            ? 'border-yellow-500 bg-yellow-500/10'
                            : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {isPending ? (
                          <Checkbox
                            checked={selectedItems.has(item._id)}
                            onCheckedChange={(checked) => handleItemSelection(item._id, checked)}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                        ) : (
                          <div className="w-4 h-4 flex items-center justify-center">
                            {isPaid ? (
                              <span className="text-green-500 text-lg">✓</span>
                            ) : (
                              <span className="text-yellow-500 text-lg">⏳</span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.productName}</h4>
                          <p className="text-white/60 text-sm">
                            Qtd: {item.quantity} x R$ {item.unitPrice.toFixed(2)}
                          </p>
                          {item.amountPaid > 0 && (
                            <p className="text-green-400 text-sm">
                              Já pago: R$ {item.amountPaid.toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold ${
                            isPaid ? 'text-green-500' : 
                            isPartial ? 'text-yellow-500' : 
                            'text-white'
                          }`}>
                            {item.paymentStatus.toUpperCase()}
                          </p>
                          <p className="text-white font-bold">R$ {item.subtotal.toFixed(2)}</p>
                          {item.amountPaid < item.subtotal && (
                            <p className="text-red-400 text-sm">
                              Resta: R$ {(item.subtotal - item.amountPaid).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total Selecionado */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-400" />
                      <span className="text-white font-medium">💰 Total Selecionado:</span>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-400">
                        R$ {getSelectedTotal().toFixed(2)}
                      </p>
                      <p className="text-blue-300 text-sm">
                        {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selecionado{selectedItems.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Formas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={currentPayment.method} onValueChange={(value) => 
                  setCurrentPayment({ ...currentPayment, method: value })
                }>
                  <TabsList className="grid w-full grid-cols-4 bg-white/10 h-12">
                    <TabsTrigger value="money" className="text-white data-[state=active]:bg-white/20 h-full">
                      Dinheiro
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="text-white data-[state=active]:bg-white/20 h-full">
                      Crédito
                    </TabsTrigger>
                    <TabsTrigger value="debit" className="text-white data-[state=active]:bg-white/20 h-full">
                      Débito
                    </TabsTrigger>
                    <TabsTrigger value="pix" className="text-white data-[state=active]:bg-white/20 h-full">
                      PIX
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={currentPayment.amount}
                    onChange={(e) => setCurrentPayment({ ...currentPayment, amount: e.target.value })}
                    placeholder="Valor"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <Button onClick={addPaymentMethod} className="btn-gradient">
                    Adicionar
                  </Button>
                </div>

                {paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Pagamentos Adicionados:</Label>
                    {paymentMethods.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                        <div className="flex items-center space-x-2">
                          <span className="text-white">{getPaymentMethodName(payment.method)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-400 font-bold">
                            R$ {payment.amount.toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaymentMethod(payment.id)}
                            className="text-red-400 hover:bg-red-500/10 p-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/20 pt-3 space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Total Selecionado:</span>
                    <span>R$ {getSelectedTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Total Pago:</span>
                    <span>R$ {paymentMethods.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Restante:</span>
                    <span className={getRemainingAmount() > 0 ? 'text-red-400' : 'text-green-400'}>
                      R$ {getRemainingAmount().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={processPayment}
                  disabled={getRemainingAmount() > 0 || paymentMethods.length === 0 || isProcessing || selectedItems.size === 0}
                  className="w-full btn-gradient"
                >
                  {isProcessing ? "Processando..." : "Processar Pagamento"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
          </div>
        </>
      )}
    </div>
  );
};

export default Payment;