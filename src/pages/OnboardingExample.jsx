import React, { useState } from 'react';
import { useTenant, useOnboardingStatus } from '@/contexts/TenantContext';
import { ModalVinculoCnpj } from '@/components/ModalVinculoCnpj';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

/**
 * Página de exemplo mostrando o fluxo de onboarding
 * Demonstra como funciona a vinculação ao CNPJ
 */
export default function OnboardingExample() {
  const { memberships, currentTenantId, tenantInfo } = useTenant();
  const { isOnboardingComplete, needsOnboarding, needsTenantSelection, isLoading, membershipsCount } = useOnboardingStatus();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Exemplo de Onboarding</h1>
        <p className="text-white/70">Demonstração do fluxo de vinculação ao CNPJ</p>
      </div>

      {/* Status do Onboarding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Status do Onboarding
          </CardTitle>
          <CardDescription>Estado atual do processo de vinculação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Carregando:</span>
              <Badge variant={isLoading ? 'default' : 'secondary'}>
                {isLoading ? 'Sim' : 'Não'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Precisa Onboarding:</span>
              <Badge variant={needsOnboarding ? 'destructive' : 'secondary'}>
                {needsOnboarding ? 'Sim' : 'Não'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Precisa Seleção:</span>
              <Badge variant={needsTenantSelection ? 'destructive' : 'secondary'}>
                {needsTenantSelection ? 'Sim' : 'Não'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Completo:</span>
              <Badge variant={isOnboardingComplete ? 'default' : 'secondary'}>
                {isOnboardingComplete ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600">
              <strong>Memberships:</strong> {membershipsCount}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Tenant Atual:</strong> {currentTenantId || 'Nenhum'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Onboarding */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Onboarding</CardTitle>
          <CardDescription>Etapas do processo de vinculação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Etapa 1: Verificação de Memberships */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              isLoading ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}>
              <div className={`p-2 rounded-full ${
                isLoading ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium">1. Verificação de Memberships</h4>
                <p className="text-sm text-gray-600">
                  {isLoading ? 'Carregando memberships...' : 'Memberships carregados'}
                </p>
              </div>
            </div>

            {/* Etapa 2: Vinculação ao CNPJ */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              needsOnboarding ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
            }`}>
              <div className={`p-2 rounded-full ${
                needsOnboarding ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {needsOnboarding ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium">2. Vinculação ao CNPJ</h4>
                <p className="text-sm text-gray-600">
                  {needsOnboarding ? 'Necessário vincular ao CNPJ' : 'Vinculação realizada'}
                </p>
              </div>
            </div>

            {/* Etapa 3: Seleção de Tenant */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              needsTenantSelection ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
            }`}>
              <div className={`p-2 rounded-full ${
                needsTenantSelection ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                {needsTenantSelection ? (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium">3. Seleção de Tenant</h4>
                <p className="text-sm text-gray-600">
                  {needsTenantSelection ? 'Necessário selecionar tenant' : 'Tenant selecionado'}
                </p>
              </div>
            </div>

            {/* Etapa 4: Acesso Completo */}
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              isOnboardingComplete ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}>
              <div className={`p-2 rounded-full ${
                isOnboardingComplete ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {isOnboardingComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Building2 className="h-4 w-4 text-gray-600" />
                )}
              </div>
              <div>
                <h4 className="font-medium">4. Acesso Completo</h4>
                <p className="text-sm text-gray-600">
                  {isOnboardingComplete ? 'Onboarding concluído com sucesso!' : 'Aguardando conclusão'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Tenant Atual */}
      {tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Atual</CardTitle>
            <CardDescription>Informações do tenant selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Nome:</strong> {tenantInfo.companyName}
              </div>
              <div>
                <strong>CNPJ:</strong> {tenantInfo.cnpj}
              </div>
              <div>
                <strong>Email:</strong> {tenantInfo.email}
              </div>
              <div>
                <strong>Plano:</strong> {tenantInfo.plan}
              </div>
              <div>
                <strong>Status:</strong> 
                <Badge variant={tenantInfo.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                  {tenantInfo.status}
                </Badge>
              </div>
              <div>
                <strong>Expirado:</strong> {tenantInfo.isExpired ? 'Sim' : 'Não'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controles de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Teste</CardTitle>
          <CardDescription>Botões para testar funcionalidades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => setShowModal(true)}
              variant="outline"
              disabled={!needsOnboarding}
            >
              Abrir Modal de Vinculação
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            <strong>Estado Atual:</strong> {
              isLoading ? 'Carregando...' :
              needsOnboarding ? 'Precisa vinculação' :
              needsTenantSelection ? 'Precisa seleção' :
              isOnboardingComplete ? 'Completo' : 'Desconhecido'
            }
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

/**
 * Componente protegido pelo OnboardingGuard
 */
export function ProtectedContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Conteúdo Protegido
        </CardTitle>
        <CardDescription>
          Este conteúdo só é exibido após o onboarding completo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-green-600 mb-4">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium mb-2">Onboarding Concluído!</h3>
          <p className="text-gray-600">
            Você tem acesso completo ao sistema
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo de uso do OnboardingGuard
 */
export function OnboardingExampleWithGuard() {
  return (
    <OnboardingGuard>
      <ProtectedContent />
    </OnboardingGuard>
  );
}
