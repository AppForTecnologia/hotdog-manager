// Configuração de variáveis de ambiente
// Copie este arquivo para .env e preencha com suas chaves reais

export const envConfig = {
  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_...',
  CLERK_SECRET_KEY: import.meta.env.VITE_CLERK_SECRET_KEY || 'sk_test_...',
  
  // Convex Database
  CONVEX_URL: import.meta.env.VITE_CONVEX_URL || 'https://...',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
};

// Verificar se as variáveis obrigatórias estão configuradas
export const validateEnv = () => {
  const required = ['CLERK_PUBLISHABLE_KEY', 'CONVEX_URL'];
  const missing = required.filter(key => !envConfig[key] || envConfig[key].includes('...'));
  
  if (missing.length > 0) {
    console.warn(`⚠️ Variáveis de ambiente faltando: ${missing.join(', ')}`);
    console.warn('📝 Configure o arquivo .env com suas chaves reais');
  }
  
  return missing.length === 0;
};
