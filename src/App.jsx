import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Sales from '@/pages/Sales';
import Payment from '@/pages/Payment';
import CashRegister from '@/pages/CashRegister';
import Reports from '@/pages/Reports';
import Production from '@/pages/Production';

function App() {
  return (
    <>
      <Helmet>
        <title>AppFor HotDog - Sistema de Gestão para Lanchonetes</title>
        <meta name="description" content="Sistema completo de ponto de venda para lanchonetes com gestão de produtos, vendas, pagamentos e relatórios." />
      </Helmet>
      
      <Router>
        <SignedOut>
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">🌭</h1>
                <h2 className="text-2xl font-bold text-white mb-2">AppFor HotDog</h2>
                <p className="text-white/70">Sistema de Gestão para Lanchonetes</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-6">
                <SignInButton mode="modal">
                  <button className="w-full bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                    Entrar no Sistema
                  </button>
                </SignInButton>
                
                <p className="text-white/60 text-sm text-center mt-4">
                  Faça login para acessar o painel de controle
                </p>
              </div>
            </div>
          </div>
        </SignedOut>
        
        <SignedIn>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/production" element={<Production />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/cash-register" element={<CashRegister />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
            <Toaster />
          </Layout>
        </SignedIn>
      </Router>
    </>
  );
}

export default App;