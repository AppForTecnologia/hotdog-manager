import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

/**
 * Sistema de Cron Jobs para o HotDog Manager
 * 
 * Este arquivo define todos os jobs agendados que são executados automaticamente
 * pelo Convex em intervalos regulares.
 */

const crons = cronJobs();

/**
 * Cron Job Diário - Marcar Tenants Expirados
 * 
 * Executa todos os dias às 03:00 UTC para:
 * - Identificar tenants que expiraram (expiresAt < now)
 * - Marcar como "expired" no banco de dados
 * - Desativar memberships relacionados
 * - Gerar logs para monitoramento
 * 
 * Horário: 03:00 UTC (meio da noite no Brasil)
 * Frequência: Diário
 * Duração estimada: 1-5 minutos (dependendo da quantidade de tenants)
 */
crons.daily(
  "mark expired tenants",
  { hourUTC: 3, minuteUTC: 0 }, // 03:00 UTC
  api.tenants.markExpired
);

/**
 * Cron Job Semanal - Relatório de Expirações
 * 
 * Executa toda segunda-feira às 09:00 UTC para:
 * - Gerar relatório de tenants expirando na semana
 * - Enviar notificações para administradores
 * - Atualizar estatísticas de expiração
 * 
 * Horário: 09:00 UTC (06:00 no Brasil)
 * Frequência: Semanal (segunda-feira)
 */
crons.weekly(
  "expiration report",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 }, // Segunda 09:00 UTC
  api.tenants.getExpirationStats
);

/**
 * Cron Job Mensal - Limpeza de Dados Antigos
 * 
 * Executa no primeiro dia do mês às 02:00 UTC para:
 * - Limpar logs antigos (mais de 90 dias)
 * - Arquivar dados de tenants inativos há muito tempo
 * - Otimizar performance do banco de dados
 * 
 * Horário: 02:00 UTC
 * Frequência: Mensal (dia 1)
 */
crons.monthly(
  "cleanup old data",
  { day: 1, hourUTC: 2, minuteUTC: 0 }, // Dia 1, 02:00 UTC
  api.tenants.markExpired // Por enquanto usa a mesma função, pode ser expandida
);

export default crons;
