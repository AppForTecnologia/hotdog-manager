# Configuração do Painel Root

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

Crie ou atualize seu arquivo `.env`:

```bash
# Root Admin Allowlist (emails separados por vírgula)
VITE_ROOT_ALLOWLIST=appfortecnologia@gmail.com,admin@empresa.com,suporte@hotdog.com
```

### 2. Verificação da Configuração

Para verificar se a configuração está funcionando:

1. Acesse `/root` no navegador
2. Se você ver uma página 404, seu email não está na allowlist
3. Se você ver o dashboard, a configuração está correta

### 3. Debug de Configuração

Se houver problemas, verifique:

```javascript
// No console do navegador
console.log('Allowlist:', window.config?.root?.allowlist);
console.log('Seu email:', window.user?.emailAddresses?.[0]?.emailAddress);
```

## 📋 Checklist de Configuração

- [ ] Variável `VITE_ROOT_ALLOWLIST` configurada
- [ ] Email do administrador incluído na allowlist
- [ ] Aplicação reiniciada após mudanças no .env
- [ ] Acesso a `/root` funcionando
- [ ] Proteção 404 funcionando para emails não autorizados

## 🚀 Primeiros Passos

### 1. Criar Primeiro Tenant

1. Acesse `/root/tenants`
2. Clique em "Criar Tenant"
3. Preencha os dados:
   - **CNPJ**: 12.345.678/0001-90
   - **Nome da Empresa**: Empresa Teste
   - **Plano**: Básico
   - **Dias**: 30
   - **Senha**: senha123
   - **Observações**: Tenant de teste

### 2. Testar Funcionalidades

- [ ] Criar tenant
- [ ] Buscar tenant por CNPJ
- [ ] Filtrar por status
- [ ] Renovar tenant
- [ ] Suspender tenant
- [ ] Reativar tenant

### 3. Verificar Relatórios

1. Acesse `/root/reports`
2. Verifique se as estatísticas estão corretas
3. Teste os filtros de período
4. Analise as ações recomendadas

## 🔒 Segurança

### Boas Práticas

1. **Use emails corporativos** na allowlist
2. **Limite o número** de administradores
3. **Monitore o acesso** regularmente
4. **Mantenha a allowlist atualizada**
5. **Use senhas fortes** para tenants

### Exemplo de Allowlist Segura

```bash
# Apenas emails corporativos
VITE_ROOT_ALLOWLIST=admin@appfortecnologia.com,suporte@appfortecnologia.com
```

### Exemplo de Allowlist Insegura

```bash
# ❌ Não faça isso
VITE_ROOT_ALLOWLIST=teste@gmail.com,admin@hotmail.com,qualquer@email.com
```

## 📊 Monitoramento

### Métricas Importantes

- **Número de tenants ativos**
- **Taxa de renovação**
- **Tenants expirando em breve**
- **Acessos ao painel root**

### Alertas Recomendados

- ⚠️ Tenant expirando em 3 dias
- 🚫 Tenant nunca acessou após 7 dias
- 📈 Mais de 10 tenants criados em um dia
- 🔒 Tentativas de acesso não autorizadas

## 🛠️ Manutenção

### Tarefas Regulares

- [ ] **Semanal**: Verificar tenants expirando
- [ ] **Mensal**: Revisar allowlist de administradores
- [ ] **Trimestral**: Analisar relatórios de uso
- [ ] **Anual**: Revisar políticas de segurança

### Backup

- [ ] Backup da configuração do painel
- [ ] Backup da allowlist de administradores
- [ ] Backup dos dados de tenants
- [ ] Documentação das configurações

## 🆘 Suporte

### Problemas Comuns

1. **"404 - Página Não Encontrada"**
   - Verificar se o email está na allowlist
   - Verificar se a variável de ambiente está carregada

2. **"Erro ao criar tenant"**
   - Verificar se o CNPJ é válido
   - Verificar se o CNPJ não já existe
   - Verificar se todos os campos estão preenchidos

3. **"Nenhum tenant encontrado"**
   - Verificar se há tenants cadastrados
   - Verificar se os filtros estão corretos

### Contato

Para suporte técnico:
- **Email**: suporte@appfortecnologia.com
- **Documentação**: [Link para documentação completa]
- **Issues**: [Link para sistema de issues]
