import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { config } from '@/config';

/**
 * Componente para proteger rotas administrativas root
 * Verifica se o usuário está na allowlist de administradores
 */
interface RootGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RootGuard({ children, fallback }: RootGuardProps) {
  const { user, isLoaded } = useUser();

  // Mostrar loading enquanto carrega dados do usuário
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário logado, mostrar erro
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta área.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Verificar se o email do usuário está na allowlist
  const userEmail = user.emailAddresses?.[0]?.emailAddress;
  const isAuthorized = userEmail && config.root.allowlist.includes(userEmail);

  // Se não está autorizado, mostrar erro 404
  if (!isAuthorized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Página Não Encontrada</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta área administrativa.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Email detectado:</strong> {userEmail}
            </p>
            <p className="text-sm text-yellow-800 mt-1">
              <strong>Emails autorizados:</strong> {config.root.allowlist.join(', ')}
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // Se está autorizado, renderizar o conteúdo
  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário atual é um administrador root
 */
export function useIsRootAdmin(): boolean {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded || !user) {
    return false;
  }

  const userEmail = user.emailAddresses?.[0]?.emailAddress;
  return userEmail ? config.root.allowlist.includes(userEmail) : false;
}

/**
 * Hook para obter informações do usuário root
 */
export function useRootUserInfo() {
  const { user, isLoaded } = useUser();
  const isRootAdmin = useIsRootAdmin();

  return {
    user,
    isLoaded,
    isRootAdmin,
    userEmail: user?.emailAddresses?.[0]?.emailAddress,
    allowlist: config.root.allowlist,
  };
}
