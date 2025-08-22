import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, TrendingUp, TrendingDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";

const CashRegister = () => {
  const { user } = useUser();
  
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

  // Buscar dados do Convex
  const sales = useQuery(api.sales.listAll) || [];
  const cashRegisterHistory = useQuery(api.cashRegister.listAll) || [];
  const createCashRegisterClose = useMutation(api.cashRegister.create);
  
  // Buscar métodos de pagamento das vendas do dia
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime();
  
  const dailyPaymentMethods = useQuery(api.sales.getDailyPaymentMethods, { 
    startDate: startOfDay, 
    endDate: endOfDay 
  }) || [];
  
  // Buscar usuário do Convex
  const currentUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");

  // Calcular vendas pagas de hoje
  const todaySales = sales.filter(sale => {
    const today = new Date().toDateString();
    const saleDate = new Date(sale.saleDate).toDateString();
    // Filtrar apenas vendas pagas do dia atual
    return saleDate === today && sale.status === "paga";
  });

  useEffect(() => {
    console.log("Calculando resumo de vendas...");
    console.log("Vendas de hoje (pagas):", todaySales);
    console.log("Métodos de pagamento do dia:", dailyPaymentMethods);
    
    // Calcular resumo de vendas por método de pagamento
    const summary = {
      money: 0,
      credit: 0,
      debit: 0,
      pix: 0,
      total: 0
    };

    // Usar os métodos de pagamento reais da tabela paymentMethods
    dailyPaymentMethods.forEach(payment => {
      console.log(`Processando pagamento: ${payment.method} - R$ ${payment.amount}`);
      
      if (summary.hasOwnProperty(payment.method)) {
        summary[payment.method] += payment.amount;
        summary.total += payment.amount;
        console.log(`- Adicionado R$ ${payment.amount} ao método ${payment.method}`);
      } else {
        console.warn(`Método de pagamento desconhecido: "${payment.method}"`, payment);
        // Adicionar ao total mesmo se o método não for reconhecido
        summary.total += payment.amount;
        console.log(`- Adicionado R$ ${payment.amount} ao total (método desconhecido)`);
      }
    });

    console.log("Resumo final calculado:", summary);
    setSalesSummary(summary);
  }, [todaySales, dailyPaymentMethods]);

  useEffect(() => {
    calculateDifferences();
  }, [cashCounts, salesSummary]);

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

  const saveCashRegisterClose = async () => {
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

    if (!currentUser || !user) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    const closeData = {
      userId: currentUser._id,
      clerkUserId: user.id,
      moneyCount: parseFloat(cashCounts.money) || 0,
      creditCount: parseFloat(cashCounts.credit) || 0,
      debitCount: parseFloat(cashCounts.debit) || 0,
      pixCount: parseFloat(cashCounts.pix) || 0,
      totalCount: totalCounted,
      moneySales: salesSummary.money,
      creditSales: salesSummary.credit,
      debitSales: salesSummary.debit,
      pixSales: salesSummary.pix,
      totalSales: salesSummary.total,
      moneyDiff: differences.money,
      creditDiff: differences.credit,
      debitDiff: differences.debit,
      pixDiff: differences.pix,
      totalDiff: differences.total,
      notes: `Fechamento de caixa - ${new Date().toLocaleString()}`
    };

    try {
      await createCashRegisterClose(closeData);
      
      toast({
        title: "Caixa fechado com sucesso!",
        description: `Total contado: R$ ${totalCounted.toFixed(2)} | Total vendas: R$ ${salesSummary.total.toFixed(2)}`,
      });

      // Limpar campos
      setCashCounts({
        money: '',
        credit: '',
        debit: '',
        pix: ''
      });
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao fechar o caixa. Tente novamente.",
        variant: "destructive"
      });
    }
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
                <p className="text-white/70 text-sm">Total de Vendas (Pagas)</p>
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