import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Package, Coffee, Settings, ArrowUp, ArrowDown, FolderPlus } from 'lucide-react';
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

class ProductsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Erro na tela de Produtos:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Ocorreu um erro ao carregar Produtos</h3>
          <p className="text-white/60">Confira o console do navegador para detalhes e me envie o erro.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente interno que contém toda a lógica da página
const ProductsInner = () => {
  const { user } = useUser();
  const productGroups = useQuery(api.products.listGroupedByCategory) || {};
  const allGroups = useQuery(api.productGroups.listActive) || [];
  const categories = useQuery(api.categories.listActive) || [];
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.removeProduct);
  const createGroup = useMutation(api.productGroups.create);
  const updateGroupOrder = useMutation(api.productGroups.updateOrder);
  const initializeGroups = useMutation(api.productGroups.initializeDefaultGroups);
  
  
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [groupOrder, setGroupOrder] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    categoryId: ''
  });
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    title: '',
    icon: '',
    color: '#F97316',
    keywords: ''
  });

  // Inicializar grupos padrão se não existirem
  useEffect(() => {
    if (allGroups.length === 0 && initializeGroups) {
      console.log('🔍 Inicializando grupos padrão...');
      initializeGroups().catch(error => {
        console.error('❌ Erro ao inicializar grupos:', error);
      });
    }
  }, [allGroups.length, initializeGroups]);

  // Atualizar ordem dos grupos quando a lista mudar
  useEffect(() => {
    if (allGroups.length > 0) {
      setGroupOrder(allGroups.map(group => ({ id: group._id, title: group.title, order: group.order })));
    }
  }, [allGroups]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.categoryId) {
      toast({
        title: "Erro",
        description: "Nome, preço e categoria são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingProduct) {
        // Atualizar produto existente
        await updateProduct({
          id: editingProduct._id,
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          image: formData.image,
          categoryId: formData.categoryId
        });
        
        toast({
          title: "Sucesso!",
          description: "Produto atualizado com sucesso!"
        });
      } else {
        // Criar novo produto
        await createProduct({
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
          image: formData.image,
          categoryId: formData.categoryId
        });
        
        toast({
          title: "Sucesso!",
          description: "Produto cadastrado com sucesso!"
        });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', description: '', image: '', categoryId: '' });
      
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar produto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      image: product.imageUrl || '',
      categoryId: product.categoryId || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct({ id });
      toast({
        title: "Produto removido",
        description: "Produto excluído com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar produto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    
    if (!groupFormData.name || !groupFormData.title) {
      toast({
        title: "Erro",
        description: "Nome e título são obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    try {
      const keywords = groupFormData.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      
      const result = await createGroup({
        name: groupFormData.name,
        title: groupFormData.title,
        icon: groupFormData.icon || '📦',
        color: groupFormData.color,
        keywords: keywords
      });
      
      
      toast({
        title: "Sucesso!",
        description: "Grupo criado com sucesso!"
      });

      setIsGroupDialogOpen(false);
      setGroupFormData({ name: '', title: '', icon: '', color: '#F97316', keywords: '' });
      
    } catch (error) {
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Erro",
        description: `Erro ao criar grupo: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const groupOrders = groupOrder.map((group, index) => ({
        id: group.id,
        order: index + 1
      }));

      await updateGroupOrder({ groupOrders });
      
      toast({
        title: "Sucesso!",
        description: "Ordem dos grupos atualizada!"
      });

      setIsOrderDialogOpen(false);
      
    } catch (error) {
      console.error('Erro ao atualizar ordem:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar ordem. Tente novamente.",
        variant: "destructive"
      });
    }
  };


  const moveGroupUp = (index) => {
    if (index > 0) {
      const newOrder = [...groupOrder];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      setGroupOrder(newOrder);
    }
  };

  const moveGroupDown = (index) => {
    if (index < groupOrder.length - 1) {
      const newOrder = [...groupOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setGroupOrder(newOrder);
    }
  };

  // Filtrar produtos por termo de busca em todos os grupos
  const filteredGroups = Object.keys(productGroups).reduce((acc, groupKey) => {
    const group = productGroups[groupKey];
    const filteredProducts = group.products?.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
    
    if (filteredProducts.length > 0) {
      acc[groupKey] = {
        ...group,
        products: filteredProducts
      };
    }
    
    return acc;
  }, {});

  // Contar total de produtos filtrados
  const totalFilteredProducts = Object.values(filteredGroups).reduce((total, group) => 
    total + (group.products?.length || 0), 0
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-white/70">Gerencie o cardápio da sua lanchonete</p>
        </div>
        
        <div className="flex gap-2">
          
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Categoria</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <Label htmlFor="groupName" className="text-white">Nome da Categoria</Label>
                  <Input
                    id="groupName"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                    placeholder="Ex: porcoes"
                    className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="groupTitle" className="text-white">Título Exibido</Label>
                  <Input
                    id="groupTitle"
                    value={groupFormData.title}
                    onChange={(e) => setGroupFormData({ ...groupFormData, title: e.target.value })}
                    placeholder="Ex: Porções"
                    className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="groupIcon" className="text-white">Ícone (Emoji)</Label>
                  <Input
                    id="groupIcon"
                    value={groupFormData.icon}
                    onChange={(e) => setGroupFormData({ ...groupFormData, icon: e.target.value })}
                    placeholder="🍟"
                    className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="groupColor" className="text-white">Cor</Label>
                  <Input
                    id="groupColor"
                    type="color"
                    value={groupFormData.color}
                    onChange={(e) => setGroupFormData({ ...groupFormData, color: e.target.value })}
                    className="bg-gray-800/50 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="groupKeywords" className="text-white">Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    id="groupKeywords"
                    value={groupFormData.keywords}
                    onChange={(e) => setGroupFormData({ ...groupFormData, keywords: e.target.value })}
                    placeholder="porção, batata, fritas"
                    className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-gradient flex-1">
                    Criar Categoria
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsGroupDialogOpen(false);
                      setGroupFormData({ name: '', title: '', icon: '', color: '#F97316', keywords: '' });
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Ordenar
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-white/20">
              <DialogHeader>
                <DialogTitle className="text-white">Ordenar Categorias</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {groupOrder.map((group, index) => (
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-white">{group.title}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveGroupUp(index)}
                        disabled={index === 0}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveGroupDown(index)}
                        disabled={index === groupOrder.length - 1}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateOrder} className="btn-gradient flex-1">
                    Salvar Ordem
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsOrderDialogOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
          <DialogContent className="glass-effect border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Nome do Produto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Hot Dog Tradicional"
                  className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-white">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              
              <div>
                <Label htmlFor="categoryId" className="text-white">Categoria</Label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                >
                  <option value="" className="bg-gray-800 text-gray-400">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id} className="bg-gray-800 text-white">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-white">Observações</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredientes, observações especiais..."
                  className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              
              <div>
                <Label htmlFor="image" className="text-white">URL da Foto</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="btn-gradient flex-1">
                  {editingProduct ? 'Atualizar' : 'Cadastrar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingProduct(null);
                    setFormData({ name: '', price: '', description: '', image: '', categoryId: '' });
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-800/50 border border-gray-600/50 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
      </motion.div>

      {/* Renderizar grupos de produtos na ordem configurada pelo usuário */}
      {allGroups.map((groupConfig, groupIndex) => {
        const group = filteredGroups[groupConfig.name];
        if (!group || !group.products?.length) return null;
        
        return (
        <motion.div
          key={groupConfig.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.2 }}
          className="space-y-4"
        >
          {/* Título do grupo */}
          <div className="flex items-center space-x-3">
            <div 
              className="p-3 rounded-lg border"
              style={{ 
                backgroundColor: `${groupConfig.color}20`, 
                borderColor: `${groupConfig.color}50` 
              }}
            >
              <span className="text-2xl">{groupConfig.icon}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{groupConfig.title}</h2>
              <p className="text-white/60 text-sm">{group.products.length} produto(s)</p>
            </div>
          </div>

          {/* Grid de produtos do grupo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {group.products.map((product, productIndex) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (groupIndex * 0.2) + (productIndex * 0.1) }}
              >
                <Card 
                  className="glass-effect border-white/20 card-hover border-l-4"
                  style={{ borderLeftColor: `${groupConfig.color}80` }}
                >
                  <CardHeader className="pb-3">
                    {/* Indicador de categoria */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="flex items-center space-x-1 text-xs font-medium"
                          style={{ color: groupConfig.color }}
                        >
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: groupConfig.color }}
                          ></span>
                          <span>{groupConfig.title.toUpperCase()}</span>
                        </div>
                      </div>
                      {product.category && (
                        <span className="text-white/50 text-xs">{product.category.name}</span>
                      )}
                    </div>

                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-slate-500/20 to-gray-500/20 rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-4xl">{groupConfig.icon}</span>
                      </div>
                    )}
                    <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Preço:</span>
                        <span className="text-xl font-bold text-green-400">
                          R$ {Number(product.price ?? 0).toFixed(2)}
                        </span>
                      </div>
                      
                      {product.description && (
                        <p className="text-white/60 text-sm">{product.description}</p>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product._id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
        );
      })}

      {/* Mensagem quando não há produtos */}
      {totalFilteredProducts === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </h3>
          <p className="text-white/60">
            {searchTerm 
              ? 'Tente buscar por outro termo'
              : 'Comece cadastrando seus primeiros produtos!'
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Componente exportado que envolve com ErrorBoundary
const Products = () => (
  <ProductsErrorBoundary>
    <ProductsInner />
  </ProductsErrorBoundary>
);

export default Products;