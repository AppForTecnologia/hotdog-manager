
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, UserPlus } from 'lucide-react';
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

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const savedClients = JSON.parse(localStorage.getItem('clients') || '[]');
    setClients(savedClients);
  }, []);

  const saveClients = (newClients) => {
    localStorage.setItem('clients', JSON.stringify(newClients));
    setClients(newClients);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!clientForm.name || !clientForm.phone) {
      toast({ title: "Erro", description: "Nome e telefone são obrigatórios!", variant: "destructive" });
      return;
    }

    const clientData = {
      id: editingClient ? editingClient.id : Date.now(),
      name: clientForm.name,
      phone: clientForm.phone,
      address: clientForm.address,
      notes: clientForm.notes,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newClients = editingClient
      ? clients.map(c => c.id === editingClient.id ? clientData : c)
      : [...clients, clientData];
    
    saveClients(newClients);
    toast({ title: "Sucesso!", description: `Cliente ${editingClient ? 'atualizado' : 'cadastrado'} com sucesso!` });
    setIsDialogOpen(false);
    setEditingClient(null);
    setClientForm({ name: '', phone: '', address: '', notes: '' });
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      phone: client.phone,
      address: client.address || '',
      notes: client.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    saveClients(clients.filter(c => c.id !== id));
    toast({ title: "Cliente removido", description: "Cliente excluído com sucesso!" });
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua base de clientes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient" onClick={() => { setEditingClient(null); setClientForm({ name: '', phone: '', address: '', notes: '' }); }}>
              <Plus className="h-4 w-4 mr-2" />Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect">
            <DialogHeader><DialogTitle className="text-foreground">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle></DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
                <Input id="name" value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} placeholder="Nome do cliente" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-foreground">Telefone</Label>
                <Input id="phone" value={clientForm.phone} onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="(00) 90000-0000" />
              </div>
              <div>
                <Label htmlFor="address" className="text-foreground">Endereço (opcional)</Label>
                <Input id="address" value={clientForm.address} onChange={e => setClientForm({ ...clientForm, address: e.target.value })} placeholder="Rua, número, bairro..." />
              </div>
              <div>
                <Label htmlFor="notes" className="text-foreground">Observações (opcional)</Label>
                <Textarea id="notes" value={clientForm.notes} onChange={e => setClientForm({ ...clientForm, notes: e.target.value })} placeholder="Preferências, pontos de referência..." />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="btn-gradient flex-1">{editingClient ? 'Atualizar' : 'Cadastrar'}</Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="Buscar por nome ou telefone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </motion.div>

      <div className="space-y-4">
        {filteredClients.map((client, index) => (
          <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="glass-effect card-hover">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                  {client.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(client)}><Edit className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(client.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <UserPlus className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-2xl font-bold text-foreground">{searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</h3>
          <p className="text-muted-foreground">{searchTerm ? 'Tente buscar por outro termo' : "Clique em 'Novo Cliente' para começar."}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Clients;
