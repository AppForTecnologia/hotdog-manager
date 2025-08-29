# 🌭 Sistema de Permissões Multi-Tenant - HotDog Manager

## 📋 **Visão Geral**

Este sistema implementa um controle de permissões multi-tenant onde cada CNPJ representa uma empresa diferente com banco de dados separado. Apenas usuários **Master** podem gerenciar CNPJs e vincular usuários.

## 🔐 **Hierarquia de Usuários**

### **👑 Usuário Master**
- **Acesso total** ao sistema
- Pode **criar, editar e gerenciar** CNPJs
- Pode **vincular usuários** a CNPJs específicos
- Pode **renovar planos** e adicionar dias
- **Única pessoa** que pode acessar a página "Gerenciar CNPJs"

### **👨‍💼 Usuários Vinculados**
- **Admin**: Acesso total dentro do CNPJ
- **Manager**: Acesso de gerência
- **Employee**: Acesso básico de funcionário

## 🚀 **Configuração Inicial**

### **1. Executar o Seed**
```bash
# No Convex Dashboard ou via API
npx convex run seed
```

### **2. Configurar Usuário Master**
1. Faça login no sistema com sua conta Clerk
2. Copie seu **User ID** do Clerk (ex: `user_2abc123def456`)
3. Edite o arquivo `convex/seed.ts`
4. Substitua `"user_master_example"` pelo seu ID real
5. Execute o seed novamente

### **3. Verificar Acesso**
- Após executar o seed, você verá o menu "Gerenciar CNPJs"
- Acesse para criar seu primeiro CNPJ

## 📊 **Funcionalidades do Sistema**

### **🏢 Gerenciamento de CNPJs**
- ✅ **Criar CNPJ**: Nome, CNPJ, email, plano, dias
- ✅ **Renovar CNPJ**: Adicionar dias, registrar pagamento
- ✅ **Vincular Usuários**: Associar usuários a CNPJs
- ✅ **Monitoramento**: Status, expiração, usuários ativos

### **👥 Controle de Usuários**
- ✅ **Vinculação**: Usuário → CNPJ → Role
- ✅ **Permissões**: Admin, Manager, Employee
- ✅ **Acesso**: Verificação automática de validade
- ✅ **Bloqueio**: Usuários sem CNPJ não acessam o sistema

### **⏰ Sistema de Renovação**
- ✅ **Controle de Dias**: Cada CNPJ tem prazo definido
- ✅ **Expiração Automática**: Bloqueia acesso após expirar
- ✅ **Histórico**: Registra todas as renovações
- ✅ **Alertas**: Avisa quando está próximo de expirar

## 🔧 **Como Usar**

### **Para Usuários Master:**

#### **1. Criar um CNPJ**
1. Acesse "Gerenciar CNPJs"
2. Clique em "Novo CNPJ"
3. Preencha os dados da empresa
4. Defina o plano e quantidade de dias
5. Clique em "Criar CNPJ"

#### **2. Vincular um Usuário**
1. Na lista de CNPJs, clique em "Vincular Usuário"
2. Digite o **User ID** do Clerk do usuário
3. Escolha o **Role** (Admin, Manager, Employee)
4. Clique em "Vincular"

#### **3. Renovar um CNPJ**
1. Na lista de CNPJs, clique em "Renovar"
2. Defina quantos dias adicionar
3. Registre o valor pago
4. Escolha o método de pagamento
5. Clique em "Renovar"

### **Para Usuários Vinculados:**
- O sistema **verifica automaticamente** o acesso
- Se o CNPJ expirar, o acesso é **bloqueado**
- Apenas usuários Master podem renovar

## 🛡️ **Segurança e Controle**

### **Proteção de Rotas**
- ✅ Todas as páginas principais são protegidas pelo `CnpjAccessGuard`
- ✅ Usuários sem CNPJ **não acessam** o sistema
- ✅ CNPJs expirados **bloqueiam** o acesso
- ✅ Apenas usuários Master acessam gerenciamento

### **Validações**
- ✅ **CNPJ único**: Não permite duplicatas
- ✅ **Usuário único**: Um usuário só pode ter um CNPJ
- ✅ **Verificação de permissões**: Todas as operações são validadas
- ✅ **Auditoria**: Registra quem fez o quê e quando

## 📱 **Interface do Usuário**

### **Página de Gerenciamento**
- 📊 **Dashboard** com estatísticas gerais
- 🔍 **Busca e filtros** por status
- ➕ **Criação** de novos CNPJs
- 🔄 **Renovação** de planos existentes
- 👥 **Vinculação** de usuários

### **Indicadores Visuais**
- 🟢 **Verde**: CNPJ ativo com mais de 7 dias
- 🟡 **Amarelo**: CNPJ ativo com 7 dias ou menos
- 🔴 **Vermelho**: CNPJ expirado
- 🔵 **Azul**: Plano Basic
- 🟣 **Roxo**: Plano Premium
- 🟠 **Laranja**: Plano Enterprise

## 🚨 **Alertas e Notificações**

### **Sistema de Toast**
- ✅ **Sucesso**: Operações realizadas com sucesso
- ⚠️ **Aviso**: CNPJ próximo de expirar
- ❌ **Erro**: Problemas de validação ou permissão
- 🔒 **Bloqueio**: Acesso negado ou CNPJ expirado

### **Verificações Automáticas**
- ✅ **Login**: Verifica se usuário tem CNPJ ativo
- ✅ **Navegação**: Bloqueia acesso a páginas protegidas
- ✅ **Expiração**: Monitora datas de vencimento
- ✅ **Status**: Atualiza automaticamente

## 🔄 **Fluxo de Trabalho**

### **1. Criação de CNPJ**
```
Master → Criar CNPJ → Definir Plano → Definir Dias → CNPJ Ativo
```

### **2. Vinculação de Usuário**
```
Master → Selecionar CNPJ → Vincular Usuário → Definir Role → Usuário Ativo
```

### **3. Renovação de Plano**
```
Master → Selecionar CNPJ → Adicionar Dias → Registrar Pagamento → Plano Renovado
```

### **4. Controle de Acesso**
```
Usuário → Login → Verificar CNPJ → Verificar Expiração → Acesso Permitido/Bloqueado
```

## 📋 **Estrutura do Banco**

### **Tabelas Principais**
- **`cnpjs`**: Dados das empresas
- **`userCnpjLinks`**: Vínculos usuário-CNPJ
- **`cnpjRenewals`**: Histórico de renovações
- **`users`**: Usuários do sistema

### **Índices de Performance**
- ✅ **`by_cnpj`**: Busca rápida por CNPJ
- ✅ **`by_user`**: Busca rápida por usuário
- ✅ **`by_status`**: Filtros por status
- ✅ **`by_expiration`**: Controle de expiração

## 🚀 **Próximos Passos**

### **Funcionalidades Futuras**
- 📧 **Notificações por email** de expiração
- 💳 **Integração com gateway de pagamento**
- 📊 **Relatórios financeiros** detalhados
- 🔔 **Sistema de alertas** automáticos
- 👥 **Gestão de equipes** por CNPJ

### **Melhorias Técnicas**
- 🚀 **Cache** para consultas frequentes
- 📱 **PWA** para acesso mobile
- 🔐 **2FA** para usuários Master
- 📊 **Analytics** de uso do sistema

## ❓ **Suporte e Dúvidas**

### **Problemas Comuns**
1. **"Acesso Negado"**: Verificar se usuário é Master
2. **"CNPJ não encontrado"**: Verificar se foi criado corretamente
3. **"Usuário já vinculado"**: Um usuário só pode ter um CNPJ
4. **"CNPJ expirado"**: Renovar o plano

### **Contato**
- 📧 **Email**: admin@hotdogmanager.com
- 📱 **Telefone**: (11) 99999-9999
- 🌐 **Sistema**: Acesse a página de gerenciamento

---

**⚠️ Importante**: Este sistema é destinado apenas para usuários autorizados. Mantenha suas credenciais seguras e não compartilhe acesso com pessoas não autorizadas.
