import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Página exibida quando o tenant do usuário está expirado ou suspenso
 * Oferece opções de contato e renovação
 */
export default function PlanoExpirado() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { currentTenantId } = useTenant();
  const [tenantStatus, setTenantStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar status do tenant atual
  const statusData = useQuery(
    api.tenants.getCurrentTenantStatus,
    currentTenantId ? { tenantId: currentTenantId } : "skip"
  );

  useEffect(() => {
    if (statusData) {
      setTenantStatus(statusData);
      setIsLoading(false);
    }
  }, [statusData]);

  // Se não há tenant selecionado, redirecionar para onboarding
  useEffect(() => {
    if (!currentTenantId && !isLoading) {
      navigate('/');
    }
  }, [currentTenantId, isLoading, navigate]);

  // Função para entrar em contato
  const handleContact = () => {
    const subject = encodeURIComponent('Renovação de Plano - HotDog Manager');
    const body = encodeURIComponent(`
Olá,

Gostaria de renovar o plano da minha empresa no HotDog Manager.

Dados da empresa:
- Nome: ${tenantStatus?.tenant?.companyName || 'N/A'}
- CNPJ: ${tenantStatus?.tenant?.cnpj || 'N/A'}
- Plano atual: ${tenantStatus?.tenant?.plan || 'N/A'}
- Data de expiração: ${tenantStatus?.expiresAt ? new Date(tenantStatus.expiresAt).toLocaleDateString('pt-BR') : 'N/A'}

Por favor, entre em contato para renovação.

Atenciosamente,
${user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'Usuário'}
    `);
    
    window.open(`mailto:suporte@appfortecnologia.com?subject=${subject}&body=${body}`, '_blank');
  };

  // Função para voltar ao app (tentar novamente)
  const handleRetry = () => {
    navigate('/');
  };

  // Função para trocar de tenant
  const handleSwitchTenant = () => {
    // Limpar tenant atual e voltar para seleção
    localStorage.removeItem('currentTenantId');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando status do plano...</p>
        </div>
      </div>
    );
  }

  if (!tenantStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Verificar Plano</h1>
          <p className="text-gray-600 mb-4">Não foi possível verificar o status do seu plano.</p>
          <Button onClick={handleRetry}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = tenantStatus.isExpired;
  const isSuspended = tenantStatus.isSuspended;
  const isExpiringSoon = tenantStatus.status === 'expiring_soon';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`text-6xl mb-4 ${
            isExpired ? 'text-red-500' : 
            isSuspended ? 'text-yellow-500' : 
            'text-orange-500'
          }`}>
            {isExpired ? '⏰' : isSuspended ? '⏸️' : '⚠️'}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isExpired ? 'Plano Expirado' : 
             isSuspended ? 'Plano Suspenso' : 
             'Plano Expirando em Breve'}
          </h1>
          <p className="text-gray-600">
            {isExpired ? 'Seu plano expirou e precisa ser renovado para continuar usando o sistema.' :
             isSuspended ? 'Seu plano foi suspenso. Entre em contato para reativação.' :
             `Seu plano expira em ${tenantStatus.daysUntilExpiry} dias. Renove para evitar interrupções.`}
          </p>
        </div>

        {/* Informações do Tenant */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              Informações do Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Empresa</label>
                <p className="text-lg font-semibold text-gray-900">
                  {tenantStatus.tenant?.companyName || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">CNPJ</label>
                <p className="text-lg font-semibold text-gray-900">
                  {tenantStatus.tenant?.cnpj || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Plano</label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg">
                    {tenantStatus.tenant?.plan || 'N/A'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isExpired ? 'destructive' : isSuspended ? 'secondary' : 'default'}
                    className={
                      isExpired ? 'bg-red-100 text-red-800' :
                      isSuspended ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }
                  >
                    {isExpired ? 'Expirado' : 
                     isSuspended ? 'Suspenso' : 
                     'Expirando'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Expiração</label>
                <p className="text-lg font-semibold text-gray-900">
                  {tenantStatus.expiresAt ? 
                    new Date(tenantStatus.expiresAt).toLocaleDateString('pt-BR') : 
                    'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dias Restantes</label>
                <p className={`text-lg font-semibold ${
                  tenantStatus.daysUntilExpiry <= 0 ? 'text-red-600' :
                  tenantStatus.daysUntilExpiry <= 7 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {tenantStatus.daysUntilExpiry > 0 ? 
                    `${tenantStatus.daysUntilExpiry} dias` : 
                    'Expirado'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="space-y-4">
          {/* Botão Principal */}
          <Button 
            onClick={handleContact}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            size="lg"
          >
            📞 Entrar em Contato para Renovação
          </Button>

          {/* Botões Secundários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleSwitchTenant}
              variant="outline"
              className="w-full"
            >
              🔄 Trocar de Empresa
            </Button>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="w-full"
            >
              🔁 Tentar Novamente
            </Button>
          </div>
        </div>

        {/* Informações de Contato */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📞</span>
              Informações de Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-medium">Email de Suporte</p>
                  <p className="text-gray-600">suporte@appfortecnologia.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-medium">Horário de Atendimento</p>
                  <p className="text-gray-600">Segunda a Sexta, 8h às 18h</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-gray-600">(11) 99999-9999</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso Importante */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Informação Importante</h3>
              <p className="text-sm text-blue-800">
                {isExpired ? 
                  'Seu plano expirou e o acesso ao sistema foi bloqueado. Entre em contato conosco para renovação e reativação imediata.' :
                  isSuspended ?
                  'Seu plano foi suspenso por motivos administrativos. Entre em contato para esclarecimentos e reativação.' :
                  'Seu plano está próximo do vencimento. Renove antecipadamente para evitar interrupções no serviço.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>HotDog Manager - Sistema de Gestão para Lanchonetes</p>
          <p>© 2024 AppFor Tecnologia. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
