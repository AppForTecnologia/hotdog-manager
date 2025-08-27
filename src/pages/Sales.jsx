import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Trash2, Settings, ArrowUp, ArrowDown, Search, MapPin, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

const Sales = () => {
  console.log('🏁 Componente Sales carregando...');
  
  const { user } = useUser();
  const products = useQuery(api.products.listActive) || [];
  const users = useQuery(api.users.listActive) || [];
  const customers = useQuery(api.customers.listActive) || [];
  const createSale = useMutation(api.sales.create);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateFromClerk);
  
  console.log('📦 Produtos carregados:', products);
  console.log('👤 Usuários carregados:', users);

  const [currentOrder, setCurrentOrder] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [saleType, setSaleType] = useState('local'); // 'local' ou 'delivery'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Encontrar o usuário atual no banco
  const currentUser = users.find(u => u.clerkId === user?.id);
  
  // Debug: verificar dados de autenticação
  console.log('🔐 Dados de autenticação:');
  console.log('  - Clerk user:', user);
  console.log('  - Clerk user ID:', user?.id);
  console.log('  - Users do banco:', users);
  console.log('  - Current user encontrado:', currentUser);
  
  // Criar usuário automaticamente se não existir (silenciosamente)
  useEffect(() => {
    if (user && !currentUser && users.length >= 0) {
      console.log('🆕 Criando usuário automaticamente...');
      createOrUpdateUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        fullName: user.fullName || user.firstName || user.lastName || '',
        role: 'vendedor'
      }).then(() => {
        console.log('✅ Usuário criado com sucesso!');
        // Removido o toast para não incomodar o usuário
      }).catch((error) => {
        console.error('❌ Erro ao criar usuário:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar usuário. Tente novamente.",
          variant: "destructive"
        });
      });
    }
  }, [user, currentUser, users, createOrUpdateUser]);

  // Debug: monitorar mudanças no currentOrder
  useEffect(() => {
    console.log('🔄 currentOrder mudou:', currentOrder);
  }, [currentOrder]);

  // Debug: monitorar mudanças no selectedProduct
  useEffect(() => {
    console.log('🔄 selectedProduct mudou:', selectedProduct);
  }, [selectedProduct]);

  // Debug: mostrar informações do pedido
  useEffect(() => {
    console.log('📊 Estado atual do pedido:');
    console.log('  - Número de itens:', currentOrder.length);
    console.log('  - Itens:', currentOrder);
    console.log('  - Modal aberto:', isOrderDialogOpen);
    console.log('  - Produto selecionado:', selectedProduct);
    console.log('  - Notas:', itemNotes);
    console.log('  - Tipo de currentOrder:', Array.isArray(currentOrder) ? 'Array' : typeof currentOrder);
    console.log('  - Conteúdo do currentOrder:', JSON.stringify(currentOrder, null, 2));
  }, [currentOrder, isOrderDialogOpen, selectedProduct, itemNotes]);

  const addToOrder = (product) => {
    setSelectedProduct(product);
    setIsOrderDialogOpen(true);
  };

  const confirmAddToOrder = () => {
    console.log('✅ Confirmando adição do produto:', selectedProduct);
    console.log('✅ Estado atual:');
    console.log('  - selectedProduct:', selectedProduct);
    console.log('  - itemNotes:', itemNotes);
    console.log('  - currentOrder antes:', currentOrder);
    
    if (!selectedProduct) {
      console.log('❌ selectedProduct é null/undefined');
      return;
    }

    const existingItem = currentOrder.find(item => 
      item.id === selectedProduct._id && item.notes === itemNotes
    );

    console.log('🔍 Item existente encontrado:', existingItem);
    console.log('📝 Notas do item:', itemNotes);
    console.log('🔍 Buscando por:', { id: selectedProduct._id, notes: itemNotes });
    console.log('🔍 Itens no pedido:', currentOrder.map(item => ({ id: item.id, notes: item.notes })));

    if (existingItem) {
      console.log('🔄 Atualizando quantidade do item existente');
      setCurrentOrder(prevOrder => {
        const newOrder = prevOrder.map(item =>
          item.id === selectedProduct._id && item.notes === itemNotes
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        console.log('🔄 Pedido atualizado (quantidade):', newOrder);
        return newOrder;
      });
    } else {
      console.log('➕ Adicionando novo item ao pedido');
      const newItem = {
        ...selectedProduct,
        id: selectedProduct._id,
        quantity: 1,
        notes: itemNotes,
        itemId: Date.now()
      };
      console.log('🆕 Novo item:', newItem);
      setCurrentOrder(prevOrder => {
        const newOrder = [...prevOrder, newItem];
        console.log('📋 Pedido atualizado (novo item):', newOrder);
        return newOrder;
      });
    }

    console.log('✅ Fechando modal e limpando estado');
    setIsOrderDialogOpen(false);
    setItemNotes('');
    setSelectedProduct(null);
    
    toast({
      title: "Item adicionado!",
      description: `${selectedProduct.name} foi adicionado ao pedido.`
    });
  };

  const updateQuantity = (itemId, change) => {
    setCurrentOrder(prevOrder => 
      prevOrder.map(item => {
        if (item.itemId === itemId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromOrder = (itemId) => {
    setCurrentOrder(prevOrder => prevOrder.filter(item => item.itemId !== itemId));
  };

  const getTotalOrder = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const finalizeOrder = async () => {
    if (currentOrder.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido!",
        variant: "destructive"
      });
      return;
    }

    // Validações específicas por tipo de venda
    if (saleType === 'local' && !tableNumber) {
      toast({
        title: "Erro",
        description: "Informe o número da mesa/comanda!",
        variant: "destructive"
      });
      return;
    }

    if (saleType === 'delivery' && !selectedCustomer) {
      toast({
        title: "Erro",
        description: "Selecione um cliente para o delivery!",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Preparar os itens para a venda
      const items = currentOrder.map(item => ({
        productId: item.id,
        productName: item.name,
        unitPrice: item.price,
        quantity: item.quantity
      }));

      // Preparar notas baseadas no tipo de venda
      let notes = '';
      if (saleType === 'local') {
        notes = `Mesa: ${tableNumber}`;
      } else {
        notes = `Delivery - Cliente: ${selectedCustomer.name}`;
      }

      // Criar a venda no Convex
      await createSale({
        userId: currentUser._id,
        clerkUserId: user.id,
        items,
        paymentMethod: "pendente",
        saleType: saleType,
        customerId: selectedCustomer?._id,
        notes: notes,
        discount: 0
      });

      // Limpar o pedido
      setCurrentOrder([]);
      setTableNumber('');
      setSelectedCustomer(null);
      setSaleType('local');
      
      const successMessage = saleType === 'local' 
        ? `Pedido para mesa ${tableNumber} foi criado com sucesso.`
        : `Pedido de delivery para ${selectedCustomer.name} foi criado com sucesso.`;
      
      toast({
        title: "Pedido criado!",
        description: successMessage
      });
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtrar produtos por termo de busca
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar clientes por termo de busca
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm) ||
    customer.address.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">Vendas</h1>
          <p className="text-white/70">Selecione os produtos para criar um pedido</p>
        </motion.div>

        {/* Barra de busca */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
        </motion.div>

        {/* Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-white/20 card-hover cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🌭</span>
                      </div>
                    )}
                    
                                          <div className="flex-1">
                        <h3 className="font-semibold text-white">{product.name}</h3>
                        <p className="text-white/60 text-sm">{product.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-green-400 font-bold">R$ {product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    
                    <div
                      onClick={() => addToOrder(product)}
                      style={{ 
                        padding: '8px 12px', 
                        background: '#3b82f6', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        userSelect: 'none'
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            {searchTerm.trim() !== '' ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-white/60">
                  Tente buscar por outro termo ou verifique a ortografia.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Nenhum produto cadastrado
                </h3>
                <p className="text-white/60">
                  Cadastre produtos primeiro para começar a vender!
                </p>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Order Section */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Pedido Atual
                {currentOrder.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {currentOrder.length} item{currentOrder.length !== 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Venda */}
              <div>
                <Label className="text-white mb-2 block">Tipo de Venda</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={saleType === 'local' ? 'default' : 'outline'}
                    onClick={() => {
                      setSaleType('local');
                      setSelectedCustomer(null);
                      setCustomerSearchTerm('');
                    }}
                    className={`w-full ${
                      saleType === 'local' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    🏪 Local
                  </Button>
                  <Button
                    variant={saleType === 'delivery' ? 'default' : 'outline'}
                    onClick={() => setSaleType('delivery')}
                    className={`w-full ${
                      saleType === 'delivery' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    }`}
                  >
                    🚚 Delivery
                  </Button>
                </div>
              </div>

              {/* Campo Mesa (apenas para vendas locais) */}
              {saleType === 'local' && (
                <div>
                  <Label htmlFor="table" className="text-white">Mesa/Comanda</Label>
                  <Input
                    id="table"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Mesa 5"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )}

              {/* Seleção de Cliente (apenas para delivery) */}
              {saleType === 'delivery' && (
                <div>
                  <Label className="text-white">Cliente para Delivery</Label>
                  {selectedCustomer ? (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-400" />
                          <div>
                            <p className="text-white font-medium">{selectedCustomer.name}</p>
                            <p className="text-white/60 text-sm">{selectedCustomer.phone}</p>
                            <p className="text-white/70 text-xs">{selectedCustomer.address}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(null)}
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Barra de busca para clientes */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Buscar por nome, telefone ou endereço..."
                          value={customerSearchTerm}
                          onChange={(e) => setCustomerSearchTerm(e.target.value)}
                          className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        />
                      </div>
                      
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer._id}
                            className="p-2 bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearchTerm('');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-400" />
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">{customer.name}</p>
                                <p className="text-white/60 text-xs">{customer.phone}</p>
                                {customer.address && (
                                  <p className="text-white/50 text-xs truncate">{customer.address}</p>
                                )}
                              </div>
                              <MapPin className="h-3 w-3 text-orange-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {customers.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-white/50 text-sm">Nenhum cliente cadastrado</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          >
                            Cadastrar Cliente
                          </Button>
                        </div>
                      )}
                      
                      {customers.length > 0 && filteredCustomers.length === 0 && (
                        <div className="text-center py-4">
                          <div className="text-4xl mb-2">🔍</div>
                          <p className="text-white/50 text-sm">Nenhum cliente encontrado</p>
                          <p className="text-white/40 text-xs">
                            Tente buscar por outro termo
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                {currentOrder.map((item) => (
                  <div key={item.itemId} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.name}</h4>
                        {item.notes && (
                          <p className="text-white/60 text-sm">Obs: {item.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromOrder(item.itemId)}
                        className="text-red-400 hover:bg-red-500/10 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.itemId, -1)}
                          className="h-8 w-8 p-0 border-white/20 text-white hover:bg-white/10"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-white font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.itemId, 1)}
                          className="h-8 w-8 p-0 border-white/20 text-white hover:bg-white/10"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-green-400 font-bold">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {currentOrder.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-white/60">Nenhum item no pedido</p>
                </div>
              )}

              {currentOrder.length > 0 && (
                <>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">R$ {getTotalOrder().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={finalizeOrder}
                    className="w-full btn-gradient"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processando..." : "Criar Pedido"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="glass-effect border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              Adicionar {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes" className="text-white">Observações do Item</Label>
              <Textarea
                id="notes"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="Ex: sem maionese, extra bacon..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={confirmAddToOrder} className="btn-gradient flex-1">
                Adicionar ao Pedido
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsOrderDialogOpen(false);
                  setItemNotes('');
                  setSelectedProduct(null);
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;