import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRootUserInfo } from './RootGuard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Layout específico para o painel administrativo root
 * Inclui sidebar de navegação e header com informações do usuário
 */
export default function RootLayout({ children }) {
  const { userEmail, isRootAdmin } = useRootUserInfo();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isRootAdmin) {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/root',
      icon: '📊',
      current: location.pathname === '/root'
    },
    {
      name: 'Gerenciar Tenants',
      href: '/root/tenants',
      icon: '🏢',
      current: location.pathname === '/root/tenants'
    },
    {
      name: 'Relatórios',
      href: '/root/reports',
      icon: '📈',
      current: location.pathname === '/root/reports'
    },
    {
      name: 'Monitor de Cron',
      href: '/root/cron',
      icon: '⏰',
      current: location.pathname === '/root/cron'
    },
    {
      name: 'Migração de Dados',
      href: '/root/migration',
      icon: '🔄',
      current: location.pathname === '/root/migration'
    },
    {
      name: 'Provisionamento Físico',
      href: '/root/provisioning',
      icon: '🚀',
      current: location.pathname === '/root/provisioning'
    },
    {
      name: 'Configurações',
      href: '/root/settings',
      icon: '⚙️',
      current: location.pathname === '/root/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Fechar sidebar</span>
                <span className="text-white text-xl">×</span>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Root Admin</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Root Admin</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{userEmail}</p>
                  <p className="text-xs font-medium text-gray-500">Administrador Root</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 lg:border-none">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Abrir sidebar</span>
            <span className="text-xl">☰</span>
          </button>
          <div className="flex-1 px-4 flex justify-between sm:px-6 lg:px-8">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <span className="text-lg">🔍</span>
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                    placeholder="Buscar..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Voltar ao App
                </Link>
                <div className="h-8 w-px bg-gray-200" />
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{userEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
