import React, { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ModalVinculoCnpj } from './ModalVinculoCnpj';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, AlertCircle } from 'lucide-react';

/**
 * Props para o OnboardingGuard
 */
interface OnboardingGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rotas de usuários sem vínculo
 * Força a vinculação ao CNPJ antes de permitir acesso às funcionalidades
 * 
 * @param children - Componentes filhos a serem renderizados se tiver vínculo
 * @param fallback - Componente customizado a ser renderizado se não tiver vínculo
 */
export function OnboardingGuard({ children, fallback }: OnboardingGuardProps) {
  const { memberships, isLoading, currentTenantId } = useTenant();
  const [showModal, setShowModal] = useState(false);

  // Verificar se precisa mostrar modal
  useEffect(() => {
    if (!isLoading && memberships.length === 0 && !showModal) {
      setShowModal(true);
    }
  }, [isLoading, memberships.length, showModal]);

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">
              Verificando seus vínculos...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não tem vínculo, mostrar tela de onboarding
  if (memberships.length === 0) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Vincular ao CNPJ</CardTitle>
            <CardDescription>
              Para acessar o sistema, você precisa se vincular a uma empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Segurança</h4>
                  <p className="text-sm text-blue-700">
                    Suas credenciais são verificadas com segurança
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Building2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Acesso Rápido</h4>
                  <p className="text-sm text-green-700">
                    Após a vinculação, você terá acesso imediato ao sistema
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                Vincular ao CNPJ
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Não tem acesso? Entre em contato com o administrador da empresa
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Vinculação */}
        <ModalVinculoCnpj
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    );
  }

  // Se tem vínculo mas não tem tenant selecionado, mostrar seletor
  if (!currentTenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Selecionar Tenant</CardTitle>
            <CardDescription>
              Escolha o tenant que deseja acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500">
              Você possui acesso a {memberships.length} tenant(s). 
              Selecione um para continuar.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar children se tudo estiver ok
  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário completou o onboarding
 * 
 * @returns Objeto com informações do onboarding
 */
export function useOnboardingStatus() {
  const { memberships, isLoading, currentTenantId } = useTenant();

  return {
    isOnboardingComplete: !isLoading && memberships.length > 0 && !!currentTenantId,
    needsOnboarding: !isLoading && memberships.length === 0,
    needsTenantSelection: !isLoading && memberships.length > 0 && !currentTenantId,
    isLoading,
    membershipsCount: memberships.length,
  };
}
