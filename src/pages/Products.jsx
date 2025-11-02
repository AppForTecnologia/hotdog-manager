import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Tag, X, GlassWater } from 'lucide-react';
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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    categoryId: ''
  });
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    const savedCategories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    if (savedCategories.length === 0) {
      const defaultCategories = [{ id: 1, name: 'Lanches' }, { id: 2, name: 'Bebidas' }];
      localStorage.setItem('categories', JSON.stringify(defaultCategories));
      setCategories(defaultCategories);
    } else {
      setCategories(savedCategories);
    }
    setProducts(savedProducts);
  }, []);

  const saveProducts = (newProducts) => {
    localStorage.setItem('products', JSON.stringify(newProducts));
    setProducts(newProducts);
  };

  const saveCategories = (newCategories) => {
    localStorage.setItem('categories', JSON.stringify(newCategories));
    setCategories(newCategories);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.price) {
      toast({ title: "Erro", description: "Nome e preço são obrigatórios!", variant: "destructive" });
      return;
    }
    if (!productForm.categoryId) {
      toast({ title: "Erro", description: "Selecione uma categoria para o produto.", variant: "destructive" });
      return;
    }

    const productData = {
      id: editingProduct ? editingProduct.id : Date.now(),
      ...productForm,
      price: parseFloat(productForm.price),
      categoryId: parseInt(productForm.categoryId),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    const newProducts = editingProduct
      ? products.map(p => p.id === editingProduct.id ? productData : p)
      : [...products, productData];
    
    saveProducts(newProducts);
    toast({ title: "Sucesso!", description: `Produto ${editingProduct ? 'atualizado' : 'cadastrado'} com sucesso!` });
    setIsProductDialogOpen(false);
    setEditingProduct(null);
    setProductForm({ name: '', price: '', description: '', image: '', categoryId: '' });
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      price: product.price ? product.price.toString() : '',
      description: product.description || '',
      image: product.image || '',
      categoryId: product.categoryId ? product.categoryId.toString() : ''
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (id) => {
    saveProducts(products.filter(p => p.id !== id));
    toast({ title: "Produto removido", description: "Produto excluído com sucesso!" });
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({ title: "Erro", description: "Informe um nome de categoria.", variant: "destructive" });
      return;
    }
    const isDuplicate = categories.some(c => c.name.toLowerCase() === categoryName.trim().toLowerCase() && c.id !== editingCategory?.id);
    if (isDuplicate) {
      toast({ title: "Erro", description: "Esta categoria já existe.", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      saveCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: categoryName.trim() } : c));
      toast({ title: "Sucesso!", description: "Categoria atualizada." });
    } else {
      saveCategories([...categories, { id: Date.now(), name: categoryName.trim() }]);
      toast({ title: "Sucesso!", description: "Categoria criada." });
    }
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleDeleteCategory = (id) => {
    const isLinked = products.some(p => p.categoryId === id);
    if (isLinked) {
      toast({ title: "Ação bloqueada", description: "Há produtos vinculados a esta categoria.", variant: "destructive" });
      return;
    }
    saveCategories(categories.filter(c => c.id !== id));
    toast({ title: "Sucesso!", description: "Categoria excluída." });
  };

  const filteredProducts = products
    .filter(product => activeTab === 'all' || product.categoryId === parseInt(activeTab))
    .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const beverageCategory = categories.find(c => c.name.toLowerCase() === 'bebidas');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o cardápio da sua lanchonete</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Tag className="h-4 w-4 mr-2" />Gerenciar Categorias</Button>
            </DialogTrigger>
            <DialogContent className="glass-effect">
              <DialogHeader><DialogTitle className="text-foreground">Categorias</DialogTitle></DialogHeader>
              <form onSubmit={handleCategorySubmit} className="flex gap-2">
                <Input value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Nome da categoria" />
                <Button type="submit">{editingCategory ? 'Atualizar' : 'Criar'}</Button>
              </form>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded bg-accent">
                    <span className="text-foreground">{cat.name}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(cat); setCategoryName(cat.name); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente a categoria.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient"><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="glass-effect">
              <DialogHeader><DialogTitle className="text-foreground">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Nome do Produto</Label>
                  <Input id="name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Hot Dog Tradicional" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-foreground">Preço (R$)</Label>
                    <Input id="price" type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-foreground">Categoria</Label>
                    <select id="category" value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="" className="bg-gray-800 text-white">Selecione...</option>
                      {categories.map(c => <option key={c.id} value={c.id} className="bg-gray-800 text-white">{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="text-foreground">Observações</Label>
                  <Textarea id="description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} placeholder="Ingredientes, observações especiais..." />
                </div>
                <div>
                  <Label htmlFor="image" className="text-foreground">URL da Foto</Label>
                  <Input id="image" value={productForm.image} onChange={e => setProductForm({ ...productForm, image: e.target.value })} placeholder="https://exemplo.com/foto.jpg" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-gradient flex-1">{editingProduct ? 'Atualizar' : 'Cadastrar'}</Button>
                  <Button type="button" variant="outline" onClick={() => { setIsProductDialogOpen(false); setEditingProduct(null); setProductForm({ name: '', price: '', description: '', image: '', categoryId: '' }); }}>Cancelar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id.toString()}>{cat.name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Buscar produtos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="glass-effect card-hover">
              <CardHeader className="pb-3">
                {product.image ? <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" /> : <div className="w-full h-32 bg-accent rounded-lg mb-3 flex items-center justify-center"><span className="text-4xl">{product.categoryId === beverageCategory?.id ? <GlassWater /> : '🌭'}</span></div>}
                <CardTitle className="text-foreground text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{categories.find(c => c.id === product.categoryId)?.name || 'Sem categoria'}</span>
                    <span className="text-xl font-bold text-green-400">R$ {product.price.toFixed(2)}</span>
                  </div>
                  {product.description && <p className="text-muted-foreground text-sm">{product.description}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)} className="flex-1"><Edit className="h-4 w-4 mr-1" />Editar</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1"><Trash2 className="h-4 w-4 mr-1" />Excluir</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o produto.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Excluir</AlertDialogAction>
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

      {filteredProducts.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</h3>
          <p className="text-muted-foreground">{searchTerm ? 'Tente buscar por outro termo' : "Clique em 'Novo produto' para começar."}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Products;