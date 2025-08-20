import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/clerk-react';
import { ConvexClientProvider } from './lib/convex';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';

if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === 'pk_test_placeholder') {
  console.warn("⚠️ VITE_CLERK_PUBLISHABLE_KEY não está configurada no arquivo .env");
  console.warn("📝 Crie um arquivo .env na raiz do projeto com suas chaves");
  console.warn("🔑 Exemplo: VITE_CLERK_PUBLISHABLE_KEY=pk_test_sua_chave_aqui");
}

// Tema personalizado para o Clerk que combina com o tema dark do site
const clerkTheme = {
  baseTheme: 'dark',
  variables: {
    colorPrimary: '#475569',
    colorPrimaryText: '#ffffff',
    colorBackground: '#0f172a',
    colorInputBackground: '#1e293b',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
    colorNeutral: '#334155',
    colorNeutralText: '#ffffff',
    colorSuccess: '#10b981',
    colorSuccessText: '#ffffff',
    colorWarning: '#f59e0b',
    colorWarningText: '#ffffff',
    colorDanger: '#ef4444',
    colorDangerText: '#ffffff',
    colorBorder: '#475569',
    colorInputBorder: '#475569',
    colorInputBorderFocus: '#64748b',
    borderRadius: '0.5rem',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    card: {
      backgroundColor: '#1e293b',
      borderColor: '#475569',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    headerTitle: {
      color: '#ffffff',
      fontSize: '1.5rem',
      fontWeight: '600',
    },
    headerSubtitle: {
      color: '#94a3b8',
      fontSize: '1rem',
    },
    formButtonPrimary: {
      backgroundColor: '#475569',
      color: '#ffffff',
      fontSize: '0.875rem',
      fontWeight: '500',
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      transition: 'all 0.2s ease',
    },
    formButtonPrimaryHover: {
      backgroundColor: '#374151',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    formFieldInput: {
      backgroundColor: '#1e293b',
      borderColor: '#475569',
      color: '#ffffff',
      fontSize: '0.875rem',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      transition: 'all 0.2s ease',
    },
    formFieldInputFocus: {
      borderColor: '#64748b',
      boxShadow: '0 0 0 3px rgba(100, 116, 139, 0.1)',
    },
    formFieldLabel: {
      color: '#94a3b8',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    dividerLine: {
      backgroundColor: '#475569',
    },
    dividerText: {
      color: '#94a3b8',
      fontSize: '0.875rem',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#1e293b',
      borderColor: '#475569',
      color: '#ffffff',
      fontSize: '0.875rem',
      fontWeight: '500',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      transition: 'all 0.2s ease',
    },
    socialButtonsBlockButtonHover: {
      backgroundColor: '#334155',
      borderColor: '#64748b',
    },
    footerActionLink: {
      color: '#64748b',
      fontSize: '0.875rem',
      textDecoration: 'none',
    },
    footerActionLinkHover: {
      color: '#94a3b8',
      textDecoration: 'underline',
    },
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={clerkTheme}
    >
      <ConvexClientProvider>
        <App />
      </ConvexClientProvider>
    </ClerkProvider>
  </StrictMode>,
);