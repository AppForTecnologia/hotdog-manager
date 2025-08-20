import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Calculator, 
  BarChart3, 
  Menu,
  X,
  ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/clerk-react';

const Sidebar = ({ navigation, location, onLinkClick }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 flex-shrink-0">
      <h1 className="text-xl font-bold text-white">🌭 AppFor HotDog</h1>
    </div>
    <nav className="mt-8 px-4 flex-1">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center px-4 py-3 mb-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
            onClick={onLinkClick}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  </div>
);

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart },
    { name: 'Produção', href: '/production', icon: ChefHat },
    { name: 'Pagamento', href: '/payment', icon: CreditCard },
    { name: 'Caixa', href: '/cash-register', icon: Calculator },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="bg-white/10 backdrop-blur-xl border-r border-white/20 h-full">
          <Sidebar navigation={navigation} location={location} />
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-60 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-white/20 lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <Sidebar navigation={navigation} location={location} onLinkClick={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
          </div>
          <UserButton />
        </div>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;