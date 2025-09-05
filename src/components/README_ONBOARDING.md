# Sistema de Onboarding - Vinculação ao CNPJ

O sistema de onboarding garante que usuários novos se vinculem a um CNPJ antes de acessar as funcionalidades do sistema. Este documento descreve como funciona e como usar os componentes.

## Visão Geral

O fluxo de onboarding funciona da seguinte forma:

1. **Login do usuário** → Sistema verifica se há memberships
2. **Se não há memberships** → Modal de vinculação é exibido
3. **Usuário digita CNPJ + senha** → Sistema verifica credenciais
4. **Se válido** → Cria membership e define tenant atual
5. **Se inválido** → Exibe erro e permite nova tentativa

## Componentes

### ModalVinculoCnpj

Modal principal para vinculação ao CNPJ.

```jsx
import { ModalVinculoCnpj } from '@/components/ModalVinculoCnpj';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Vincular ao CNPJ
      </button>
      
      <ModalVinculoCnpj
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
```

**Funcionalidades:**
- ✅ **Máscara de CNPJ** automática (00.000.000/0000-00)
- ✅ **Validação em tempo real** do CNPJ
- ✅ **Verificação de credenciais** via Convex
- ✅ **Criação automática** de membership
- ✅ **Estados visuais** (formulário, verificando, sucesso, erro)
- ✅ **Tratamento de erros** robusto

### OnboardingGuard

Componente para proteger rotas de usuários sem vínculo.

```jsx
import { OnboardingGuard } from '@/components/OnboardingGuard';

function App() {
  return (
    <OnboardingGuard>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </OnboardingGuard>
  );
}
```

**Funcionalidades:**
- ✅ **Verificação automática** de memberships
- ✅ **Tela de onboarding** para usuários sem vínculo
- ✅ **Seletor de tenant** para usuários com múltiplos vínculos
- ✅ **Proteção de rotas** baseada no status de onboarding

## Hooks

### useOnboardingRequired

Hook para verificar se o usuário precisa fazer onboarding.

```jsx
import { useOnboardingRequired } from '@/components/ModalVinculoCnpj';

function MyComponent() {
  const { needsOnboarding, isLoading } = useOnboardingRequired();

  if (isLoading) return <div>Carregando...</div>;
  if (needsOnboarding) return <div>Precisa fazer onboarding</div>;
  
  return <div>Onboarding completo</div>;
}
```

### useOnboardingStatus

Hook para obter status detalhado do onboarding.

```jsx
import { useOnboardingStatus } from '@/components/OnboardingGuard';

function MyComponent() {
  const { 
    isOnboardingComplete, 
    needsOnboarding, 
    needsTenantSelection, 
    isLoading,
    membershipsCount 
  } = useOnboardingStatus();

  return (
    <div>
      <p>Completo: {isOnboardingComplete ? 'Sim' : 'Não'}</p>
      <p>Precisa onboarding: {needsOnboarding ? 'Sim' : 'Não'}</p>
      <p>Precisa seleção: {needsTenantSelection ? 'Sim' : 'Não'}</p>
      <p>Memberships: {membershipsCount}</p>
    </div>
  );
}
```

## Integração com Layout

O modal de onboarding é automaticamente exibido no Layout quando necessário:

```jsx
// src/components/Layout.jsx
import { ModalVinculoCnpj, useOnboardingRequired } from './ModalVinculoCnpj';

function Layout({ children }) {
  const { needsOnboarding } = useOnboardingRequired();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (needsOnboarding) {
      setShowModal(true);
    }
  }, [needsOnboarding]);

  return (
    <div>
      {children}
      <ModalVinculoCnpj
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
```

## Fluxo de Verificação

### 1. Verificação de CNPJ

```typescript
// Validação local
const isValid = isValidCnpj(cnpj);

// Normalização
const normalizedCnpj = normalizeCnpj(cnpj);

// Formatação para exibição
const formattedCnpj = formatCnpj(cnpj);
```

### 2. Verificação de Credenciais

```typescript
// Chamada para Convex
const result = await verifyCnpjAndPassword({
  cnpj: normalizedCnpj,
  password: password,
});
```

### 3. Criação de Membership

```typescript
// Criar membership automaticamente
await addMembership({
  tenantId: result.tenantId,
  userId: '', // Preenchido automaticamente
  role: 'employee', // Role padrão
});
```

### 4. Definição de Tenant Atual

```typescript
// Definir tenant atual
setTenantId(result.tenantId);
```

## Estados do Modal

### Formulário
- Campos de CNPJ e senha
- Validação em tempo real
- Botões de cancelar e vincular

### Verificando
- Spinner de carregamento
- Mensagem de "Verificando credenciais..."

### Sucesso
- Ícone de sucesso
- Informações do tenant vinculado
- Botão para continuar

### Erro
- Ícone de erro
- Mensagem de erro específica
- Botões para tentar novamente ou cancelar

## Tratamento de Erros

### Erros de Validação
- CNPJ inválido
- Senha muito curta
- Campos obrigatórios

### Erros de Verificação
- CNPJ não encontrado
- Senha incorreta
- Tenant suspenso ou expirado
- Rate limit excedido

### Erros de Sistema
- Falha na conexão
- Erro interno do servidor
- Timeout de requisição

## Personalização

### Fallback Customizado

```jsx
<OnboardingGuard fallback={<MyCustomOnboarding />}>
  <AppContent />
</OnboardingGuard>
```

### Estilos Customizados

```jsx
// Personalizar aparência do modal
<ModalVinculoCnpj
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  className="custom-modal"
/>
```

## Exemplo Completo

Veja `src/pages/OnboardingExample.jsx` para um exemplo completo de uso de todas as funcionalidades.

## Segurança

- ✅ **Validação local** de CNPJ antes de enviar
- ✅ **Rate limiting** no servidor (5 tentativas/minuto)
- ✅ **Verificação de senha** com hash seguro
- ✅ **Validação de status** do tenant
- ✅ **Verificação de expiração** automática

## Acessibilidade

- ✅ **Labels apropriados** para campos
- ✅ **Estados visuais** claros
- ✅ **Mensagens de erro** descritivas
- ✅ **Navegação por teclado** suportada
- ✅ **Contraste adequado** para leitura
