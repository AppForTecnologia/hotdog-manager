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

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    totalProducts: 0,
    averageTicket: 0,
    openOrders: 0,
    activeOperators: 1
  });

  useEffect(() => {
    // Dados mockados para evitar erros de localStorage
    const mockStats = {
      todaySales: 1250.50,
      todayOrders: 15,
      totalProducts: 25,
      averageTicket: 83.37,
      openOrders: 3,
      activeOperators: 1
    };
    
    setStats(mockStats);
  }, []);

  const statCards = [
    {
      title: 'Vendas Hoje',
      value: `R$ ${stats.todaySales.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      change: '+12%'
    },
    {
      title: 'Pedidos Hoje',
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-600',
      change: '+8%'
    },
    {
      title: 'Produtos Cadastrados',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-slate-500 to-gray-600',
      change: '+2%'
    },
    {
      title: 'Ticket Médio',
      value: `R$ ${stats.averageTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-orange-500 to-amber-600',
      change: '+5%'
    },
    {
      title: 'Pedidos Abertos',
      value: stats.openOrders,
      icon: Clock,
      color: 'from-yellow-500 to-orange-600',
      change: '-3%'
    },
    {
      title: 'Operadores Ativos',
      value: stats.activeOperators,
      icon: Users,
      color: 'from-indigo-500 to-blue-600',
      change: '0%'
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
                <p className="text-xs text-green-400">
                  {stat.change} em relação a ontem
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
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">Comanda #{item.toString().padStart(3, '0')}</p>
                      <p className="text-white/60 text-sm">Mesa {item}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">R$ {(15.50 * item).toFixed(2)}</p>
                      <p className="text-green-400 text-sm">Pago</p>
                    </div>
                  </div>
                ))}
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
                {[
                  { name: 'Hot Dog Tradicional', sales: 25 },
                  { name: 'Hot Dog Especial', sales: 18 },
                  { name: 'Refrigerante', sales: 32 }
                ].map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-white font-medium">{product.name}</p>
                      <p className="text-white/60 text-sm">#{index + 1} mais vendido</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{product.sales} vendas</p>
                      <div className="w-20 h-2 bg-white/20 rounded-full mt-1">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full"
                          style={{ width: `${(product.sales / 32) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;