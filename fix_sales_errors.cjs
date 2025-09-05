const fs = require('fs');
const path = require('path');

// Ler o arquivo sales.ts
const salesPath = path.join(__dirname, 'convex', 'sales.ts');
let content = fs.readFileSync(salesPath, 'utf8');

// Substituições para corrigir índices
const replacements = [
  // by_sale -> byTenantAndSale
  { from: '.withIndex("by_sale", (q) => q.eq("saleId",', to: '.withIndex("byTenantAndSale", (q) => q.eq("tenantId", args.tenantId).eq("saleId",' },
  // by_status -> byTenantAndStatus
  { from: '.withIndex("by_status", (q) => q.eq("status",', to: '.withIndex("byTenantAndStatus", (q) => q.eq("tenantId", args.tenantId).eq("status",' },
  // by_date -> byTenantAndDate
  { from: '.withIndex("by_date", (q) =>', to: '.withIndex("byTenantAndDate", (q) =>' },
  { from: 'q.gte("saleDate",', to: 'q.eq("tenantId", args.tenantId).gte("saleDate",' },
  // by_sale_item -> byTenantAndSaleItem
  { from: '.withIndex("by_sale_item", (q) => q.eq("saleItemId",', to: '.withIndex("byTenantAndSaleItem", (q) => q.eq("tenantId", args.tenantId).eq("saleItemId",' },
  // by_active -> byTenantAndActive
  { from: '.withIndex("by_active", (q) => q.eq("isActive", true))', to: '.withIndex("byTenantAndActive", (q) => q.eq("tenantId", args.tenantId).eq("isActive", true))' },
  // by_category -> byTenantAndCategory
  { from: '.withIndex("by_category", (q) => q.eq("categoryId",', to: '.withIndex("byTenantAndCategory", (q) => q.eq("tenantId", args.tenantId).eq("categoryId",' },
];

// Aplicar substituições
replacements.forEach(({ from, to }) => {
  content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
});

// Adicionar tenantId aos argumentos das funções que precisam
const functionArgsToUpdate = [
  'export const updatePaymentAndStatus = mutation({',
  'export const processPaymentWithMethods = mutation({',
  'export const paySaleItem = mutation({',
  'export const getSaleItems = query({',
  'export const getSalePaymentStatus = query({',
  'export const getSalesByDateRange = query({',
  'export const getSalesStats = query({',
  'export const getSalesByProduct = query({',
  'export const getSalesByCategory = query({',
  'export const getSalesByPaymentMethod = query({',
  'export const getSalesByCustomer = query({',
  'export const getSalesByUser = query({',
  'export const getSalesByStatus = query({',
  'export const getSalesByDate = query({',
];

functionArgsToUpdate.forEach(funcStart => {
  const regex = new RegExp(`(${funcStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{[\\s]*args:\\s*\\{[\\s]*)`, 'g');
  content = content.replace(regex, `$1tenantId: v.id("tenants"),\n    `);
});

// Corrigir problemas específicos
content = content.replace(
  'tenantId: args.tenantId,',
  'tenantId: args.tenantId,'
);

// Escrever o arquivo corrigido
fs.writeFileSync(salesPath, content);

console.log('Arquivo convex/sales.ts corrigido com sucesso!');
