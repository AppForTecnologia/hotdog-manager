import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Receipt, Truck, MapPin, Phone, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { jsPDF } from "jspdf";
import { FileText } from 'lucide-react'; // ícone do botão de PDF

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
  // Estado para filtro de data - inicializa com a data atual no formato YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  /**
   * Carrega os pedidos e clientes do localStorage
   * Atualiza a cada 3 segundos para manter os dados sincronizados
   * Mostra todos os pedidos de Delivery para o entregador acompanhar todo o processo
   */
  useEffect(() => {
    const fetchData = () => {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');

      // Mostra todos os pedidos de Delivery
      // Inclui pedidos entregues para que possam aparecer no filtro "Entregues"
      const deliveryOrders = savedOrders.filter(order => {
        if (order.type !== 'Delivery') return false;
        // Mostra todos os pedidos de Delivery (incluindo entregues)
        // Isso permite que o entregador veja todos os pedidos e use os filtros corretamente
        return true;
      });
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
   * Atualiza o status dos itens do pedido
   * 
   * @param {number} orderId - ID do pedido
   * @param {string} newStatus - Novo status para os itens
   */
  const updateOrderItemsStatus = (orderId, newStatus) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = allOrders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => ({
            ...item,
            status: newStatus
          }))
        };
      }
      return order;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));

    // Atualiza o estado local
    setOrders(updatedOrders.filter(order => order.type === 'Delivery'));
  };

  /**
   * Muda o status do pedido para "Em rota de entrega"
   * 
   * @param {number} orderId - ID do pedido
   */
  const setOrderInRoute = (orderId) => {
    updateOrderItemsStatus(orderId, 'Em rota de entrega');
    toast({
      title: "Pedido em rota!",
      description: "O pedido foi marcado como 'Em rota de entrega'."
    });
  };

  /**
   * Processa o pagamento do pedido e marca como Entregue
   * Salva a venda e atualiza o status dos itens para Entregue
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

    // Atualiza o status dos itens do pedido para Entregue
    updateOrderItemsStatus(selectedOrder.id, 'Entregue');

    // Atualiza o status do pedido
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = allOrders.map(order => {
      if (order.id === selectedOrder.id) {
        return {
          ...order,
          status: 'Entregue',
          paymentStatus: 'paid',
          paidAt: new Date().toISOString()
        };
      }
      return order;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    setOrders(updatedOrders.filter(order => order.type === 'Delivery'));

    toast({
      title: "Pedido entregue!",
      description: `Pagamento de R$ ${totalToPay.toFixed(2)} registrado e pedido marcado como entregue.`
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
   * Verifica se o pedido tem itens com um status específico
   * 
   * @param {Object} order - Pedido a verificar
   * @param {string} status - Status a verificar
   * @returns {boolean} True se pelo menos um item tem o status
   */
  const generateDeliveryPdf = (order, statusLabel) => {
    const doc = new jsPDF({
      unit: "mm",
      format: [80, 200],
    });

    const client = order.clientId ? getClientInfo(order.clientId) : null;
    const createdAt = new Date(order.createdAt);

    let y = 8;

    // TÍTULO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Delivery #${order.id}`, 4, y);

    const hora = createdAt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.setFont("helvetica", "normal");
    doc.text(hora, 76, y, { align: "right" });

    // Status
    y += 6;
    doc.setFontSize(9);
    doc.text(`Status: ${statusLabel}`, 4, y);

    // CLIENTE
    y += 5;
    if (client?.name) {
      doc.text(`Cliente: ${client.name}`, 4, y);
      y += 4;
    }

    if (client?.phone) {
      doc.text(`Tel: ${client.phone}`, 4, y);
      y += 4;
    }

    // ENDEREÇO (com quebra de linha)
    if (order.deliveryAddress) {
      const addrLines = doc.splitTextToSize(`Endereço: ${order.deliveryAddress}`, 72);
      addrLines.forEach((line) => {
        doc.text(line, 4, y);
        y += 4;
      });
    }

    // Separador
    y += 4;
    doc.text("----------------------------------------", 4, y);
    y += 4;

    // ITENS
    doc.setFont("helvetica", "bold");
    doc.text("Itens:", 4, y);
    y += 5;

    doc.setFont("helvetica", "normal");

    (order.items || []).forEach((item) => {
      const line = `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`;
      const wrapped = doc.splitTextToSize(line, 72);
      wrapped.forEach((l) => {
        doc.text(l, 4, y);
        y += 4;
      });
    });

    // Separador
    y += 4;
    doc.text("----------------------------------------", 4, y);
    y += 4;

    // TOTAL
    const total =
      order.total ??
      order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    doc.setFont("helvetica", "bold");
    doc.text(`Total: R$ ${total.toFixed(2)}`, 4, y);
    y += 5;

    // PAGAMENTO (PAGO / NÃO PAGO)
    const isPaid = order.isPaid === true || order.paymentOption === "paid";
    const paymentText = isPaid ? "PAGO" : "PAGAR NA ENTREGA";

    doc.setFont("helvetica", "normal");
    doc.text(`Pagamento: ${paymentText}`, 4, y);
    y += 6;

    // FINALIZAÇÃO — sem assinatura
    // PDF pronto
    doc.save(`delivery_${order.id}.pdf`);
  };

  const hasItemWithStatus = (order, status) => {
    return order.items.some(item => (item.status || 'Pendente') === status);
  };

  /**
   * Obtém o status principal do pedido baseado nos itens
   * 
   * @param {Object} order - Pedido
   * @returns {string} Status principal do pedido
   */
  const getOrderMainStatus = (order) => {
    // Se todos os itens estão entregues
    if (order.items.every(item => (item.status || 'Pendente') === 'Entregue')) {
      return 'Entregue';
    }
    // Se algum item está em rota
    if (hasItemWithStatus(order, 'Em rota de entrega')) {
      return 'Em rota de entrega';
    }
    // Se algum item está c/Entregador
    if (hasItemWithStatus(order, 'c/Entregador')) {
      return 'c/Entregador';
    }
    // Se algum item está concluído
    if (hasItemWithStatus(order, 'Concluído')) {
      return 'Concluído';
    }
    // Se algum item está em produção
    if (hasItemWithStatus(order, 'Em Produção')) {
      return 'Em Produção';
    }
    // Se algum item está pendente
    if (hasItemWithStatus(order, 'Pendente')) {
      return 'Pendente';
    }
    return order.status || 'Pendente';
  };

  /**
   * Verifica se um pedido foi criado na data selecionada
   * 
   * @param {Object} order - Pedido a verificar
   * @param {string} date - Data no formato YYYY-MM-DD
   * @returns {boolean} True se o pedido foi criado na data
   */
  const isOrderOnDate = (order, date) => {
    if (!order.createdAt) return false;

    try {
      // Converte a data do pedido para string no formato YYYY-MM-DD
      const orderDate = new Date(order.createdAt);

      // Usa getFullYear, getMonth, getDate para evitar problemas de timezone
      const orderYear = orderDate.getFullYear();
      const orderMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
      const orderDay = String(orderDate.getDate()).padStart(2, '0');
      const orderDateStr = `${orderYear}-${orderMonth}-${orderDay}`;

      // Compara as strings de data (formato YYYY-MM-DD)
      return orderDateStr === date;
    } catch (error) {
      console.error('Erro ao comparar datas:', error);
      return false;
    }
  };

  /**
   * Filtra os pedidos de acordo com o filtro selecionado e a data
   * 
   * @returns {Array} Array de pedidos filtrados
   */
  const filteredOrders = orders.filter(order => {
    // Primeiro filtra por data
    if (!isOrderOnDate(order, selectedDate)) {
      return false;
    }

    const mainStatus = getOrderMainStatus(order);
    const isPaid = order.paymentStatus === 'paid';

    if (filter === 'all') {
      // Mostra todos os pedidos de Delivery da data selecionada
      return true;
    }
    if (filter === 'pending') {
      // Pendentes: pedidos que ainda não estão em rota nem entregues
      // Inclui: Pendente, Em Produção, Concluído, c/Entregador
      return mainStatus !== 'Em rota de entrega' && mainStatus !== 'Entregue';
    }
    if (filter === 'in_route') {
      // Em Rota: pedidos com status "Em rota de entrega"
      return mainStatus === 'Em rota de entrega';
    }
    if (filter === 'delivered') {
      // Entregues: pedidos com status "Entregue"
      return mainStatus === 'Entregue';
    }
    if (filter === 'paid') {
      // Pagos: pedidos que foram pagos (independente do status de entrega)
      // Verifica tanto paymentStatus quanto se foi pago na venda
      return isPaid || order.paymentOption === 'paid';
    }
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

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="date-filter" className="text-foreground font-medium">
            Data:
          </Label>
          <Button
            variant="outline"
            onClick={() => {
              // Atualiza o mês do calendário para o mês da data selecionada
              const date = new Date(selectedDate + 'T00:00:00');
              setCalendarMonth({ year: date.getFullYear(), month: date.getMonth() });
              setIsCalendarOpen(true);
            }}
            className="w-auto min-w-[140px] justify-start"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </Button>
        </div>
        <Tabs value={filter} onValueChange={setFilter} className="flex-1">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-5">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="in_route">Em Rota</TabsTrigger>
            <TabsTrigger value="delivered">Entregues</TabsTrigger>
            <TabsTrigger value="paid">Pagos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order, index) => {
          const client = order.clientId ? getClientInfo(order.clientId) : null;
          const isPaid = order.paymentStatus === 'paid' || order.status === 'paid';
          const mainStatus = getOrderMainStatus(order);
          const isWithDriver = hasItemWithStatus(order, 'c/Entregador');
          const isInRoute = hasItemWithStatus(order, 'Em rota de entrega');
          const isDelivered = mainStatus === 'Entregue';

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
                      Status: <span className="font-semibold text-foreground">{mainStatus}</span>
                    </p>
                    {isPaid && !isDelivered && (
                      <p className="text-sm text-green-400 font-semibold">✓ Pagamento Registrado</p>
                    )}
                    {isDelivered && (
                      <p className="text-sm text-green-400 font-semibold">✓ Entregue</p>
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
                  {isWithDriver && !isInRoute && !isDelivered && (
                    <Button
                      className="w-full bg-purple-500 hover:bg-purple-600"
                      onClick={() => setOrderInRoute(order.id)}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Iniciar Entrega
                    </Button>
                  )}
                  {isInRoute && !isDelivered && (order.paymentOption === 'on_delivery' || !order.paymentOption) && (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => openPaymentDialog(order)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Registrar Pagamento e Entregar
                    </Button>
                  )}
                  {isInRoute && !isDelivered && order.paymentOption === 'paid' && (
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => {
                        // Marca como entregue sem precisar registrar pagamento
                        updateOrderItemsStatus(order.id, 'Entregue');
                        const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                        const updatedOrders = allOrders.map(o => {
                          if (o.id === order.id) {
                            return {
                              ...o,
                              status: 'Entregue'
                            };
                          }
                          return o;
                        });
                        localStorage.setItem('orders', JSON.stringify(updatedOrders));
                        setOrders(updatedOrders.filter(o => o.type === 'Delivery'));
                        toast({
                          title: "Pedido entregue!",
                          description: "Pedido marcado como entregue."
                        });
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Finalizar Entrega
                    </Button>
                  )}
                  {order.type === "Delivery" && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => generateDeliveryPdf(order, mainStatus)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar PDF da Entrega
                    </Button>
                  )}


                  {isDelivered && (
                    <div className="w-full p-3 rounded-lg bg-green-500/20 text-green-400 text-center font-semibold">
                      ✓ Pedido Entregue
                    </div>
                  )}
                  {!isWithDriver && !isInRoute && !isDelivered && (
                    <div className="w-full p-3 rounded-lg bg-blue-500/20 text-blue-400 text-center font-semibold text-sm">
                      {mainStatus === 'Pendente' && 'Aguardando início da produção'}
                      {mainStatus === 'Em Produção' && 'Em produção'}
                      {mainStatus === 'Concluído' && 'Aguardando entregador'}
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

      {/* Dialog do Calendário Visual */}
      <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DialogContent className="glass-effect max-w-sm p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-foreground">Selecionar Data</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {/* Navegação do Mês */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCalendarMonth(prev => {
                    const newDate = new Date(prev.year, prev.month - 1, 1);
                    return { year: newDate.getFullYear(), month: newDate.getMonth() };
                  });
                }}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric'
                }).replace(/^\w/, c => c.toUpperCase())}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCalendarMonth(prev => {
                    const newDate = new Date(prev.year, prev.month + 1, 1);
                    return { year: newDate.getFullYear(), month: newDate.getMonth() };
                  });
                }}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de Dias */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
                const lastDay = new Date(calendarMonth.year, calendarMonth.month + 1, 0);
                const daysInMonth = lastDay.getDate();
                const startingDayOfWeek = firstDay.getDay();
                const days = [];

                // Dias do mês anterior
                const prevMonth = new Date(calendarMonth.year, calendarMonth.month, 0);
                const daysInPrevMonth = prevMonth.getDate();
                for (let i = startingDayOfWeek - 1; i >= 0; i--) {
                  const day = daysInPrevMonth - i;
                  days.push({
                    day,
                    isCurrentMonth: false,
                    date: `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  });
                }

                // Dias do mês atual
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  days.push({
                    day,
                    isCurrentMonth: true,
                    date: dateStr
                  });
                }

                // Dias do próximo mês para completar a grade
                const remainingDays = 42 - days.length; // 6 semanas * 7 dias
                const nextMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 1);
                for (let day = 1; day <= remainingDays; day++) {
                  days.push({
                    day,
                    isCurrentMonth: false,
                    date: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  });
                }

                return days.map(({ day, isCurrentMonth, date }, index) => {
                  const isSelected = date === selectedDate;
                  const isToday = date === (() => {
                    const today = new Date();
                    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  })();

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (isCurrentMonth) {
                          setSelectedDate(date);
                          setIsCalendarOpen(false);
                        }
                      }}
                      className={`
                        h-10 w-10 rounded-lg text-sm font-medium transition-all
                        ${!isCurrentMonth ? 'text-muted-foreground/30 cursor-not-allowed' : 'cursor-pointer hover:bg-accent'}
                        ${isSelected && isCurrentMonth ? 'bg-primary text-primary-foreground font-bold' : ''}
                        ${isToday && !isSelected && isCurrentMonth ? 'ring-2 ring-primary/50 bg-primary/10' : ''}
                        ${!isSelected && !isToday && isCurrentMonth ? 'text-foreground hover:bg-accent' : ''}
                      `}
                      disabled={!isCurrentMonth}
                    >
                      {day}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Botões de ação */}
            <div className="flex justify-between gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  setSelectedDate(`${year}-${month}-${day}`);
                  setCalendarMonth({ year: today.getFullYear(), month: today.getMonth() });
                  setIsCalendarOpen(false);
                }}
                className="flex-1"
              >
                Hoje
              </Button>
              <Button variant="outline" onClick={() => setIsCalendarOpen(false)} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeliveryDriver;


