import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Filter, Download, Package, TrendingUp, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

  const getPaymentMethodLabel = (method) => {
    const labels = {
      money: 'Dinheiro',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      pix: 'PIX'
    };
    return labels[method] || method;
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

  /**
   * Calcula margem de lucro estimada
   * @returns {number} Margem de lucro estimada em porcentagem
   */
  const getEstimatedProfitMargin = () => {
    // Estimativa baseada em produtos com preço de custo
    const productsWithCost = products.filter(p => p.costPrice);
    if (productsWithCost.length === 0) return 0;

    const totalCost = productsWithCost.reduce((sum, p) => sum + (p.costPrice || 0), 0);
    const totalRevenue = getTotalRevenue();
    
    if (totalRevenue === 0) return 0;
    
    return ((totalRevenue - totalCost) / totalRevenue) * 100;
  };

  /**
   * Exporta dados para Excel
   * @param {string} dataType - Tipo de dados a exportar
   */
  const exportToExcel = (dataType) => {
    let data = [];
    let filename = '';

    switch (dataType) {
      case 'sales':
        data = filteredData.sales.map((sale, index) => ({
          'Data': new Date(sale.saleDate).toLocaleDateString('pt-BR'),
          'Número da Venda': `Venda #${index + 1}`,
          'Total': sale.total,
          'Forma de Pagamento': getPaymentMethodLabel(sale.paymentMethod),
          'Tipo': sale.saleType
        }));
        filename = `vendas_${dateFilter.start || 'todas'}_${dateFilter.end || 'todas'}.xlsx`;
        break;
      case 'products':
        data = filteredData.products.map(product => ({
          'Produto': product.name,
          'Categoria': product.categoryId,
          'Preço': product.price,
          'Status': product.isActive ? 'Ativo' : 'Inativo'
        }));
        filename = 'produtos.xlsx';
        break;
      default:
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Exportação Excel realizada",
      description: `Dados exportados para ${filename}`,
    });
  };

  /**
   * Exporta dados para PDF
   * @param {string} dataType - Tipo de dados a exportar
   */
  const exportToPDF = (dataType) => {
    const doc = new jsPDF();
    let data = [];
    let title = '';
    let filename = '';

    switch (dataType) {
      case 'sales':
        data = filteredData.sales.map((sale, index) => [
          new Date(sale.saleDate).toLocaleDateString('pt-BR'),
          `Venda #${index + 1}`,
          `R$ ${sale.total.toFixed(2)}`,
          getPaymentMethodLabel(sale.paymentMethod),
          sale.saleType
        ]);
        title = 'Relatório de Vendas';
        filename = `vendas_${dateFilter.start || 'todas'}_${dateFilter.end || 'todas'}.pdf`;
        break;
      case 'products':
        data = filteredData.products.map(product => [
          product.name,
          product.categoryId,
          `R$ ${product.price.toFixed(2)}`,
          product.isActive ? 'Ativo' : 'Inativo'
        ]);
        title = 'Relatório de Produtos';
        filename = 'produtos.pdf';
        break;
      default:
        return;
    }

    // Adicionar título
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    // Adicionar data de geração
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    // Adicionar tabela
    const headers = dataType === 'sales' 
      ? ['Data', 'Número da Venda', 'Total', 'Forma de Pagamento', 'Tipo']
      : ['Produto', 'Categoria', 'Preço', 'Status'];
    
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 }
    });

    doc.save(filename);
    
    toast({
      title: "Exportação PDF realizada",
      description: `Dados exportados para ${filename}`,
    });
  };

  /**
   * Exporta dados para CSV
   * @param {string} dataType - Tipo de dados a exportar
   */
  const exportToCSV = (dataType) => {
    let csvContent = '';
    let filename = '';

    switch (dataType) {
      case 'sales':
        csvContent = 'Data,Número da Venda,Total,Forma Pagamento,Tipo\n';
        filteredData.sales.forEach((sale, index) => {
          csvContent += `${new Date(sale.saleDate).toLocaleDateString('pt-BR')},Venda #${index + 1},${sale.total},${sale.paymentMethod},${sale.saleType}\n`;
        });
        filename = `vendas_${dateFilter.start || 'todas'}_${dateFilter.end || 'todas'}.csv`;
        break;
      case 'products':
        csvContent = 'Produto,Categoria,Preço,Status\n';
        filteredData.products.forEach(product => {
          csvContent += `${product.name},${product.categoryId},${product.price},${product.isActive ? 'Ativo' : 'Inativo'}\n`;
        });
        filename = 'produtos.csv';
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    toast({
      title: "Exportação CSV realizada",
      description: `Dados exportados para ${filename}`,
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
          <h1 className="text-2xl font-bold text-white mb-2">Relatórios e Analytics</h1>
        <p className="text-white/70">Análise completa de vendas, produção e desempenho do negócio</p>
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
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={() => setDateFilter({ start: '', end: '' })} 
                variant="outline" 
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
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
              <Package className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Margem Estimada</p>
                <p className="text-2xl font-bold text-green-400">{getEstimatedProfitMargin().toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
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
          <TabsList className="grid w-full grid-cols-4 bg-white/10 border-white/20">
            <TabsTrigger value="payment-methods" className="text-white data-[state=active]:bg-white/20">
              Formas de Pagamento
            </TabsTrigger>
            <TabsTrigger value="daily-sales" className="text-white data-[state=active]:bg-white/20">
              Vendas Diárias
            </TabsTrigger>
            <TabsTrigger value="products" className="text-white data-[state=active]:bg-white/20">
              Produtos
            </TabsTrigger>
            <TabsTrigger value="cash-register" className="text-white data-[state=active]:bg-white/20">
              Caixa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment-methods" className="mt-6">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Vendas por Forma de Pagamento</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => exportToCSV('sales')} 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button 
                      onClick={() => exportToExcel('sales')} 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button 
                      onClick={() => exportToPDF('sales')} 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(getSalesByPaymentMethod()).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white">{getPaymentMethodLabel(method)}</span>
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

          <TabsContent value="products" className="mt-6">
            <Card className="glass-effect border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Relatório de Produtos</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => exportToCSV('products')} 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button 
                      onClick={() => exportToExcel('products')} 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                    <Button 
                      onClick={() => exportToPDF('products')} 
                      variant="outline" 
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.products.map((product) => (
                    <div key={product._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{product.name}</span>
                        <p className="text-sm text-white/60">Categoria: {product.categoryId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">R$ {product.price.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {product.isActive ? 'Ativo' : 'Inativo'}
                        </span>
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


    </div>
  );
};

export default Reports;