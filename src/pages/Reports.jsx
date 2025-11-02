import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [cashRegisterHistory, setCashRegisterHistory] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [filteredData, setFilteredData] = useState({
    sales: [],
    products: [],
    cashRegister: []
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [sales, dateFilter]);

  const loadData = () => {
    const salesData = JSON.parse(localStorage.getItem('sales') || '[]');
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    const cashData = JSON.parse(localStorage.getItem('cashRegisterHistory') || '[]');
    
    setSales(salesData);
    setProducts(productsData);
    setCashRegisterHistory(cashData);
  };

  const filterData = () => {
    let filtered = sales;

    if (dateFilter.start && dateFilter.end) {
      const startDate = new Date(dateFilter.start);
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);

      filtered = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    setFilteredData({
      sales: filtered,
      products: products,
      cashRegister: cashRegisterHistory
    });
  };

  const getSalesByProduct = () => {
    const productSales = {};
    
    filteredData.sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.name].quantity += item.quantity;
        productSales[item.name].revenue += item.price * item.quantity;
      });
    });

    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
  };

  const getSalesByPaymentMethod = () => {
    const paymentSales = {
      money: 0,
      credit: 0,
      debit: 0,
      pix: 0
    };

    filteredData.sales.forEach(sale => {
      sale.paymentMethods.forEach(payment => {
        paymentSales[payment.method] += payment.amount;
      });
    });

    return paymentSales;
  };

  const getSalesByDay = () => {
    const dailySales = {};

    filteredData.sales.forEach(sale => {
      const day = new Date(sale.date).toDateString();
      if (!dailySales[day]) {
        dailySales[day] = {
          date: day,
          sales: 0,
          revenue: 0
        };
      }
      dailySales[day].sales += 1;
      dailySales[day].revenue += sale.total;
    });

    return Object.values(dailySales).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getSalesByOperator = () => {
    const operatorSales = {};

    filteredData.sales.forEach(sale => {
      if (!operatorSales[sale.operator]) {
        operatorSales[sale.operator] = {
          name: sale.operator,
          sales: 0,
          revenue: 0
        };
      }
      operatorSales[sale.operator].sales += 1;
      operatorSales[sale.operator].revenue += sale.total;
    });

    return Object.values(operatorSales);
  };

  const exportReport = (reportType) => {
    toast({
      title: "🚧 Funcionalidade não implementada ainda",
      description: "Mas não se preocupe! Você pode solicitar isso no seu próximo prompt! 🚀"
    });
  };

  const productSales = getSalesByProduct();
  const paymentMethodSales = getSalesByPaymentMethod();
  const dailySales = getSalesByDay();
  const operatorSales = getSalesByOperator();

  const totalRevenue = filteredData.sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSales = filteredData.sales.length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Relatórios</h1>
          <p className="text-white/70">Análise completa das vendas e operações</p>
        </div>
        
        <Button onClick={() => exportReport('general')} className="btn-gradient">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </motion.div>

      {/* Date Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-white">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-white">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total de Vendas', value: totalSales, color: 'text-blue-400' },
          { title: 'Faturamento', value: `R$ ${totalRevenue.toFixed(2)}`, color: 'text-green-400' },
          { title: 'Ticket Médio', value: `R$ ${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : '0.00'}`, color: 'text-purple-400' },
          { title: 'Produtos Ativos', value: products.length, color: 'text-orange-400' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="glass-effect border-white/20">
              <CardContent className="p-4 text-center">
                <p className="text-white/70 text-sm">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Reports Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white/10">
            <TabsTrigger value="products" className="text-white">Produtos</TabsTrigger>
            <TabsTrigger value="payment" className="text-white">Pagamentos</TabsTrigger>
            <TabsTrigger value="daily" className="text-white">Diário</TabsTrigger>
            <TabsTrigger value="operators" className="text-white">Operadores</TabsTrigger>
            <TabsTrigger value="cash" className="text-white">Caixa</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vendas por Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {productSales.map((product, index) => (
                    <div key={product.name} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{product.name}</p>
                        <p className="text-white/60 text-sm">{product.quantity} unidades vendidas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">R$ {product.revenue.toFixed(2)}</p>
                        <p className="text-white/60 text-sm">#{index + 1} em vendas</p>
                      </div>
                    </div>
                  ))}
                  {productSales.length === 0 && (
                    <p className="text-white/60 text-center py-8">Nenhuma venda encontrada no período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vendas por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(paymentMethodSales).map(([method, amount]) => {
                    const methodNames = {
                      money: 'Dinheiro',
                      credit: 'Cartão de Crédito',
                      debit: 'Cartão de Débito',
                      pix: 'PIX'
                    };
                    
                    return (
                      <div key={method} className="p-4 rounded-lg bg-white/5 text-center">
                        <p className="text-white/70 text-sm">{methodNames[method]}</p>
                        <p className="text-2xl font-bold text-green-400">R$ {amount.toFixed(2)}</p>
                        <p className="text-white/60 text-sm">
                          {totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0}% do total
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vendas Diárias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dailySales.map((day) => (
                    <div key={day.date} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">
                          {new Date(day.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-white/60 text-sm">{day.sales} vendas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">R$ {day.revenue.toFixed(2)}</p>
                        <p className="text-white/60 text-sm">
                          Ticket: R$ {day.sales > 0 ? (day.revenue / day.sales).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {dailySales.length === 0 && (
                    <p className="text-white/60 text-center py-8">Nenhuma venda encontrada no período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operators">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vendas por Operador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {operatorSales.map((operator) => (
                    <div key={operator.name} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                      <div>
                        <p className="text-white font-medium">{operator.name}</p>
                        <p className="text-white/60 text-sm">{operator.sales} vendas realizadas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">R$ {operator.revenue.toFixed(2)}</p>
                        <p className="text-white/60 text-sm">
                          Ticket: R$ {operator.sales > 0 ? (operator.revenue / operator.sales).toFixed(2) : '0.00'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {operatorSales.length === 0 && (
                    <p className="text-white/60 text-center py-8">Nenhuma venda encontrada no período</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Fechamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cashRegisterHistory.map((close) => (
                    <div key={close.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-medium">
                            {new Date(close.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-white/60 text-sm">
                            {new Date(close.date).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold">
                            R$ {close.totalSales.toFixed(2)}
                          </p>
                          <p className={`text-sm ${
                            close.differences.total >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {close.differences.total >= 0 ? '+' : ''}R$ {close.differences.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-white/60 text-sm">
                        Operador: {close.operator}
                      </p>
                    </div>
                  ))}
                  {cashRegisterHistory.length === 0 && (
                    <p className="text-white/60 text-center py-8">Nenhum fechamento de caixa registrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Reports;