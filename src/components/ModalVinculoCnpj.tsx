import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTenant } from '@/contexts/TenantContext';
import { normalizeCnpj, isValidCnpj, formatCnpj } from '../../convex/utils/cnpj';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Loader2, Building2, Lock } from 'lucide-react';

/**
 * Props para o ModalVinculoCnpj
 */
interface ModalVinculoCnpjProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Estados do modal
 */
type ModalState = 'form' | 'verifying' | 'success' | 'error';

/**
 * Modal para vinculação de usuário ao CNPJ
 * Permite que usuários se vinculem a um tenant usando CNPJ e senha
 */
export function ModalVinculoCnpj({ isOpen, onClose }: ModalVinculoCnpjProps) {
  const { setTenantId } = useTenant();
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ModalState>('form');
  const [error, setError] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  // Mutations do Convex
  const verifyCnpjAndPassword = useMutation(api.tenants.verifyCnpjAndPassword);
  const addMembership = useMutation(api.memberships.addMembership);

  /**
   * Aplicar máscara de CNPJ enquanto o usuário digita
   */
  const handleCnpjChange = (value: string) => {
    // Remover caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Limitar a 14 dígitos
    if (numericValue.length <= 14) {
      setCnpj(numericValue);
    }
  };

  /**
   * Formatar CNPJ para exibição
   */
  const formatCnpjDisplay = (cnpjValue: string) => {
    if (cnpjValue.length <= 2) return cnpjValue;
    if (cnpjValue.length <= 5) return `${cnpjValue.slice(0, 2)}.${cnpjValue.slice(2)}`;
    if (cnpjValue.length <= 8) return `${cnpjValue.slice(0, 2)}.${cnpjValue.slice(2, 5)}.${cnpjValue.slice(5)}`;
    if (cnpjValue.length <= 12) return `${cnpjValue.slice(0, 2)}.${cnpjValue.slice(2, 5)}.${cnpjValue.slice(5, 8)}/${cnpjValue.slice(8)}`;
    return `${cnpjValue.slice(0, 2)}.${cnpjValue.slice(2, 5)}.${cnpjValue.slice(5, 8)}/${cnpjValue.slice(8, 12)}-${cnpjValue.slice(12)}`;
  };

  /**
   * Validar formulário
   */
  const validateForm = () => {
    if (!cnpj || cnpj.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return false;
    }

    if (!isValidCnpj(cnpj)) {
      setError('CNPJ inválido');
      return false;
    }

    if (!password || password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Processar vinculação
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState('verifying');
    setError(null);

    try {
      // Verificar CNPJ e senha
      const verificationResult = await verifyCnpjAndPassword({
        cnpj: normalizeCnpj(cnpj),
        password: password,
      });

      if (verificationResult) {
        setTenantInfo(verificationResult);

        // Criar membership
        await addMembership({
          tenantId: verificationResult.tenantId,
          userId: '', // Será preenchido automaticamente pelo Convex
          role: 'employee', // Role padrão para novos membros
        });

        // Definir tenant atual
        setTenantId(verificationResult.tenantId);

        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular ao CNPJ');
      setState('error');
    }
  };

  /**
   * Resetar modal
   */
  const handleClose = () => {
    setCnpj('');
    setPassword('');
    setState('form');
    setError(null);
    setTenantInfo(null);
    onClose();
  };

  /**
   * Resetar para formulário
   */
  const handleRetry = () => {
    setState('form');
    setError(null);
    setTenantInfo(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Vincular ao CNPJ
          </DialogTitle>
          <DialogDescription>
            {state === 'form' && 'Digite o CNPJ e senha para vincular-se a uma empresa'}
            {state === 'verifying' && 'Verificando credenciais...'}
            {state === 'success' && 'Vinculação realizada com sucesso!'}
            {state === 'error' && 'Erro na vinculação'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado: Formulário */}
          {state === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ da Empresa</Label>
                <Input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formatCnpjDisplay(cnpj)}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  className="text-center text-lg font-mono"
                  maxLength={18}
                />
                {cnpj.length === 14 && !isValidCnpj(cnpj) && (
                  <div className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    CNPJ inválido
                  </div>
                )}
                {cnpj.length === 14 && isValidCnpj(cnpj) && (
                  <div className="text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    CNPJ válido
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha do CNPJ</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={cnpj.length !== 14 || !password || !isValidCnpj(cnpj)}
                  className="flex-1"
                >
                  Vincular
                </Button>
              </div>
            </form>
          )}

          {/* Estado: Verificando */}
          {state === 'verifying' && (
            <div className="text-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <div className="space-y-2">
                <p className="font-medium">Verificando credenciais...</p>
                <p className="text-sm text-gray-500">
                  Aguarde enquanto validamos o CNPJ e senha
                </p>
              </div>
            </div>
          )}

          {/* Estado: Sucesso */}
          {state === 'success' && tenantInfo && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <div className="space-y-2">
                <p className="font-medium text-green-700">Vinculação realizada com sucesso!</p>
                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <p className="font-medium">{tenantInfo.companyName}</p>
                  <p className="text-sm text-gray-600">CNPJ: {tenantInfo.cnpj}</p>
                  <p className="text-sm text-gray-600">Plano: {tenantInfo.plan}</p>
                </div>
                <p className="text-sm text-gray-500">
                  Você agora tem acesso ao sistema desta empresa
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Continuar
              </Button>
            </div>
          )}

          {/* Estado: Erro */}
          {state === 'error' && (
            <div className="text-center space-y-4 py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <div className="space-y-2">
                <p className="font-medium text-red-700">Erro na vinculação</p>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Verifique o CNPJ e senha e tente novamente
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="flex-1"
                >
                  Tentar Novamente
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para verificar se o usuário precisa fazer vinculação
 */
export function useOnboardingRequired() {
  const { memberships, isLoading } = useTenant();

  return {
    needsOnboarding: !isLoading && memberships.length === 0,
    isLoading,
  };
}
