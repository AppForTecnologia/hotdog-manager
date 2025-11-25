import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Trash2, GlassWater, Search, UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Configuração dos métodos de pagamento disponíveis
 * Define os métodos de pagamento que podem ser utilizados
 * Inclui nome completo e iniciais para exibição em diferentes telas
 */
const paymentMethodConfig = {
  money: { name: 'Dinheiro', initials: 'D' },
  credit: { name: 'Cartão de Crédito', initials: 'CC' },
  debit: { name: 'Cartão de Débito', initials: 'CD' },
  pix: { name: 'PIX', initials: 'PIX' },
  meal_voucher: { name: 'VR/VA', initials: 'VR' },
};

const Sales = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [orderType, setOrderType] = useState('Local');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  // Estados para controle de pagamento em Delivery
  const [deliveryPaymentOption, setDeliveryPaymentOption] = useState(null); // 'paid' ou 'on_delivery'
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [currentPayment, setCurrentPayment] = useState({
    method: 'money',
    amount: ''
  });
  const [paidAmount, setPaidAmount] = useState('');
  const [changeMethod, setChangeMethod] = useState('money');

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const savedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    setProducts(savedProducts);
    setOrders(savedOrders);
    setCategories(savedCategories);
    setClients(savedClients);
    setActiveTab('all');
  }, []);

  const saveOrders = (newOrders) => {
    localStorage.setItem('orders', JSON.stringify(newOrders));
    setOrders(newOrders);
  };

  /**
   * Manipula a mudança de tipo de pedido (Local/Delivery)
   * Reseta os estados relacionados quando o tipo muda
   * 
   * @param {string} type - Tipo do pedido ('Local' ou 'Delivery')
   */
  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === 'Local') {
      setSelectedClient(null);
      setClientSearch('');
      setDeliveryPaymentOption(null);
      resetPaymentState();
    } else {
      setTableNumber('');
      setDeliveryPaymentOption(null);
      resetPaymentState();
    }
  };

  /**
   * Reseta todos os estados relacionados ao pagamento
   */
  const resetPaymentState = () => {
    setPaymentMethods([]);
    setCurrentPayment({ method: 'money', amount: '' });
    setPaidAmount('');
    setChangeMethod('money');
  };

  const addToOrder = (product) => {
    setSelectedProduct(product);
    setIsOrderDialogOpen(true);
  };

  const confirmAddToOrder = () => {
    if (!selectedProduct) return;
    const existingItem = currentOrder.find(item => item.id === selectedProduct.id && item.notes === itemNotes);
    if (existingItem) {
      setCurrentOrder(currentOrder.map(item => item.id === selectedProduct.id && item.notes === itemNotes ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCurrentOrder([...currentOrder, { ...selectedProduct, quantity: 1, notes: itemNotes, itemId: Date.now() }]);
    }
    setIsOrderDialogOpen(false);
    setItemNotes('');
    setSelectedProduct(null);
    toast({ title: "Item adicionado!", description: `${selectedProduct.name} foi adicionado ao pedido.` });
  };

  const updateQuantity = (itemId, change) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.itemId === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(currentOrder.filter(item => item.itemId !== itemId));
  };

  /**
   * Calcula o total do pedido atual
   * 
   * @returns {number} Valor total do pedido
   */
  const getTotalOrder = () => currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);

  /**
   * Calcula o valor restante a pagar
   * 
   * @returns {number} Valor restante a pagar
   */
  const getRemainingAmount = () => {
    const total = getTotalOrder();
    const paid = paymentMethods.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, total - paid);
  };

  /**
   * Calcula o troco a ser devolvido
   * 
   * @returns {number} Valor do troco
   */
  const getChange = () => {
    const total = getTotalOrder();
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
   * Processa o pagamento antes de finalizar o pedido
   * 
   * @returns {boolean} Retorna true se o pagamento foi processado com sucesso
   */
  const processPaymentBeforeOrder = () => {
    if (paymentMethods.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos uma forma de pagamento!", variant: "destructive" });
      return false;
    }
    
    const totalToPay = getTotalOrder();
    const totalPaidByCustomer = parseFloat(paidAmount) || 0;

    if (totalPaidByCustomer < totalToPay) {
      toast({ title: "Erro", description: "Valor pago insuficiente.", variant: "destructive" });
      return false;
    }

    // Salva a venda
    const saleData = {
      id: Date.now(),
      orderId: null, // Será atualizado quando o pedido for criado
      tableNumber: null,
      items: currentOrder,
      total: totalToPay,
      paymentMethods: paymentMethods,
      date: new Date().toISOString(),
      operator: 'Operador 1',
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

    return true;
  };

  /**
   * Finaliza o pedido, processando pagamento se necessário
   */
  const finalizeOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um item ao pedido!", variant: "destructive" });
      return;
    }
    if (orderType === 'Local' && !tableNumber) {
      toast({ title: "Erro", description: "Informe o número da mesa/comanda!", variant: "destructive" });
      return;
    }
    if (orderType === 'Delivery' && !selectedClient) {
      toast({ title: "Erro", description: "Selecione um cliente para delivery!", variant: "destructive" });
      return;
    }
    if (orderType === 'Delivery' && !selectedClient.address) {
      toast({ title: "Erro", description: "Adicione um endereço ao cliente para Delivery.", variant: "destructive" });
      return;
    }
    if (orderType === 'Delivery' && !deliveryPaymentOption) {
      toast({ title: "Erro", description: "Selecione se o pagamento foi realizado ou será na entrega!", variant: "destructive" });
      return;
    }

    // Se for Delivery e foi selecionado "Pago", processa o pagamento primeiro
    if (orderType === 'Delivery' && deliveryPaymentOption === 'paid') {
      if (!processPaymentBeforeOrder()) {
        return; // Se o pagamento falhou, não cria o pedido
      }
    }

    const newOrder = {
      id: Date.now(),
      type: orderType,
      tableNumber: orderType === 'Local' ? tableNumber : null,
      clientId: orderType === 'Delivery' ? selectedClient.id : null,
      deliveryAddress: orderType === 'Delivery' ? selectedClient.address : null,
      items: currentOrder,
      total: getTotalOrder(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      operator: 'Operador 1',
      paymentStatus: orderType === 'Delivery' && deliveryPaymentOption === 'paid' ? 'paid' : 'pending',
      paymentOption: orderType === 'Delivery' ? deliveryPaymentOption : null
    };

    const recipientName = orderType === 'Local' ? tableNumber : selectedClient.name;
    saveOrders([...orders, newOrder]);
    setCurrentOrder([]);
    setTableNumber('');
    setSelectedClient(null);
    setClientSearch('');
    resetPaymentState();
    setDeliveryPaymentOption(null);
    
    const paymentMessage = orderType === 'Delivery' && deliveryPaymentOption === 'paid' 
      ? ' com pagamento já processado' 
      : '';
    toast({ title: "Pedido criado!", description: `Pedido para ${recipientName} foi enviado para produção${paymentMessage}.` });
  };

  const filteredProducts = products.filter(product => activeTab === 'all' || product.categoryId === parseInt(activeTab));
  const beverageCategory = categories.find(c => c.name.toLowerCase() === 'bebidas');
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone && c.phone.includes(clientSearch)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-2">Vendas</h1>
          <p className="text-muted-foreground">Selecione os produtos para criar um pedido</p>
        </motion.div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(cat => <TabsTrigger key={cat.id} value={cat.id.toString()}>{cat.name}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="glass-effect card-hover cursor-pointer" onClick={() => addToOrder(product)}>
                <CardContent className="p-4 flex items-center space-x-4">
                  {product.image ? <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg" /> : <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center"><span className="text-3xl">{product.categoryId === beverageCategory?.id ? <GlassWater /> : '🌭'}</span></div>}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                    <p className="text-green-400 font-bold">R$ {product.price.toFixed(2)}</p>
                  </div>
                  <Button className="btn-gradient" size="sm"><Plus className="h-4 w-4" /></Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {filteredProducts.length === 0 && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12"><div className="text-6xl mb-4">📦</div><h3 className="text-xl font-semibold text-foreground mb-2">Nenhum produto nesta categoria</h3><p className="text-muted-foreground">Selecione outra categoria ou cadastre novos produtos.</p></motion.div>}
      </div>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center"><ShoppingCart className="h-5 w-5 mr-2" />Pedido Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={orderType} onValueChange={handleOrderTypeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="Local">Local</TabsTrigger><TabsTrigger value="Delivery">Delivery</TabsTrigger></TabsList>
              </Tabs>
              {orderType === 'Local' ? (
                <div>
                  <Label htmlFor="table" className="text-foreground">Mesa/Comanda</Label>
                  <Input id="table" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Ex: Mesa 5" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Cliente para Delivery</Label>
                    {selectedClient ? (
                      <div className="p-3 rounded-lg bg-accent/50 flex justify-between items-center">
                        <p className="text-foreground">{selectedClient.name}</p>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setDeliveryPaymentOption(null); resetPaymentState(); }}>Trocar</Button>
                      </div>
                    ) : (
                      <div>
                        <Input placeholder="Buscar por nome ou telefone" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                        <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                          {clientSearch && filteredClients.map(c => (
                            <div key={c.id} className="p-2 rounded hover:bg-accent cursor-pointer" onClick={() => { setSelectedClient(c); setClientSearch(''); }}>
                              <p>{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.phone}</p>
                            </div>
                          ))}
                        </div>
                        {clients.length === 0 && <Button variant="outline" className="w-full mt-2" onClick={() => navigate('/clients')}><UserPlus className="h-4 w-4 mr-2" />Cadastrar Cliente</Button>}
                      </div>
                    )}
                  </div>
                  {selectedClient && (
                    <div>
                      <Label className="text-foreground mb-2 block">Status do Pagamento</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={deliveryPaymentOption === 'paid' ? 'default' : 'outline'}
                          className={deliveryPaymentOption === 'paid' ? 'bg-green-500 hover:bg-green-600' : ''}
                          onClick={() => {
                            setDeliveryPaymentOption('paid');
                            resetPaymentState();
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Pago
                        </Button>
                        <Button
                          variant={deliveryPaymentOption === 'on_delivery' ? 'default' : 'outline'}
                          className={deliveryPaymentOption === 'on_delivery' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                          onClick={() => {
                            setDeliveryPaymentOption('on_delivery');
                            resetPaymentState();
                          }}
                        >
                          Na Entrega
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                {currentOrder.map((item) => <div key={item.itemId} className="p-3 rounded-lg bg-accent/50"><div className="flex justify-between items-start mb-2"><div className="flex-1"><h4 className="text-foreground font-medium">{item.name}</h4>{item.notes && <p className="text-muted-foreground text-sm">Obs: {item.notes}</p>}</div><Button variant="ghost" size="sm" onClick={() => removeFromOrder(item.itemId)} className="text-red-400 hover:bg-red-500/10 p-1"><Trash2 className="h-4 w-4" /></Button></div><div className="flex justify-between items-center"><div className="flex items-center space-x-2"><Button variant="outline" size="sm" onClick={() => updateQuantity(item.itemId, -1)} className="h-8 w-8 p-0"><Minus className="h-3 w-3" /></Button><span className="text-foreground font-medium w-8 text-center">{item.quantity}</span><Button variant="outline" size="sm" onClick={() => updateQuantity(item.itemId, 1)} className="h-8 w-8 p-0"><Plus className="h-3 w-3" /></Button></div><span className="text-green-400 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span></div></div>)}
              </div>
              {currentOrder.length === 0 && <div className="text-center py-8"><div className="text-4xl mb-2">🛒</div><p className="text-muted-foreground">Nenhum item no pedido</p></div>}
              {currentOrder.length > 0 && (
                <>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-foreground">Total:</span>
                      <span className="text-green-400">R$ {getTotalOrder().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {/* Painel de Pagamento para Delivery quando "Pago" está selecionado */}
                  {orderType === 'Delivery' && deliveryPaymentOption === 'paid' && (
                    <div className="border-t border-border pt-4 space-y-4 mt-4">
                      <Label className="text-foreground font-semibold">Formas de Pagamento</Label>
                      <Tabs value={currentPayment.method} onValueChange={(value) => setCurrentPayment({ ...currentPayment, method: value })}>
                        <TabsList className="grid w-full grid-cols-5 bg-accent">
                          {Object.entries(paymentMethodConfig).map(([key, { name, initials }]) => (
                            <TabsTrigger 
                              key={key} 
                              value={key} 
                              className="text-muted-foreground data-[state=active]:text-foreground flex flex-col h-auto py-2 gap-1"
                            >
                              <span className="text-xs font-semibold">{initials}</span>
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
                          <Label className="text-foreground text-sm">Pagamentos Adicionados:</Label>
                          {paymentMethods.map((payment) => {
                            const config = paymentMethodConfig[payment.method] || { name: payment.method };
                            return (
                              <div key={payment.id} className="flex items-center justify-between p-2 rounded bg-accent">
                                <span className="text-foreground text-sm">{config.name}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-400 font-bold text-sm">R$ {payment.amount.toFixed(2)}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => removePaymentMethod(payment.id)} 
                                    className="text-red-400 hover:bg-red-500/10 p-1 h-6 w-6"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="flex justify-between text-foreground text-sm">
                          <span>Total a Pagar:</span>
                          <span>R$ {getTotalOrder().toFixed(2)}</span>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paidAmount" className="text-foreground text-sm">Valor Pago pelo Cliente</Label>
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
                            <div className="flex justify-between text-sm font-bold text-blue-400">
                              <span>Troco a devolver:</span>
                              <span>R$ {getChange().toFixed(2)}</span>
                            </div>
                        <div>
                          <Label htmlFor="changeMethod" className="text-foreground text-sm">Troco em:</Label>
                          <Tabs value={changeMethod} onValueChange={setChangeMethod}>
                            <TabsList className="grid w-full grid-cols-5 bg-accent">
                              {Object.entries(paymentMethodConfig).map(([key, { name, initials }]) => (
                                <TabsTrigger 
                                  key={key} 
                                  value={key} 
                                  className="text-muted-foreground data-[state=active]:text-foreground flex flex-col h-auto py-2 gap-1"
                                >
                                  <span className="text-xs font-semibold">{initials}</span>
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </Tabs>
                        </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Button onClick={finalizeOrder} className="w-full btn-gradient mt-4">
                    Enviar para Produção
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="glass-effect">
          <DialogHeader><DialogTitle className="text-foreground">Adicionar {selectedProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="notes" className="text-foreground">Observações do Item</Label><Textarea id="notes" value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} placeholder="Ex: sem maionese, extra bacon..." /></div>
            <div className="flex gap-2 pt-4"><Button onClick={confirmAddToOrder} className="btn-gradient flex-1">Adicionar ao Pedido</Button><Button variant="outline" onClick={() => { setIsOrderDialogOpen(false); setItemNotes(''); setSelectedProduct(null); }}>Cancelar</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;