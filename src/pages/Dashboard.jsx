import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    averageTicket: 0,
    openOrders: 0,
    activeOperators: 0,
    salesChange: 0,
    ordersChange: 0
  });

  // Buscar dados do Convex
  const sales = useQuery(api.sales.listAll) || [];
  const products = useQuery(api.products.listActive) || [];
  const users = useQuery(api.users.listActive) || [];

  useEffect(() => {
    if (sales && products && users) {
      // Calcular estatísticas reais
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Vendas de hoje (apenas pagas)
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= today && sale.status === 'paga';
      });
      
      // Vendas de ontem para comparação
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const yesterdaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= yesterday && saleDate < today && sale.status === 'paga';
      });
      
      const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
      const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);
      const avgTicket = todaySales.length > 0 ? totalRevenue / todaySales.length : 0;
      
      const openOrders = sales.filter(sale => sale.status === 'pendente').length;
      
      // Calcular variação percentual
      const salesChange = yesterdayRevenue > 0 ? ((totalRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0;
      const ordersChange = yesterdaySales.length > 0 ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length * 100) : 0;
      
      setStats({
        todaySales: totalRevenue,
        todayOrders: todaySales.length,
        totalProducts: products.length,
        averageTicket: avgTicket,
        openOrders: openOrders,
        activeOperators: users.length,
        salesChange: salesChange,
        ordersChange: ordersChange
      });
    }
  }, [sales, products, users]);

  const statCards = [
    {
      title: 'Vendas Hoje',
      value: `R$ ${stats.todaySales.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      change: `${stats.salesChange >= 0 ? '+' : ''}${stats.salesChange.toFixed(1)}%`,
      changeColor: stats.salesChange >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      title: 'Pedidos Hoje',
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-600',
      change: `${stats.ordersChange >= 0 ? '+' : ''}${stats.ordersChange.toFixed(1)}%`,
      changeColor: stats.ordersChange >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      title: 'Produtos Cadastrados',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-slate-500 to-gray-600',
      change: 'Total',
      changeColor: 'text-blue-400'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${stats.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-600',
      change: 'Média',
      changeColor: 'text-orange-400'
    },
    {
      title: 'Pedidos Abertos',
      value: stats.openOrders,
      icon: Clock,
      color: 'from-yellow-500 to-orange-600',
      change: 'Pendentes',
      changeColor: 'text-yellow-400'
    },
    {
      title: 'Operadores Ativos',
      value: stats.activeOperators,
      icon: Users,
      color: 'from-indigo-500 to-blue-600',
      change: 'Online',
      changeColor: 'text-indigo-400'
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Bem-vindo ao HotDog AppFor! 🌭
        </h1>
        <p className="text-white/70">
          Gerencie sua lanchonete com facilidade e eficiência
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-effect border-white/20 card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <p className={`text-xs ${stat.changeColor}`}>
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales.length > 0 ? (
                  sales
                    .filter(sale => sale.status === 'paga')
                    .slice(0, 5)
                    .map((sale, index) => (
                      <div key={sale._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">
                            {sale.notes ? sale.notes : `Venda #${sale._id.slice(-6)}`}
                          </p>
                          <p className="text-white/60 text-sm">
                            {new Date(sale.saleDate).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">R$ {sale.total.toFixed(2)}</p>
                          <p className="text-green-400 text-sm capitalize">{sale.paymentMethod}</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>Nenhuma venda encontrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.length > 0 ? (
                  products
                    .filter(product => product.stock > 0)
                    .slice(0, 5)
                    .map((product, index) => (
                      <div key={product._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{product.name}</p>
                          <p className="text-white/60 text-sm">#{index + 1} em estoque</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{product.stock} unidades</p>
                          <div className="w-20 h-2 bg-white/20 rounded-full mt-1">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"
                              style={{ width: `${(product.stock / Math.max(...products.map(p => p.stock))) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-white/60">
                    <p>Nenhum produto cadastrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;