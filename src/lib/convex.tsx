import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

/**
 * Configuração do cliente Convex para integração com React
 * Fornece o contexto necessário para usar as funções do banco
 */

// URL do seu projeto Convex (substitua pela sua URL real)
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud';

if (!convexUrl || convexUrl === 'https://placeholder.convex.cloud') {
  console.warn("⚠️ VITE_CONVEX_URL não está configurada no arquivo .env");
  console.warn("📝 Crie um arquivo .env na raiz do projeto com suas chaves");
  console.warn("🔗 Exemplo: VITE_CONVEX_URL=https://seu-projeto.convex.cloud");
}

// Criar cliente Convex
export const convex = new ConvexReactClient(convexUrl);

/**
 * Provider do Convex para envolver a aplicação
 * Permite que todos os componentes acessem o banco de dados
 * 
 * @param children - Componentes React filhos que terão acesso ao contexto Convex
 * @returns Provider do Convex envolvendo os componentes filhos
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}

/**
 * Hook personalizado para verificar se o Convex está conectado
 * Útil para mostrar status de conexão
 * 
 * @returns Objeto contendo o status de conexão com o Convex
 */
export function useConvexStatus() {
  // Esta função será implementada quando criarmos os hooks personalizados
  return { isConnected: true };
}
