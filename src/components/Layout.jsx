import React, { useState, useEffect } from 'react';
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
  ChefHat,
  Users,
  ClipboardList,
  Building2,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useCurrentTenant, useTenantAccess, useTenant } from '@/contexts/TenantContext';
import { TenantSelector } from './TenantSelector';
import { ModalVinculoCnpj, useOnboardingRequired } from './ModalVinculoCnpj';
import { TenantSwitcher, useHasMultipleTenants } from './TenantSwitcher';
import { TenantExpirationGuard, ExpirationWarningBanner } from './TenantExpirationGuard';

const Sidebar = ({ navigation, location, onLinkClick }) => {
  const { tenantInfo, isLoading } = useCurrentTenant();
  const { role } = useTenantAccess();
  const { hasMultipleTenants } = useHasMultipleTenants();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between h-16 px-6 border-b border-white/20 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">🌭 AppFor HotDog</h1>
      </div>
      
      {/* Informações do Tenant */}
      <div className="px-4 py-4 border-b border-white/10">
        {isLoading ? (
          <div className="text-white/70 text-sm">Carregando tenant...</div>
        ) : tenantInfo ? (
          <div className="text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                <span className="font-medium text-sm">{tenantInfo.companyName}</span>
              </div>
              {hasMultipleTenants && (
                <TenantSwitcher variant="minimal" />
              )}
            </div>
            <div className="text-xs text-white/70">
              <div>CNPJ: {tenantInfo.cnpj}</div>
              <div>Role: {role}</div>
              <div>Plano: {tenantInfo.plan}</div>
            </div>
          </div>
        ) : (
          <div className="text-white/70 text-sm">Nenhum tenant selecionado</div>
        )}
      </div>

      <nav className="mt-4 px-4 flex-1">
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
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const location = useLocation();
  const { user } = useUser();
  const { memberships, isLoading } = useTenant();
  const { needsOnboarding } = useOnboardingRequired();

  // Verificar se o usuário é Master (temporariamente desabilitado)
  const isMaster = false; // Temporariamente false para evitar erros

  // Verificar se precisa mostrar modal de onboarding
  useEffect(() => {
    if (!isLoading && needsOnboarding && !showOnboardingModal) {
      setShowOnboardingModal(true);
    }
  }, [isLoading, needsOnboarding, showOnboardingModal]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Produtos', href: '/products', icon: Package },
    { name: 'Vendas', href: '/sales', icon: ShoppingCart },
    { name: 'Clientes', href: '/customers', icon: Users },
    { name: 'Produção', href: '/production', icon: ChefHat },
    { name: 'Pedidos', href: '/orders', icon: ClipboardList },
    { name: 'Pagamento', href: '/payment', icon: CreditCard },
    { name: 'Caixa', href: '/cash-register', icon: Calculator },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
    // Adicionar navegação para usuários Master
    ...(isMaster ? [{ name: 'Gerenciar CNPJs', href: '/cnpj-management', icon: Building2 }] : []),
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
          
          {/* Informações do Tenant no Header */}
          <div className="hidden md:flex items-center mr-4">
            <TenantSwitcher variant="compact" />
          </div>
          
          <UserButton />
        </div>
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Banner de aviso de expiração */}
          <ExpirationWarningBanner className="mb-6" />
          
          {/* Proteção contra tenants expirados */}
          <TenantExpirationGuard>
            {children}
          </TenantExpirationGuard>
        </main>
      </div>

      {/* Modal de Onboarding */}
      <ModalVinculoCnpj
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
    </div>
  );
};

export default Layout;