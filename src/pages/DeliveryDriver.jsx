import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Receipt, Truck, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

/**
 * Configuração dos métodos de pagamento disponíveis
 * Define os métodos de pagamento que o entregador pode registrar
 */
const paymentMethodConfig = {
  money: { name: 'Dinheiro' },
  credit: { name: 'Cartão de Crédito' },
  debit: { name: 'Cartão de Débito' },
  pix: { name: 'PIX' },
};

/**
 * Componente da tela para entregadores
 * Exibe apenas pedidos de Delivery e permite cadastrar o pagamento recebido
 * 
 * @returns {JSX.Element} Componente da tela de entregadores
 */
const DeliveryDriver = () => {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    method: 'money',
    amount: ''
  });
  const [paidAmount, setPaidAmount] = useState('');
  const [changeMethod, setChangeMethod] = useState('money');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  /**
   * Carrega os pedidos e clientes do localStorage
   * Atualiza a cada 3 segundos para manter os dados sincronizados
   */
  useEffect(() => {
    const fetchData = () => {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      
      // Filtra apenas pedidos de Delivery
      const deliveryOrders = savedOrders.filter(order => order.type === 'Delivery');
      setOrders(deliveryOrders);
      setClients(savedClients);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Salva os pedidos atualizados no localStorage
   * 
   * @param {Array} newOrders - Array de pedidos atualizados
   */
  const saveOrders = (newOrders) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedAllOrders = allOrders.map(order => {
      const updatedOrder = newOrders.find(o => o.id === order.id);
      return updatedOrder || order;
    });
    
    // Adiciona novos pedidos que não estavam na lista completa
    newOrders.forEach(newOrder => {
      if (!updatedAllOrders.some(o => o.id === newOrder.id)) {
        updatedAllOrders.push(newOrder);
      }
    });
    
    localStorage.setItem('orders', JSON.stringify(updatedAllOrders));
    setOrders(newOrders.filter(order => order.type === 'Delivery'));
  };

  /**
   * Salva uma venda no localStorage
   * 
   * @param {Object} saleData - Dados da venda a ser salva
   */
  const saveSale = (saleData) => {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push(saleData);
    localStorage.setItem('sales', JSON.stringify(sales));
  };

  /**
   * Adiciona uma entrada no livro caixa
   * 
   * @param {Object} entry - Entrada do livro caixa
   */
  const addCashLedgerEntry = (entry) => {
    const ledger = JSON.parse(localStorage.getItem('cashLedger') || '[]');
    ledger.push({ ...entry, id: Date.now() + Math.random(), createdAt: new Date().toISOString() });
    localStorage.setItem('cashLedger', JSON.stringify(ledger));
  };

  /**
   * Abre o diálogo de pagamento para um pedido específico
   * 
   * @param {Object} order - Pedido selecionado
   */
  const openPaymentDialog = (order) => {
    setSelectedOrder(order);
    setPaymentMethods([]);
    setPaidAmount('');
    setCurrentPayment({ method: 'money', amount: '' });
    setIsPaymentDialogOpen(true);
  };

  /**
   * Calcula o total do pedido selecionado
   * 
   * @returns {number} Valor total do pedido
   */
  const getOrderTotal = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.total || selectedOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  /**
   * Calcula o valor restante a pagar
   * 
   * @returns {number} Valor restante a pagar
   */
  const getRemainingAmount = () => {
    const total = getOrderTotal();
    const paid = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, total - paid);
  };

  /**
   * Calcula o troco a ser devolvido
   * 
   * @returns {number} Valor do troco
   */
  const getChange = () => {
    const total = getOrderTotal();
    const totalPaid = parseFloat(paidAmount) || 0;
    if (totalPaid > total) {
      return totalPaid - total;
    }
    return 0;
  };

  /**
   * Adiciona um método de pagamento à lista
   */
  const addPaymentMethod = () => {
    if (!currentPayment.amount || parseFloat(currentPayment.amount) <= 0) {
      toast({ title: "Erro", description: "Informe um valor válido!", variant: "destructive" });
      return;
    }
    const amount = parseFloat(currentPayment.amount);
    const remaining = getRemainingAmount();
    if (amount > remaining + 0.001) {
      toast({ title: "Erro", description: "Valor maior que o restante a pagar!", variant: "destructive" });
      return;
    }
    setPaymentMethods([...paymentMethods, { id: Date.now(), method: currentPayment.method, amount: amount }]);
    setCurrentPayment({ method: currentPayment.method, amount: '' });
    setPaidAmount((parseFloat(paidAmount) || 0) + amount);
  };

  /**
   * Remove um método de pagamento da lista
   * 
   * @param {number} id - ID do método de pagamento a ser removido
   */
  const removePaymentMethod = (id) => {
    const paymentToRemove = paymentMethods.find(p => p.id === id);
    if (paymentToRemove) {
      setPaidAmount((parseFloat(paidAmount) || 0) - paymentToRemove.amount);
    }
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
  };

  /**
   * Processa o pagamento do pedido
   * Salva a venda e atualiza o status do pedido
   */
  const processPayment = () => {
    if (!selectedOrder) return;
    
    if (paymentMethods.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma forma de pagamento!", variant: "destructive" });
      return;
    }
    
    const totalToPay = getOrderTotal();
    const totalPaidByCustomer = parseFloat(paidAmount) || 0;

    if (totalPaidByCustomer < totalToPay) {
      toast({ title: "Erro", description: "Valor pago insuficiente.", variant: "destructive" });
      return;
    }

    // Salva a venda
    const saleData = {
      id: Date.now(),
      orderId: selectedOrder.id,
      tableNumber: selectedOrder.tableNumber,
      items: selectedOrder.items,
      total: totalToPay,
      paymentMethods: paymentMethods,
      date: new Date().toISOString(),
      operator: 'Entregador',
      type: 'Delivery'
    };
    saveSale(saleData);

    // Adiciona entradas no livro caixa
    paymentMethods.forEach(pm => {
      addCashLedgerEntry({
        orderId: saleData.id,
        method: pm.method,
        type: 'IN',
        value: pm.amount
      });
    });

    // Adiciona saída de troco se houver
    const change = getChange();
    if (change > 0) {
      addCashLedgerEntry({
        orderId: saleData.id,
        method: changeMethod,
        type: 'OUT',
        value: change
      });
    }

    // Atualiza o status do pedido para pago
    const updatedOrders = orders.map(order => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          status: 'paid',
          paymentStatus: 'paid',
          paidAt: new Date().toISOString()
        };
      }
      return order;
    });
    saveOrders(updatedOrders);

    toast({ 
      title: "Pagamento registrado!", 
      description: `Pagamento de R$ ${totalToPay.toFixed(2)} registrado com sucesso.` 
    });
    
    setIsPaymentDialogOpen(false);
    setSelectedOrder(null);
    setPaymentMethods([]);
    setCurrentPayment({ method: 'money', amount: '' });
    setPaidAmount('');
  };

  /**
   * Obtém as informações do cliente do pedido
   * 
   * @param {string|number} clientId - ID do cliente
   * @returns {Object|null} Dados do cliente ou null se não encontrado
   */
  const getClientInfo = (clientId) => {
    return clients.find(c => c.id === clientId);
  };

  /**
   * Filtra os pedidos de acordo com o filtro selecionado
   * 
   * @returns {Array} Array de pedidos filtrados
   */
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending' || !order.status;
    if (filter === 'in_route') return order.status === 'Em rota de entrega';
    if (filter === 'delivered') return order.status === 'Entregue';
    if (filter === 'paid') return order.paymentStatus === 'paid' || order.status === 'paid';
    return true;
  });

  const totalToPay = selectedOrder ? getOrderTotal() : 0;
  const isPaymentReady = paymentMethods.length > 0 && (parseFloat(paidAmount) || 0) >= totalToPay;

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Entregadores
          </h1>
          <p className="text-muted-foreground">Gerencie pedidos de delivery e registre pagamentos recebidos</p>
        </div>
      </motion.div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-5">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="in_route">Em Rota</TabsTrigger>
          <TabsTrigger value="delivered">Entregues</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order, index) => {
          const client = order.clientId ? getClientInfo(order.clientId) : null;
          const isPaid = order.paymentStatus === 'paid' || order.status === 'paid';
          
          return (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-foreground flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Delivery #{order.id.toString().slice(-4)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="font-semibold text-foreground">{order.status || 'Pendente'}</span>
                    </p>
                    {isPaid && (
                      <p className="text-sm text-green-400 font-semibold">✓ Pagamento Registrado</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {client && (
                    <div className="p-3 rounded-lg bg-accent space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{client.name}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>{order.deliveryAddress}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map(item => (
                      <p key={item.itemId} className="text-sm text-muted-foreground">
                        {item.quantity}x {item.name}
                      </p>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        ... e mais {order.items.length - 3} itens.
                      </p>
                    )}
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="text-lg font-bold text-green-400">
                      Total: R$ {order.total.toFixed(2)}
                    </p>
                  </div>
                </CardContent>
                <CardContent className="flex flex-col gap-2">
                  {!isPaid && (
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600" 
                      onClick={() => openPaymentDialog(order)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Registrar Pagamento
                    </Button>
                  )}
                  {isPaid && (
                    <div className="w-full p-3 rounded-lg bg-green-500/20 text-green-400 text-center font-semibold">
                      Pagamento já registrado
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="col-span-full text-center py-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.2 }}
          >
            <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">Não há pedidos de delivery com o filtro selecionado.</p>
          </motion.div>
        </div>
      )}

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="glass-effect max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Registrar Pagamento - Delivery #{selectedOrder?.id.toString().slice(-4)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              {getClientInfo(selectedOrder.clientId) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground text-lg">Informações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground font-semibold">{getClientInfo(selectedOrder.clientId).name}</span>
                    </div>
                    {getClientInfo(selectedOrder.clientId).phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{getClientInfo(selectedOrder.clientId).phone}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>{selectedOrder.deliveryAddress}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Itens do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map(item => (
                    <div key={item.itemId} className="flex justify-between p-2 rounded bg-accent/50">
                      <p className="text-foreground">{item.quantity}x {item.name}</p>
                      <p className="text-green-400">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </CardContent>
                <CardContent className="border-t border-border pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-green-400">R$ {totalToPay.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Formas de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={currentPayment.method} onValueChange={(value) => setCurrentPayment({ ...currentPayment, method: value })}>
                    <TabsList className="grid w-full grid-cols-4 bg-accent">
                      {Object.entries(paymentMethodConfig).map(([key, { name }]) => (
                        <TabsTrigger 
                          key={key} 
                          value={key} 
                          className="text-muted-foreground data-[state=active]:text-foreground flex flex-col h-auto py-2 gap-1"
                        >
                          <span className="text-xs">{name}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={currentPayment.amount} 
                      onChange={(e) => setCurrentPayment({ ...currentPayment, amount: e.target.value })} 
                      placeholder="Valor" 
                    />
                    <Button onClick={addPaymentMethod} className="btn-gradient">Adicionar</Button>
                  </div>
                  {paymentMethods.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground">Pagamentos Adicionados:</Label>
                      {paymentMethods.map((payment) => {
                        const config = paymentMethodConfig[payment.method] || { name: payment.method };
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-2 rounded bg-accent">
                            <span className="text-foreground">{config.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400 font-bold">R$ {payment.amount.toFixed(2)}</span>
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
                        );
                      })}
                    </div>
                  )}
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-foreground">
                      <span>Total a Pagar:</span>
                      <span>R$ {totalToPay.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount" className="text-foreground">Valor Recebido do Cliente</Label>
                      <Input 
                        id="paidAmount" 
                        type="number" 
                        step="0.01" 
                        value={paidAmount} 
                        onChange={(e) => setPaidAmount(e.target.value)} 
                        placeholder="Ex: 50.00" 
                      />
                    </div>
                    {getChange() > 0 && (
                      <>
                        <div className="flex justify-between text-lg font-bold text-blue-400">
                          <span>Troco a devolver:</span>
                          <span>R$ {getChange().toFixed(2)}</span>
                        </div>
                        <div>
                          <Label htmlFor="changeMethod" className="text-foreground">Troco em:</Label>
                          <Tabs value={changeMethod} onValueChange={setChangeMethod}>
                            <TabsList className="grid w-full grid-cols-4 bg-accent">
                              {Object.entries(paymentMethodConfig).map(([key, { name }]) => (
                                <TabsTrigger 
                                  key={key} 
                                  value={key} 
                                  className="text-muted-foreground data-[state=active]:text-foreground flex flex-col h-auto py-2 gap-1"
                                >
                                  <span className="text-xs">{name}</span>
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </Tabs>
                        </div>
                      </>
                    )}
                  </div>
                  <Button 
                    onClick={processPayment} 
                    disabled={!isPaymentReady} 
                    className="w-full btn-gradient text-lg h-12"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar Pagamento
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryDriver;


