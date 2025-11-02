import { ConvexProvider, ConvexReactClient } from "convex/react";

/**
 * Configuração do cliente Convex para React
 * Este arquivo configura a conexão com o backend Convex
 */

// URL do deployment do Convex - será configurada via variável de ambiente
const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing VITE_CONVEX_URL environment variable. " +
    "Set it in your .env file as described in: https://docs.convex.dev/quick-start/hello-world/setup#run-the-backend"
  );
}

// Cria o cliente Convex
export const convex = new ConvexReactClient(convexUrl);

/**
 * Provider do Convex para envolver a aplicação React
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componentes filhos
 * @returns {JSX.Element} Provider do Convex
 */
export function ConvexClientProvider({ children }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
