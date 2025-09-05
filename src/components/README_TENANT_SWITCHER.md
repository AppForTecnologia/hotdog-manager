# TenantSwitcher - Alternância de Tenant

O `TenantSwitcher` é um componente React que permite que usuários com múltiplos CNPJs alternem facilmente entre diferentes tenants. Ele fornece uma interface intuitiva para seleção e mudança de contexto.

## Visão Geral

O componente oferece três variantes de exibição e funcionalidades completas para gerenciamento de tenants:

- **Variante Padrão**: Exibição completa com informações detalhadas
- **Variante Compacta**: Versão menor para headers e barras de navegação
- **Variante Mínima**: Apenas ícone para sidebars e espaços pequenos

## Uso Básico

### Variante Padrão

```jsx
import { TenantSwitcher } from '@/components/TenantSwitcher';

function MyComponent() {
  return (
    <div>
      <TenantSwitcher />
    </div>
  );
}
```

### Variante Compacta

```jsx
<TenantSwitcher variant="compact" />
```

### Variante Mínima

```jsx
<TenantSwitcher variant="minimal" />
```

## Props

### TenantSwitcherProps

```typescript
interface TenantSwitcherProps {
  variant?: 'default' | 'compact' | 'minimal';
  showCurrentTenant?: boolean;
  className?: string;
}
```

**Props:**
- `variant`: Estilo de exibição (padrão: 'default')
- `showCurrentTenant`: Se deve mostrar informações do tenant atual (padrão: true)
- `className`: Classes CSS adicionais

## Variantes

### 1. Padrão (default)

**Características:**
- ✅ Nome da empresa e CNPJ visíveis
- ✅ Dropdown com informações completas
- ✅ Indicadores de expiração e status
- ✅ Opção para limpar seleção
- ✅ Ideal para páginas principais

**Uso:**
```jsx
<TenantSwitcher variant="default" />
```

### 2. Compacta (compact)

**Características:**
- ✅ Botão menor com nome da empresa
- ✅ Dropdown com informações essenciais
- ✅ Indicadores de role e status
- ✅ Ideal para barras de navegação

**Uso:**
```jsx
<TenantSwitcher variant="compact" />
```

### 3. Mínima (minimal)

**Características:**
- ✅ Apenas ícone de edifício
- ✅ Dropdown completo ao clicar
- ✅ Mínimo espaço ocupado
- ✅ Ideal para sidebars

**Uso:**
```jsx
<TenantSwitcher variant="minimal" />
```

## Componentes Auxiliares

### CurrentTenantDisplay

Componente para exibir apenas o tenant atual:

```jsx
import { CurrentTenantDisplay } from '@/components/TenantSwitcher';

function Header() {
  return (
    <div>
      <CurrentTenantDisplay />
    </div>
  );
}
```

**Funcionalidades:**
- ✅ Exibe nome da empresa e CNPJ
- ✅ Estado de carregamento
- ✅ Fallback quando não há tenant

### useHasMultipleTenants

Hook para verificar se o usuário tem múltiplos tenants:

```jsx
import { useHasMultipleTenants } from '@/components/TenantSwitcher';

function MyComponent() {
  const { hasMultipleTenants, isLoading, tenantsCount } = useHasMultipleTenants();

  return (
    <div>
      {hasMultipleTenants && <TenantSwitcher />}
      <p>Total de tenants: {tenantsCount}</p>
    </div>
  );
}
```

## Funcionalidades

### Alternância de Tenant

```jsx
// O componente automaticamente chama setTenantId quando um tenant é selecionado
const handleTenantSwitch = (tenantId: string) => {
  setTenantId(tenantId); // Atualiza contexto e localStorage
};
```

### Sincronização com localStorage

- ✅ **Salva automaticamente** o tenant selecionado
- ✅ **Restaura** ao recarregar a página
- ✅ **Valida** se o tenant ainda é válido
- ✅ **Limpa** se o tenant não for mais acessível

### Indicadores Visuais

**Roles:**
- 🔴 **Admin**: Ícone de escudo vermelho
- 🔵 **Manager**: Ícone de usuários azul
- 🟢 **Employee**: Ícone de usuários verde

**Status:**
- ✅ **Ativo**: Badge verde
- ⚠️ **Expira em breve**: Badge laranja
- ❌ **Expirado**: Badge vermelho
- 🔒 **Suspenso**: Badge cinza

### Validações

- ✅ **Verifica se tenant está ativo**
- ✅ **Verifica se não está expirado**
- ✅ **Verifica se usuário tem acesso**
- ✅ **Atualiza lastAccess** automaticamente

## Integração com Layout

### Sidebar

```jsx
// src/components/Layout.jsx
import { TenantSwitcher, useHasMultipleTenants } from './TenantSwitcher';

function Sidebar() {
  const { hasMultipleTenants } = useHasMultipleTenants();

  return (
    <div>
      {hasMultipleTenants && (
        <TenantSwitcher variant="minimal" />
      )}
    </div>
  );
}
```

### Header

```jsx
// src/components/Layout.jsx
function Header() {
  return (
    <div>
      <TenantSwitcher variant="compact" />
    </div>
  );
}
```

## Estados do Componente

### Carregando

```jsx
if (isLoading) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-500">Carregando...</span>
    </div>
  );
}
```

### Sem Tenants

```jsx
if (availableTenants.length === 0) {
  return null; // Não exibe nada
}
```

### Um Tenant

```jsx
if (availableTenants.length === 1) {
  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium">{tenant.tenantInfo.companyName}</span>
      <Badge variant="secondary" className="text-xs">
        {tenant.role}
      </Badge>
    </div>
  );
}
```

### Múltiplos Tenants

```jsx
// Exibe dropdown com lista de tenants
return (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="outline">
        {currentTenant ? currentTenant.tenantInfo.companyName : 'Selecionar'}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {availableTenants.map((tenant) => (
        <DropdownMenuItem onClick={() => handleTenantSwitch(tenant.tenantId)}>
          {/* Conteúdo do item */}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
```

## Personalização

### Estilos Customizados

```jsx
<TenantSwitcher 
  variant="default" 
  className="custom-tenant-switcher"
/>
```

### Fallback Customizado

```jsx
<TenantSwitcher 
  variant="compact"
  showCurrentTenant={false}
/>
```

## Acessibilidade

- ✅ **Labels apropriados** para elementos
- ✅ **Navegação por teclado** suportada
- ✅ **Estados visuais** claros
- ✅ **Contraste adequado** para leitura
- ✅ **Screen readers** suportados

## Performance

- ✅ **Renderização condicional** baseada em estado
- ✅ **Memoização** de cálculos pesados
- ✅ **Lazy loading** de dados quando necessário
- ✅ **Otimização** de re-renders

## Exemplo Completo

Veja `src/pages/TenantSwitcherExample.jsx` para um exemplo completo de uso de todas as funcionalidades.

## Dependências

- `@radix-ui/react-dropdown-menu` - Componente de dropdown
- `lucide-react` - Ícones
- `@/contexts/TenantContext` - Contexto de tenant
- `@/components/ui/*` - Componentes de UI base

## Troubleshooting

### Problema: Dropdown não abre
**Solução:** Verifique se `@radix-ui/react-dropdown-menu` está instalado

### Problema: Tenants não aparecem
**Solução:** Verifique se o `TenantProvider` está envolvendo a aplicação

### Problema: Alternância não funciona
**Solução:** Verifique se o `setTenantId` está sendo chamado corretamente

### Problema: Estilos não aplicados
**Solução:** Verifique se o Tailwind CSS está configurado corretamente
