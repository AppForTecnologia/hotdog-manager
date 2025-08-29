# 🎯 Configuração do Usuário Master - Pedro Cornetti

## 🚀 **Configuração Automática**

O sistema foi configurado para detectar automaticamente quando você (`pedrinhocornetti@gmail.com`) faz login e configurar suas permissões de Master.

## 📋 **Passos para Ativação:**

### **1. Executar o Seed (APENAS UMA VEZ)**
```bash
# No Convex Dashboard ou via API
npx convex run seed
```

**O que o seed faz:**
- ✅ Cria o usuário Master `pedrinhocornetti@gmail.com`
- ✅ Cria um CNPJ de exemplo para o sistema
- ✅ Vincula o usuário Master ao CNPJ
- ✅ Define permissões de administrador total

### **2. Fazer Login no Sistema**
- Acesse o sistema com o email: `pedrinhocornetti@gmail.com`
- O sistema detectará automaticamente que você é Master
- Seu ID do Clerk será atualizado automaticamente
- Você receberá uma notificação de sucesso

### **3. Verificar Acesso**
- Após o login, você verá o menu "Gerenciar CNPJs" na barra lateral
- Acesse para começar a gerenciar empresas e usuários

## 🔐 **Permissões do Usuário Master:**

### **🏢 Gerenciamento de CNPJs:**
- ✅ **Criar** novos CNPJs para empresas
- ✅ **Editar** informações de CNPJs existentes
- ✅ **Renovar** planos e adicionar dias
- ✅ **Suspender** CNPJs se necessário

### **👥 Controle de Usuários:**
- ✅ **Vincular** usuários a CNPJs específicos
- ✅ **Definir** roles (Admin, Manager, Employee)
- ✅ **Remover** vínculos de usuários
- ✅ **Monitorar** acesso e atividades

### **💰 Sistema de Renovação:**
- ✅ **Adicionar** dias aos planos
- ✅ **Registrar** pagamentos
- ✅ **Histórico** completo de renovações
- ✅ **Relatórios** financeiros

### **📊 Estatísticas do Sistema:**
- ✅ **Visão geral** de todos os CNPJs
- ✅ **Contadores** de usuários ativos
- ✅ **Receita total** do sistema
- ✅ **Status** de renovações

## 🚨 **Se algo der errado:**

### **Problema: "Usuário Master não encontrado"**
**Solução:** Execute o seed primeiro
```bash
npx convex run seed
```

### **Problema: Menu "Gerenciar CNPJs" não aparece**
**Solução:** 
1. Verifique se fez login com `pedrinhocornetti@gmail.com`
2. Recarregue a página
3. Verifique o console do navegador para mensagens de erro

### **Problema: Acesso negado em funcionalidades**
**Solução:**
1. Verifique se o seed foi executado
2. Faça logout e login novamente
3. Aguarde a configuração automática

## 🔧 **Verificação Manual (se necessário):**

### **1. Verificar se o usuário foi criado:**
```bash
# No Convex Dashboard
npx convex run seed
```

### **2. Verificar permissões:**
- Acesse a página "Gerenciar CNPJs"
- Se aparecer, você tem acesso Master
- Se não aparecer, verifique os passos acima

### **3. Verificar logs:**
- Abra o console do navegador (F12)
- Procure por mensagens de configuração
- Verifique se há erros

## 📱 **Interface do Usuário Master:**

### **Menu Principal:**
- 🌭 **Dashboard** - Visão geral do sistema
- 🏢 **Gerenciar CNPJs** - Controle de empresas
- 📊 **Relatórios** - Estatísticas e análises
- ⚙️ **Configurações** - Ajustes do sistema

### **Página de Gerenciamento:**
- 📊 **Cards de estatísticas** (Total CNPJs, Ativos, Receita)
- 🔍 **Busca e filtros** por status
- ➕ **Botão "Novo CNPJ"** para criar empresas
- 📋 **Lista de CNPJs** com ações (Renovar, Vincular, etc.)

## 🎯 **Próximos Passos Após Configuração:**

### **1. Criar seu primeiro CNPJ:**
- Clique em "Novo CNPJ"
- Preencha os dados da empresa
- Defina o plano e quantidade de dias
- Clique em "Criar CNPJ"

### **2. Vincular usuários:**
- Na lista de CNPJs, clique em "Vincular Usuário"
- Digite o ID do Clerk do usuário
- Escolha o role (Admin, Manager, Employee)
- Clique em "Vincular"

### **3. Gerenciar renovações:**
- Monitore CNPJs próximos de expirar
- Renove planos conforme necessário
- Registre pagamentos recebidos

## 🆘 **Suporte:**

### **Se precisar de ajuda:**
1. **Verifique** este arquivo de instruções
2. **Execute** o seed se necessário
3. **Faça logout/login** para reconfigurar
4. **Verifique** o console do navegador

### **Contato:**
- 📧 **Email:** pedrinhocornetti@gmail.com
- 🌐 **Sistema:** Acesse a página de gerenciamento

---

**🎉 Parabéns!** Você agora é o usuário Master do sistema HotDog Manager com controle total sobre todas as funcionalidades.
