import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

const Sales = () => {
  console.log('🏁 Componente Sales carregando...');
  
  const { user } = useUser();
  const products = useQuery(api.products.listActive) || [];
  const users = useQuery(api.users.listActive) || [];
  const createSale = useMutation(api.sales.create);
  const createOrUpdateUser = useMutation(api.users.createOrUpdateFromClerk);
  
  console.log('📦 Produtos carregados:', products);
  console.log('👤 Usuários carregados:', users);

  const [currentOrder, setCurrentOrder] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Encontrar o usuário atual no banco
  const currentUser = users.find(u => u.clerkId === user?.id);
  
  // Debug: verificar dados de autenticação
  console.log('🔐 Dados de autenticação:');
  console.log('  - Clerk user:', user);
  console.log('  - Clerk user ID:', user?.id);
  console.log('  - Users do banco:', users);
  console.log('  - Current user encontrado:', currentUser);
  
  // Criar usuário automaticamente se não existir
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
        toast({
          title: "Usuário criado!",
          description: "Seu usuário foi criado automaticamente no sistema."
        });
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

    if (!tableNumber) {
      toast({
        title: "Erro",
        description: "Informe o número da mesa/comanda!",
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

      // Criar a venda no Convex
      await createSale({
        userId: currentUser._id,
        clerkUserId: user.id,
        items,
        paymentMethod: "pendente",
        notes: `Mesa: ${tableNumber}`,
        discount: 0
      });

      // Limpar o pedido
      setCurrentOrder([]);
      setTableNumber('');
      
      toast({
        title: "Pedido criado!",
        description: `Pedido para mesa ${tableNumber} foi criado com sucesso.`
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product, index) => (
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
                        <p className="text-white/50 text-sm">Estoque: {product.stock}</p>
                      </div>
                    </div>
                    
                    <div
                      onClick={() => {
                        console.log('🖱️ CLIQUE DETECTADO no div +');
                        console.log('🖱️ Produto clicado:', product);
                        
                        // Teste direto - sem função
                        console.log('🧪 TESTE DIRETO - setSelectedProduct');
                        setSelectedProduct(product);
                        console.log('🧪 TESTE DIRETO - setIsOrderDialogOpen');
                        setIsOrderDialogOpen(true);
                        
                        // Verificar se o estado foi atualizado
                        setTimeout(() => {
                          console.log('🧪 VERIFICAÇÃO - selectedProduct:', selectedProduct);
                          console.log('🧪 VERIFICAÇÃO - isOrderDialogOpen:', isOrderDialogOpen);
                        }, 100);
                      }}
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

        {products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum produto cadastrado
            </h3>
            <p className="text-white/60">
              Cadastre produtos primeiro para começar a vender!
            </p>
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

              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
                {/* Debug: mostrar informações do pedido */}
                <div className="p-2 bg-blue-500/20 rounded text-xs text-blue-300">
                  Debug: {currentOrder.length} itens no pedido
                </div>
                
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