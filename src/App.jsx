import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import { ConvexClientProvider } from '@/lib/convex.jsx';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Sales from '@/pages/Sales';
import Payment from '@/pages/Payment';
import CashRegister from '@/pages/CashRegister';
import Reports from '@/pages/Reports';
import Production from '@/pages/Production';
import Clients from '@/pages/Clients';
import Orders from '@/pages/Orders';

function App() {
  return (
    <ConvexClientProvider>
      <Helmet>
        <title>AppFor HotDog - Sistema de Gestão para Lanchonetes</title>
        <meta name="description" content="Sistema completo de ponto de venda para lanchonetes com gestão de produtos, vendas, pagamentos e relatórios." />
      </Helmet>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/production" element={<Production />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/cash-register" element={<CashRegister />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
        <Toaster />
      </Router>
    </ConvexClientProvider>
  );
}

export default App;