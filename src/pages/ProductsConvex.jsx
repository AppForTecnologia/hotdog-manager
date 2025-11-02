import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Componente de gerenciamento de produtos integrado com Convex
 * Permite criar, editar, excluir e visualizar produtos do cardápio
 * @returns {JSX.Element} Componente de produtos
 */
const ProductsConvex = () => {
  // Estados locais
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    category: 'hotdogs',
    ingredients: [],
    available: true,
    imageUrl: '',
    preparationTime: 15
  });

  // Queries do Convex
  const products = useQuery(api.products.getAvailableProducts);
  const categories = useQuery(api.products.getCategories);

  // Mutations do Convex
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const deleteProduct = useMutation(api.products.deleteProduct);

  /**
   * Manipula o envio do formulário de produto
   * @param {Event} e - Evento do formulário
   */
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price) {
      toast({ 
        title: "Erro", 
        description: "Nome e preço são obrigatórios!", 
        variant: "destructive" 
      });
      return;
    }

    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        ingredients: productForm.ingredients,
        available: productForm.available,
        imageUrl: productForm.imageUrl,
        preparationTime: parseInt(productForm.preparationTime),
      };

      if (editingProduct) {
        await updateProduct({
          productId: editingProduct._id,
          ...productData
        });
        toast({ 
          title: "Sucesso!", 
          description: "Produto atualizado com sucesso!" 
        });
      } else {
        await createProduct(productData);
        toast({ 
          title: "Sucesso!", 
          description: "Produto cadastrado com sucesso!" 
        });
      }

      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        price: '',
        description: '',
        category: 'hotdogs',
        ingredients: [],
        available: true,
        imageUrl: '',
        preparationTime: 15
      });
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar produto: " + error.message, 
        variant: "destructive" 
      });
    }
  };

  /**
   * Inicia a edição de um produto
   * @param {Object} product - Produto a ser editado
   */
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      price: product.price ? product.price.toString() : '',
      description: product.description || '',
      category: product.category || 'hotdogs',
      ingredients: product.ingredients || [],
      available: product.available !== undefined ? product.available : true,
      imageUrl: product.imageUrl || '',
      preparationTime: product.preparationTime || 15
    });
    setIsProductDialogOpen(true);
  };

  /**
   * Exclui um produto
   * @param {string} productId - ID do produto
   */
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct({ productId });
      toast({ 
        title: "Produto removido", 
        description: "Produto excluído com sucesso!" 
      });
    } catch (error) {
      toast({ 
        title: "Erro", 
        description: "Erro ao excluir produto: " + error.message, 
        variant: "destructive" 
      });
    }
  };

  // Filtra produtos baseado na busca e categoria
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || product.category === activeTab;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o cardápio da sua lanchonete</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Nome do Produto</Label>
                  <Input 
                    id="name" 
                    value={productForm.name} 
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })} 
                    placeholder="Ex: Hot Dog Tradicional" 
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-foreground">Preço (R$)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="0.01" 
                      value={productForm.price} 
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })} 
                      placeholder="0.00" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-foreground">Categoria</Label>
                    <select 
                      id="category" 
                      value={productForm.category} 
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })} 
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="hotdogs">Hot Dogs</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="acompanhamentos">Acompanhamentos</option>
                      <option value="sobremesas">Sobremesas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preparationTime" className="text-foreground">Tempo de Preparo (min)</Label>
                    <Input 
                      id="preparationTime" 
                      type="number" 
                      value={productForm.preparationTime} 
                      onChange={e => setProductForm({ ...productForm, preparationTime: e.target.value })} 
                      placeholder="15" 
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <input 
                      type="checkbox" 
                      id="available" 
                      checked={productForm.available} 
                      onChange={e => setProductForm({ ...productForm, available: e.target.checked })} 
                      className="rounded"
                    />
                    <Label htmlFor="available" className="text-foreground">Disponível</Label>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-foreground">Descrição</Label>
                  <Textarea 
                    id="description" 
                    value={productForm.description} 
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
                    placeholder="Ingredientes, observações especiais..." 
                  />
                </div>
                
                <div>
                  <Label htmlFor="imageUrl" className="text-foreground">URL da Foto</Label>
                  <Input 
                    id="imageUrl" 
                    value={productForm.imageUrl} 
                    onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })} 
                    placeholder="https://exemplo.com/foto.jpg" 
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
                      setIsProductDialogOpen(false); 
                      setEditingProduct(null); 
                      setProductForm({
                        name: '',
                        price: '',
                        description: '',
                        category: 'hotdogs',
                        ingredients: [],
                        available: true,
                        imageUrl: '',
                        preparationTime: 15
                      }); 
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Tabs de categorias */}
      {categories && categories.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Campo de busca */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }} 
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Buscar produtos..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="pl-10" 
        />
      </motion.div>

      {/* Grid de produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div 
            key={product._id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-effect card-hover">
              <CardHeader className="pb-3">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-32 object-cover rounded-lg mb-3" 
                  />
                ) : (
                  <div className="w-full h-32 bg-accent rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-4xl">🌭</span>
                  </div>
                )}
                <CardTitle className="text-foreground text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground capitalize">
                      {product.category}
                    </span>
                    <span className="text-xl font-bold text-green-400">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {product.preparationTime} min
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.available ? 'Disponível' : 'Indisponível'}
                    </span>
                  </div>
                  
                  {product.description && (
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProduct(product)} 
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProduct(product._id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Estado vazio */}
      {filteredProducts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Tente buscar por outro termo' : "Clique em 'Novo produto' para começar."}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ProductsConvex;
