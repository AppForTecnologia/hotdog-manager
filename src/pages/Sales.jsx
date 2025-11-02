import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Trash2, GlassWater, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === 'Local') {
      setSelectedClient(null);
      setClientSearch('');
    } else {
      setTableNumber('');
    }
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

  const getTotalOrder = () => currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);

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
      operator: 'Operador 1'
    };

    saveOrders([...orders, newOrder]);
    setCurrentOrder([]);
    setTableNumber('');
    setSelectedClient(null);
    setClientSearch('');
    toast({ title: "Pedido criado!", description: `Pedido para ${orderType === 'Local' ? tableNumber : selectedClient.name} foi enviado para produção.` });
  };

  const filteredProducts = products.filter(product => activeTab === 'all' || product.categoryId === parseInt(activeTab));
  const beverageCategory = categories.find(c => c.name.toLowerCase() === 'bebidas');
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch));

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
              {orderType === 'Local' ? <div><Label htmlFor="table" className="text-foreground">Mesa/Comanda</Label><Input id="table" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="Ex: Mesa 5" /></div> : <div>
                <Label className="text-foreground">Cliente para Delivery</Label>
                {selectedClient ? <div className="p-3 rounded-lg bg-accent/50 flex justify-between items-center"><p className="text-foreground">{selectedClient.name}</p><Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>Trocar</Button></div> : <div>
                  <Input placeholder="Buscar por nome ou telefone" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {clientSearch && filteredClients.map(c => <div key={c.id} className="p-2 rounded hover:bg-accent cursor-pointer" onClick={() => { setSelectedClient(c); setClientSearch(''); }}><p>{c.name}</p><p className="text-xs text-muted-foreground">{c.phone}</p></div>)}
                  </div>
                  {clients.length === 0 && <Button variant="outline" className="w-full mt-2" onClick={() => navigate('/clients')}><UserPlus className="h-4 w-4 mr-2" />Cadastrar Cliente</Button>}
                </div>}
              </div>}
              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                {currentOrder.map((item) => <div key={item.itemId} className="p-3 rounded-lg bg-accent/50"><div className="flex justify-between items-start mb-2"><div className="flex-1"><h4 className="text-foreground font-medium">{item.name}</h4>{item.notes && <p className="text-muted-foreground text-sm">Obs: {item.notes}</p>}</div><Button variant="ghost" size="sm" onClick={() => removeFromOrder(item.itemId)} className="text-red-400 hover:bg-red-500/10 p-1"><Trash2 className="h-4 w-4" /></Button></div><div className="flex justify-between items-center"><div className="flex items-center space-x-2"><Button variant="outline" size="sm" onClick={() => updateQuantity(item.itemId, -1)} className="h-8 w-8 p-0"><Minus className="h-3 w-3" /></Button><span className="text-foreground font-medium w-8 text-center">{item.quantity}</span><Button variant="outline" size="sm" onClick={() => updateQuantity(item.itemId, 1)} className="h-8 w-8 p-0"><Plus className="h-3 w-3" /></Button></div><span className="text-green-400 font-bold">R$ {(item.price * item.quantity).toFixed(2)}</span></div></div>)}
              </div>
              {currentOrder.length === 0 && <div className="text-center py-8"><div className="text-4xl mb-2">🛒</div><p className="text-muted-foreground">Nenhum item no pedido</p></div>}
              {currentOrder.length > 0 && <><div className="border-t border-border pt-4"><div className="flex justify-between items-center text-lg font-bold"><span className="text-foreground">Total:</span><span className="text-green-400">R$ {getTotalOrder().toFixed(2)}</span></div></div><Button onClick={finalizeOrder} className="w-full btn-gradient">Enviar para Produção</Button></>}
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