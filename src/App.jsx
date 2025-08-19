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
      
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">HotDog Manager</h1>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                Entrar
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      
      <Router>
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
        </Layout>
        <Toaster />
      </Router>
    </>
  );
}

export default App;