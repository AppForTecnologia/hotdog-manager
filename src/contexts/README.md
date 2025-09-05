# TenantContext

O `TenantContext` é um contexto React que gerencia o estado atual do tenant no sistema multi-tenant. Ele fornece funcionalidades para carregar memberships, persistir o tenant selecionado e verificar permissões.

## Funcionalidades

- **Carregamento automático de memberships** via Convex
- **Persistência do tenant atual** no localStorage
- **Verificação de acesso** e permissões por role
- **Hooks personalizados** para diferentes casos de uso
- **Componentes auxiliares** para seleção e proteção de rotas

## Como Usar

### 1. Provider

O `TenantProvider` deve envolver a aplicação (já configurado no `App.jsx`):

```jsx
import { TenantProvider } from '@/contexts/TenantContext';

function App() {
  return (
    <TenantProvider>
      {/* Sua aplicação */}
    </TenantProvider>
  );
}
```

### 2. Hook Principal

```jsx
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { 
    currentTenantId, 
    setTenantId, 
    memberships, 
    tenantInfo, 
    isLoading, 
    error 
  } = useTenant();

  return (
    <div>
      {isLoading && <div>Carregando...</div>}
      {error && <div>Erro: {error}</div>}
      {tenantInfo && <div>Tenant: {tenantInfo.companyName}</div>}
    </div>
  );
}
```

### 3. Verificação de Acesso

```jsx
import { useTenantAccess } from '@/contexts/TenantContext';

function MyComponent() {
  const { hasAccess, role, isAdmin, isManager, isEmployee } = useTenantAccess();

  if (!hasAccess) {
    return <div>Acesso negado</div>;
  }

  return (
    <div>
      <p>Role: {role}</p>
      {isAdmin && <button>Função de Admin</button>}
    </div>
  );
}
```

### 4. Informações do Tenant Atual

```jsx
import { useCurrentTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { tenantId, tenantInfo, membership, isLoaded } = useCurrentTenant();

  if (!isLoaded) {
    return <div>Carregando tenant...</div>;
  }

  return (
    <div>
      <h1>{tenantInfo?.companyName}</h1>
      <p>CNPJ: {tenantInfo?.cnpj}</p>
      <p>Role: {membership?.role}</p>
    </div>
  );
}
```

### 5. Lista de Tenants Disponíveis

```jsx
import { useAvailableTenants } from '@/contexts/TenantContext';

function TenantList() {
  const availableTenants = useAvailableTenants();

  return (
    <div>
      {availableTenants.map(({ tenantId, tenantInfo, role }) => (
        <div key={tenantId}>
          <h3>{tenantInfo.companyName}</h3>
          <p>Role: {role}</p>
        </div>
      ))}
    </div>
  );
}
```

## Componentes Auxiliares

### TenantSelector

Componente para seleção de tenant:

```jsx
import { TenantSelector } from '@/components/TenantSelector';

function MyPage() {
  return (
    <div>
      <TenantSelector />
    </div>
  );
}
```

### TenantGuard

Componente para proteger rotas baseadas no tenant:

```jsx
import { TenantGuard } from '@/components/TenantGuard';

function MyPage() {
  return (
    <TenantGuard requiredRole="admin">
      <div>Conteúdo apenas para admins</div>
    </TenantGuard>
  );
}
```

### CurrentTenantDisplay

Componente compacto para mostrar o tenant atual:

```jsx
import { CurrentTenantDisplay } from '@/components/TenantSelector';

function Header() {
  return (
    <div>
      <CurrentTenantDisplay />
    </div>
  );
}
```

## Hooks de Verificação

### useCanAccess

Hook para verificar se o usuário pode acessar uma funcionalidade:

```jsx
import { useCanAccess } from '@/components/TenantGuard';

function MyComponent() {
  const { canAccess, reason, role } = useCanAccess('admin');

  return (
    <div>
      {canAccess ? (
        <button>Função de Admin</button>
      ) : (
        <div>Motivo: {reason}</div>
      )}
    </div>
  );
}
```

## Persistência

O tenant atual é automaticamente salvo no localStorage com a chave `hotdog_current_tenant_id`. Quando o usuário faz login novamente, o sistema:

1. Carrega os memberships do usuário
2. Verifica se o tenant salvo ainda é válido
3. Se válido, restaura o tenant
4. Se inválido, limpa o localStorage e permite nova seleção

## Estados do Contexto

- **`currentTenantId`**: ID do tenant atual (string | null)
- **`setTenantId`**: Função para definir o tenant atual
- **`memberships`**: Lista de memberships do usuário
- **`tenantInfo`**: Informações do tenant atual
- **`isLoading`**: Estado de carregamento
- **`error`**: Erro se houver
- **`refreshMemberships`**: Função para recarregar memberships

## Exemplo Completo

Veja `src/pages/TenantExample.jsx` para um exemplo completo de uso de todas as funcionalidades.
