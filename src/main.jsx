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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ConvexClientProvider>
        <App />
      </ConvexClientProvider>
    </ClerkProvider>
  </StrictMode>,
);