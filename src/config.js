// Configurações do sistema HotDog Manager
// Este arquivo pode ser editado pelo assistente
// O .env deve conter apenas as chaves reais

export const config = {
  // Clerk Authentication
  clerk: {
    publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder',
  },
  
  // Convex Database
  convex: {
    url: import.meta.env.VITE_CONVEX_URL || 'https://placeholder.convex.cloud',
  },
  
  // Environment
  env: import.meta.env.NODE_ENV || 'development',
  
  // App Settings
  app: {
    name: 'HotDog Manager',
    version: '1.0.0',
    description: 'Sistema de gerenciamento para lanchonetes'
  }
};

// Validação das configurações
export function validateConfig() {
  const warnings = [];
  
  if (!config.clerk.publishableKey || config.clerk.publishableKey === 'pk_test_placeholder') {
    warnings.push('⚠️ VITE_CLERK_PUBLISHABLE_KEY não configurada');
  }
  
  if (!config.convex.url || config.convex.url === 'https://placeholder.convex.cloud') {
    warnings.push('⚠️ VITE_CONVEX_URL não configurada');
  }
  
  if (warnings.length > 0) {
    console.warn('Configurações pendentes:');
    warnings.forEach(warning => console.warn(warning));
  }
  
  return warnings.length === 0;
}
