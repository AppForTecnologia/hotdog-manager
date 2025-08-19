import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, Smartphone, DollarSign, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const Payment = () => {
  const orders = useQuery(api.sales.listByStatus, { status: "pendente" }) || [];
  const updateSaleStatus = useMutation(api.sales.updateStatus);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    method: 'money',
    amount: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const selectOrder = async (order) => {
    // Buscar os itens da venda
    const items = await fetch(api.sales.getSaleItems, { saleId: order._id });
    
    setSelectedOrder(order);
    setSelectedItems(items || []);
    setPaymentMethods([]);
  };

  const getSelectedTotal = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.total;
  };

  const getRemainingAmount = () => {
    const total = getSelectedTotal();
    const paid = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, total - paid);
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

  const getPaymentMethodIcon = (method) => {
    const icons = {
      money: Banknote,
      credit: CreditCard,
      debit: CreditCard,
      pix: Smartphone
    };
    const Icon = icons[method] || DollarSign;
    return <Icon className="h-4 w-4" />;
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
        description: "Valor pago é menor que o total!",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Atualizar status da venda para "paga"
      await updateSaleStatus({
        id: selectedOrder._id,
        status: "paga"
      });

      toast({
        title: "Pagamento processado!",
        description: `Pagamento de R$ ${getSelectedTotal().toFixed(2)} realizado com sucesso.`
      });

      // Reset state
      setSelectedOrder(null);
      setSelectedItems([]);
      setPaymentMethods([]);
      setCurrentPayment({ method: 'money', amount: '' });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Orders List */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">Pagamentos</h1>
          <p className="text-white/70">Selecione um pedido para processar o pagamento</p>
        </motion.div>

        <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                        Pendente
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

        {orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum pedido pendente
            </h3>
            <p className="text-white/60">
              Todos os pedidos foram pagos ou não há pedidos criados.
            </p>
          </motion.div>
        )}
      </div>

      {/* Payment Processing */}
      <div className="space-y-6">
        {selectedOrder ? (
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

            {/* Payment Methods */}
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Formas de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={currentPayment.method} onValueChange={(value) => 
                  setCurrentPayment({ ...currentPayment, method: value })
                }>
                  <TabsList className="grid w-full grid-cols-4 bg-white/10">
                    <TabsTrigger value="money" className="text-white">
                      <Banknote className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="text-white">
                      <CreditCard className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="debit" className="text-white">
                      <CreditCard className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="pix" className="text-white">
                      <Smartphone className="h-4 w-4" />
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
                          {getPaymentMethodIcon(payment.method)}
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
                    <span>Total a Pagar:</span>
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
                  disabled={getRemainingAmount() > 0 || paymentMethods.length === 0 || isProcessing}
                  className="w-full btn-gradient"
                >
                  {isProcessing ? "Processando..." : "Processar Pagamento"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">👈</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Selecione um pedido
            </h3>
            <p className="text-white/60">
              Escolha um pedido da lista ao lado para processar o pagamento.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Payment;