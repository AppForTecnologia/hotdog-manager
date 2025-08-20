import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, TrendingUp, TrendingDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

const CashRegister = () => {
  const [todaySales, setTodaySales] = useState([]);
  const [cashCounts, setCashCounts] = useState({
    money: '',
    credit: '',
    debit: '',
    pix: ''
  });
  const [salesSummary, setSalesSummary] = useState({
    money: 0,
    credit: 0,
    debit: 0,
    pix: 0,
    total: 0
  });
  const [differences, setDifferences] = useState({
    money: 0,
    credit: 0,
    debit: 0,
    pix: 0,
    total: 0
  });

  useEffect(() => {
    loadTodaySales();
  }, []);

  useEffect(() => {
    calculateDifferences();
  }, [cashCounts, salesSummary]);

  const loadTodaySales = () => {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const today = new Date().toDateString();
    const todaysSales = sales.filter(sale => 
      new Date(sale.date).toDateString() === today
    );

    setTodaySales(todaysSales);

    // Calculate sales summary by payment method
    const summary = {
      money: 0,
      credit: 0,
      debit: 0,
      pix: 0,
      total: 0
    };

    todaysSales.forEach(sale => {
      sale.paymentMethods.forEach(payment => {
        summary[payment.method] += payment.amount;
        summary.total += payment.amount;
      });
    });

    setSalesSummary(summary);
  };

  const calculateDifferences = () => {
    const newDifferences = {
      money: (parseFloat(cashCounts.money) || 0) - salesSummary.money,
      credit: (parseFloat(cashCounts.credit) || 0) - salesSummary.credit,
      debit: (parseFloat(cashCounts.debit) || 0) - salesSummary.debit,
      pix: (parseFloat(cashCounts.pix) || 0) - salesSummary.pix,
      total: 0
    };

    newDifferences.total = Object.values(newDifferences).reduce((sum, diff) => 
      typeof diff === 'number' ? sum + diff : sum, 0
    );

    setDifferences(newDifferences);
  };

  const handleCashCountChange = (method, value) => {
    setCashCounts({
      ...cashCounts,
      [method]: value
    });
  };

  const saveCashRegisterClose = () => {
    const totalCounted = Object.values(cashCounts).reduce((sum, value) => 
      sum + (parseFloat(value) || 0), 0
    );

    if (totalCounted === 0) {
      toast({
        title: "Erro",
        description: "Informe pelo menos um valor para fechar o caixa!",
        variant: "destructive"
      });
      return;
    }

    const closeData = {
      id: Date.now(),
      date: new Date().toISOString(),
      salesSummary,
      cashCounts: {
        money: parseFloat(cashCounts.money) || 0,
        credit: parseFloat(cashCounts.credit) || 0,
        debit: parseFloat(cashCounts.debit) || 0,
        pix: parseFloat(cashCounts.pix) || 0
      },
      differences,
      totalSales: salesSummary.total,
      totalCounted: totalCounted,
      operator: 'Operador 1'
    };

    const cashRegisterHistory = JSON.parse(localStorage.getItem('cashRegisterHistory') || '[]');
    cashRegisterHistory.push(closeData);
    localStorage.setItem('cashRegisterHistory', JSON.stringify(cashRegisterHistory));

    toast({
      title: "Caixa fechado!",
      description: `Fechamento realizado com ${differences.total >= 0 ? 'sobra' : 'falta'} de R$ ${Math.abs(differences.total).toFixed(2)}.`
    });

    // Reset form
    setCashCounts({
      money: '',
      credit: '',
      debit: '',
      pix: ''
    });
  };

  const paymentMethods = [
    { key: 'money', name: 'Dinheiro', icon: DollarSign },
    { key: 'credit', name: 'Cartão de Crédito', icon: Calculator },
    { key: 'debit', name: 'Cartão de Débito', icon: Calculator },
    { key: 'pix', name: 'PIX', icon: Calculator }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-2">Fechamento de Caixa</h1>
        <p className="text-white/70">Confira os valores e feche o caixa do dia</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Vendas do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.key} className="flex justify-between items-center p-3 rounded-lg bg-white/5">
                  <div className="flex items-center space-x-2">
                    <method.icon className="h-4 w-4 text-white/70" />
                    <span className="text-white">{method.name}</span>
                  </div>
                  <span className="text-green-400 font-bold">
                    R$ {salesSummary[method.key].toFixed(2)}
                  </span>
                </div>
              ))}
              
              <div className="border-t border-white/20 pt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-white">Total de Vendas:</span>
                  <span className="text-green-400">R$ {salesSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cash Count */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Contagem do Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div key={method.key}>
                  <Label htmlFor={method.key} className="text-white">
                    {method.name} Recebido
                  </Label>
                  <Input
                    id={method.key}
                    type="number"
                    step="0.01"
                    value={cashCounts[method.key]}
                    onChange={(e) => handleCashCountChange(method.key, e.target.value)}
                    placeholder="0.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              ))}
              
              <div className="border-t border-white/20 pt-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-white">Total Contado:</span>
                  <span className="text-blue-400">
                    R$ {Object.values(cashCounts).reduce((sum, value) => 
                      sum + (parseFloat(value) || 0), 0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Differences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              {differences.total >= 0 ? (
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 mr-2 text-red-400" />
              )}
              Diferenças (Contado - Vendido)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.key} className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-white/70 text-sm">{method.name}</p>
                  <p className={`text-lg font-bold ${
                    differences[method.key] >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {differences[method.key] >= 0 ? '+' : ''}R$ {differences[method.key].toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/20 pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-white">Diferença Total:</span>
                <span className={differences.total >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {differences.total >= 0 ? '+' : ''}R$ {differences.total.toFixed(2)}
                </span>
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-white/5">
                <p className="text-white/70 text-sm text-center">
                  {differences.total > 0 && `Sobra de R$ ${differences.total.toFixed(2)} no caixa`}
                  {differences.total < 0 && `Falta de R$ ${Math.abs(differences.total).toFixed(2)} no caixa`}
                  {differences.total === 0 && 'Caixa confere perfeitamente! ✅'}
                </p>
              </div>
            </div>
            
            <Button
              onClick={saveCashRegisterClose}
              className="w-full btn-gradient"
            >
              <Save className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Today's Sales Count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-white/70 text-sm">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-400">{todaySales.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-white/70 text-sm">Faturamento</p>
                <p className="text-2xl font-bold text-blue-400">R$ {salesSummary.total.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-white/70 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold text-slate-400">
                  R$ {todaySales.length > 0 ? (salesSummary.total / todaySales.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CashRegister;