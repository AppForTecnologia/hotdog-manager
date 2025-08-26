import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Reports = () => {
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [filteredData, setFilteredData] = useState({
    sales: [],
    products: [],
    cashRegister: []
  });

  // Buscar dados do Convex
  const sales = useQuery(api.sales.listAll) || [];
  const products = useQuery(api.products.listActive) || [];
  const cashRegisterHistory = useQuery(api.cashRegister.listAll) || [];

  console.log('📊 Dados carregados:', { sales, products, cashRegisterHistory });

  useEffect(() => {
    filterData();
  }, [sales, products, cashRegisterHistory, dateFilter]);

  const filterData = () => {
    let filtered = sales;

    if (dateFilter.start && dateFilter.end) {
      const startDate = new Date(dateFilter.start);
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);

      filtered = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    setFilteredData({
      sales: filtered,
      products: products,
      cashRegister: cashRegisterHistory
    });

    console.log('🔍 Dados filtrados:', filteredData);
  };

  const getSalesByPaymentMethod = () => {
    const paymentSales = {
      money: 0,
      credit: 0,
      debit: 0,
      pix: 0
    };

    filteredData.sales.forEach(sale => {
      const method = sale.paymentMethod;
      if (paymentSales.hasOwnProperty(method)) {
        paymentSales[method] += sale.total;
      }
    });

    return paymentSales;
  };

  const getSalesByDay = () => {
    const dailySales = {};

    filteredData.sales.forEach(sale => {
      const day = new Date(sale.saleDate).toDateString();
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

  const getTotalRevenue = () => {
    return filteredData.sales.reduce((total, sale) => total + sale.total, 0);
  };

  const getTotalSales = () => {
    return filteredData.sales.length;
  };

  const getAverageTicket = () => {
    if (filteredData.sales.length === 0) return 0;
    return getTotalRevenue() / getTotalSales();
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
          <h1 className="text-2xl font-bold text-white mb-2">Relatórios</h1>
        <p className="text-white/70">Análise de vendas e desempenho do negócio</p>
      </motion.div>

      {/* Filtros de Data */}
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

      {/* Cards de Resumo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total de Vendas</p>
                <p className="text-2xl font-bold text-white">{getTotalSales()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-green-400">R$ {getTotalRevenue().toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold text-yellow-400">R$ {getAverageTicket().toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Produtos Ativos</p>
                <p className="text-2xl font-bold text-purple-400">{products.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
              </CardContent>
            </Card>
          </motion.div>

      {/* Abas de Relatórios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="payment-methods" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
            <TabsTrigger value="payment-methods" className="text-white data-[state=active]:bg-white/20">
              Formas de Pagamento
            </TabsTrigger>
            <TabsTrigger value="daily-sales" className="text-white data-[state=active]:bg-white/20">
              Vendas Diárias
            </TabsTrigger>
            <TabsTrigger value="cash-register" className="text-white data-[state=active]:bg-white/20">
              Caixa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment-methods" className="mt-6">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vendas por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(getSalesByPaymentMethod()).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white capitalize">{method}</span>
                      <span className="text-green-400 font-bold">R$ {amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily-sales" className="mt-6">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Vendas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getSalesByDay().map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white">{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                      <div className="text-right">
                        <p className="text-white">{day.sales} vendas</p>
                        <p className="text-green-400 font-bold">R$ {day.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash-register" className="mt-6">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.cashRegister.length === 0 ? (
                    <p className="text-white/60 text-center py-8">Nenhum registro de caixa encontrado</p>
                  ) : (
                    filteredData.cashRegister.map((record) => (
                      <div key={record._id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">
                            {new Date(record.closeDate).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-green-400 font-bold">
                            R$ {record.totalCount.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                          <span>Dinheiro: R$ {record.moneyCount.toFixed(2)}</span>
                          <span>Crédito: R$ {record.creditCount.toFixed(2)}</span>
                          <span>Débito: R$ {record.debitCount.toFixed(2)}</span>
                          <span>PIX: R$ {record.pixCount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Debug Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Informações de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-white/60">
              <p>Vendas carregadas: {sales.length}</p>
              <p>Produtos carregados: {products.length}</p>
              <p>Registros de caixa: {cashRegisterHistory.length}</p>
              <p>Vendas filtradas: {filteredData.sales.length}</p>
              <p>Data inicial: {dateFilter.start || 'Não definida'}</p>
              <p>Data final: {dateFilter.end || 'Não definida'}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Reports;