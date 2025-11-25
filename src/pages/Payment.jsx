
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

const paymentMethodConfig = {
  money: { name: 'Dinheiro' },
  credit: { name: 'Crédito' },
  debit: { name: 'Débito' },
  pix: { name: 'PIX' },
  meal_voucher: { name: 'VR/VA' },
};

const Payment = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    method: 'money',
    amount: ''
  });
  const [paidAmount, setPaidAmount] = useState('');
  const [changeMethod, setChangeMethod] = useState('money');

  useEffect(() => {
    const fetchOrders = () => {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      setOrders(savedOrders.filter(order => order.status === 'Pendente'));
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000); // Poll for new orders
    return () => clearInterval(interval);
  }, []);

  const saveOrders = (newOrders) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedAllOrders = allOrders.map(order => {
      const updatedOrder = newOrders.find(o => o.id === order.id);
      return updatedOrder || order;
    }).filter(order => {
      const isStillPending = newOrders.some(o => o.id === order.id && o.status === 'Pendente');
      const wasNotPending = !orders.some(o => o.id === order.id);
      return isStillPending || (wasNotPending && order.status !== 'Pendente');
    });

    const finalOrders = [...newOrders.filter(o => o.status === 'Pendente')];
    allOrders.forEach(oldOrder => {
      if (oldOrder.status !== 'Pendente' && !finalOrders.some(o => o.id === oldOrder.id)) {
        finalOrders.push(oldOrder);
      }
    });

    localStorage.setItem('orders', JSON.stringify(finalOrders));
    setOrders(newOrders.filter(o => o.status === 'Pendente'));
  };

  const saveSale = (saleData) => {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push(saleData);
    localStorage.setItem('sales', JSON.stringify(sales));
  };

  const addCashLedgerEntry = (entry) => {
    const ledger = JSON.parse(localStorage.getItem('cashLedger') || '[]');
    ledger.push({ ...entry, id: Date.now() + Math.random(), createdAt: new Date().toISOString() });
    localStorage.setItem('cashLedger', JSON.stringify(ledger));
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setSelectedItems(order.items.map(item => ({ ...item, selected: true })));
    setPaymentMethods([]);
    setPaidAmount('');
    setCurrentPayment({ method: 'money', amount: '' });
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(selectedItems.map(item =>
      item.itemId === itemId ? { ...item, selected: !item.selected } : item
    ));
  };

  const getSelectedTotal = () => {
    return selectedItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getRemainingAmount = () => {
    const total = getSelectedTotal();
    const paid = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, total - paid);
  };

  const getChange = () => {
    const total = getSelectedTotal();
    const totalPaid = parseFloat(paidAmount) || 0;
    if (totalPaid > total) {
      return totalPaid - total;
    }
    return 0;
  };

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
    setPaidAmount( (parseFloat(paidAmount) || 0) + amount );
  };

  const removePaymentMethod = (id) => {
    const paymentToRemove = paymentMethods.find(p => p.id === id);
    if (paymentToRemove) {
      setPaidAmount( (parseFloat(paidAmount) || 0) - paymentToRemove.amount );
    }
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
  };

  const processPayment = () => {
    const selectedItemsOnly = selectedItems.filter(item => item.selected);
    if (selectedItemsOnly.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um item para pagamento!", variant: "destructive" });
      return;
    }
    if (paymentMethods.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma forma de pagamento!", variant: "destructive" });
      return;
    }
    
    const totalToPay = getSelectedTotal();
    const totalPaidByCustomer = parseFloat(paidAmount) || 0;

    if (totalPaidByCustomer < totalToPay) {
      toast({ title: "Erro", description: "Valor pago insuficiente.", variant: "destructive" });
      return;
    }

    const saleData = {
      id: Date.now(),
      orderId: selectedOrder.id,
      tableNumber: selectedOrder.tableNumber,
      items: selectedItemsOnly,
      total: totalToPay,
      paymentMethods: paymentMethods,
      date: new Date().toISOString(),
      operator: selectedOrder.operator
    };
    saveSale(saleData);

    paymentMethods.forEach(pm => {
      addCashLedgerEntry({
        orderId: saleData.id,
        method: pm.method,
        type: 'IN',
        value: pm.amount
      });
    });

    const change = getChange();
    if (change > 0) {
      addCashLedgerEntry({
        orderId: saleData.id,
        method: changeMethod,
        type: 'OUT',
        value: change
      });
    }

    const remainingItems = selectedItems.filter(item => !item.selected);
    let updatedOrders;
    if (remainingItems.length === 0) {
      updatedOrders = orders.filter(order => order.id !== selectedOrder.id);
    } else {
      const updatedOrder = {
        ...selectedOrder,
        items: remainingItems,
        total: remainingItems.reduce((total, item) => total + (item.price * item.quantity), 0)
      };
      updatedOrders = orders.map(order => order.id === selectedOrder.id ? updatedOrder : order);
    }
    saveOrders(updatedOrders);

    toast({ title: "Pagamento processado!", description: `Pagamento de R$ ${totalToPay.toFixed(2)} realizado com sucesso.` });
    setSelectedOrder(null);
    setSelectedItems([]);
    setPaymentMethods([]);
    setCurrentPayment({ method: 'money', amount: '' });
    setPaidAmount('');
  };

  const totalToPay = selectedOrder ? getSelectedTotal() : 0;
  const isPaymentReady = paymentMethods.length > 0 && (parseFloat(paidAmount) || 0) >= totalToPay;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-2">Pagamentos</h1>
          <p className="text-muted-foreground">Selecione um pedido para processar o pagamento</p>
        </motion.div>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {orders.map((order, index) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className={`glass-effect card-hover cursor-pointer ${selectedOrder?.id === order.id ? 'ring-2 ring-primary' : ''}`} onClick={() => selectOrder(order)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{order.tableNumber || `Delivery #${order.id.toString().slice(-4)}`}</h3>
                      <p className="text-muted-foreground text-sm">{new Date(order.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">R$ {order.total.toFixed(2)}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Pendente</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {order.items.slice(0, 2).map((item) => <p key={item.itemId} className="text-muted-foreground text-sm">{item.quantity}x {item.name}</p>)}
                    {order.items.length > 2 && <p className="text-muted-foreground text-sm">+{order.items.length - 2} itens...</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {orders.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum pedido pendente</h3>
            <p className="text-muted-foreground">Todos os pedidos foram pagos ou não há pedidos criados.</p>
          </motion.div>
        )}
      </div>
      <div className="space-y-6">
        {selectedOrder ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <Card className="glass-effect">
              <CardHeader><CardTitle className="text-foreground">Itens - {selectedOrder.tableNumber || `Delivery #${selectedOrder.id.toString().slice(-4)}`}</CardTitle></CardHeader>
              <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div key={item.itemId} className={`p-3 rounded-lg border cursor-pointer transition-all ${item.selected ? 'bg-primary/20 border-primary/50' : 'bg-accent/50 border-border'}`} onClick={() => toggleItemSelection(item.itemId)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.selected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>{item.selected && <Check className="h-4 w-4 text-primary-foreground" />}</div>
                          <h4 className="text-foreground font-medium">{item.name}</h4>
                        </div>
                        {item.notes && <p className="text-muted-foreground text-sm ml-8">Obs: {item.notes}</p>}
                        <p className="text-muted-foreground text-sm ml-8">Qtd: {item.quantity}</p>
                      </div>
                      <span className="text-green-400 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
              <CardContent className="border-t border-border pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-foreground">Total Selecionado:</span>
                  <span className="text-green-400">R$ {getSelectedTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardHeader><CardTitle className="text-foreground">Formas de Pagamento</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={currentPayment.method} onValueChange={(value) => setCurrentPayment({ ...currentPayment, method: value })}>
                  <TabsList className="grid w-full grid-cols-5 bg-accent">
                    {Object.entries(paymentMethodConfig).map(([key, { name }]) => (
                      <TabsTrigger key={key} value={key} className="text-muted-foreground data-[state=active]:text-foreground flex flex-col h-auto py-2 gap-1">
                        <span className="text-xs">{name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" value={currentPayment.amount} onChange={(e) => setCurrentPayment({ ...currentPayment, amount: e.target.value })} placeholder="Valor" />
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
                            <Button variant="ghost" size="sm" onClick={() => removePaymentMethod(payment.id)} className="text-red-400 hover:bg-red-500/10 p-1"><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-foreground"><span>Total a Pagar:</span><span>R$ {totalToPay.toFixed(2)}</span></div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount" className="text-foreground">Valor Pago pelo Cliente</Label>
                    <Input id="paidAmount" type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Ex: 50.00" />
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
                          <TabsList className="grid w-full grid-cols-5 bg-accent">
                            {Object.entries(paymentMethodConfig).map(([key, { name }]) => (
                              <TabsTrigger key={key} value={key} className="text-muted-foreground data-[state=active]:text-foreground flex flex-col h-auto py-2 gap-1">
                                <span className="text-xs">{name}</span>
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>
                    </>
                  )}
                </div>
                <Button onClick={processPayment} disabled={!isPaymentReady} className="w-full btn-gradient text-lg h-12">Processar Pagamento</Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">👈</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Selecione um pedido</h3>
            <p className="text-muted-foreground">Escolha um pedido da lista ao lado para processar o pagamento.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Payment;
