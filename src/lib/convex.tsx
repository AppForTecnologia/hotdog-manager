import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { DynamicConvexProvider, useDynamicConvex } from "./convexClient";

/**
 * Configuração do cliente Convex para integração com React
 * Fornece o contexto necessário para usar as funções do banco
 * 
 * IMPORTANTE: Agora suporta clientes dinâmicos por tenant (feature flag)
 */

// URL do seu projeto Convex (substitua pela sua URL real)
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud';

if (!convexUrl || convexUrl === 'https://placeholder.convex.cloud') {
  console.warn("⚠️ VITE_CONVEX_URL não está configurada no arquivo .env");
  console.warn("📝 Crie um arquivo .env na raiz do projeto com suas chaves");
  console.warn("🔗 Exemplo: VITE_CONVEX_URL=https://seu-projeto.convex.cloud");
}

// Criar cliente Convex padrão
export const convex = new ConvexReactClient(convexUrl);

/**
 * Provider do Convex para envolver a aplicação
 * Permite que todos os componentes acessem o banco de dados
 * 
 * IMPORTANTE: Agora suporta clientes dinâmicos por tenant (feature flag)
 * 
 * @param children - Componentes React filhos que terão acesso ao contexto Convex
 * @returns Provider do Convex envolvendo os componentes filhos
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <DynamicConvexProvider>
      <ConvexProviderWrapper>
        {children}
      </ConvexProviderWrapper>
    </DynamicConvexProvider>
  );
}

/**
 * Wrapper interno que usa o cliente dinâmico
 */
function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  const { currentClient } = useDynamicConvex();
  
  return (
    <ConvexProvider client={currentClient}>
      {children}
    </ConvexProvider>
  );
}

/**
 * Hook personalizado para verificar se o Convex está conectado
 * Útil para mostrar status de conexão
 * 
 * IMPORTANTE: Agora usa o sistema dinâmico de clientes
 * 
 * @returns Objeto contendo o status de conexão com o Convex
 */
export function useConvexStatus() {
  try {
    const { isConnected, connectionError, currentTenantConfig } = useDynamicConvex();
    
    return {
      isConnected,
      error: connectionError,
      tenantConfig: currentTenantConfig,
      hasOwnProject: currentTenantConfig ? 
        currentTenantConfig.provisioningStatus === 'provisioned' : false
    };
  } catch (error) {
    // Fallback para quando não está dentro do provider dinâmico
    return {
      isConnected: true,
      error: null,
      tenantConfig: null,
      hasOwnProject: false
    };
  }
}
