import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRootUserInfo } from '@/components/RootGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
 * Página de monitoramento do sistema de cron
 * Permite visualizar status do cron e executar testes manuais
 */
export default function RootCronMonitor() {
  const { isRootAdmin } = useRootUserInfo();
  const [testResult, setTestResult] = useState(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Queries
  const cronStatus = useQuery(api.tenants.getCronStatus);
  const expirationStats = useQuery(api.tenants.getExpirationStats);

  // Mutations
  const testMarkExpired = useMutation(api.tenants.testMarkExpired);

  if (!isRootAdmin) {
    return null;
  }

  // Função para executar teste manual
  const handleTestCron = async () => {
    setIsRunningTest(true);
    setTestResult(null);
    
    try {
      const result = await testMarkExpired();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Erro ao executar teste: ${error.message}`,
        error: error.toString(),
        timestamp: Date.now(),
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  // Função para formatar timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // Função para calcular próxima execução
  const getNextCronRun = () => {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setUTCHours(3, 0, 0, 0); // 03:00 UTC
    
    // Se já passou das 03:00 UTC hoje, próxima execução é amanhã
    if (now.getUTCHours() >= 3) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }
    
    return nextRun;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Monitor de Cron Jobs</h1>
          <p className="text-gray-600 mt-2">Monitoramento e controle do sistema de cron diário</p>
        </div>

        {/* Status do Cron */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status do Cron</CardTitle>
              <div className="text-2xl">⏰</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {cronStatus?.cronStatus || 'Carregando...'}
              </div>
              <p className="text-xs text-muted-foreground">
                Sistema ativo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Execução</CardTitle>
              <div className="text-2xl">🔄</div>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatTimestamp(getNextCronRun().getTime())}
              </div>
              <p className="text-xs text-muted-foreground">
                03:00 UTC (diário)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expirando em 24h</CardTitle>
              <div className="text-2xl">⚠️</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {cronStatus?.expiringIn24Hours || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Tenants próximos do vencimento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Precisam Marcar</CardTitle>
              <div className="text-2xl">🚨</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {cronStatus?.shouldBeExpired || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Tenants expirados não marcados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas de Expiração */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Estatísticas de Expiração
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expirationStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{expirationStats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{expirationStats.active}</div>
                  <div className="text-sm text-gray-600">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{expirationStats.expired}</div>
                  <div className="text-sm text-gray-600">Expirados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{expirationStats.suspended}</div>
                  <div className="text-sm text-gray-600">Suspensos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{expirationStats.expiringToday}</div>
                  <div className="text-sm text-gray-600">Expirando Hoje</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{expirationStats.expiringIn7Days}</div>
                  <div className="text-sm text-gray-600">Expirando em 7 dias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{expirationStats.expiredToday}</div>
                  <div className="text-sm text-gray-600">Expirados Hoje</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando estatísticas...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teste Manual */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🧪</span>
              Teste Manual do Cron
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Execute o processo de marcação de tenants expirados manualmente para testes e debugging.
              </p>
              
              <Button 
                onClick={handleTestCron}
                disabled={isRunningTest}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunningTest ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Executando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🚀</span>
                    Executar Teste Manual
                  </>
                )}
              </Button>

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${
                      testResult.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResult.success ? '✅' : '❌'}
                    </span>
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        testResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {testResult.message}
                      </h4>
                      <p className={`text-sm mt-1 ${
                        testResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        Executado em: {formatTimestamp(testResult.timestamp)}
                      </p>
                      
                      {testResult.result && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <h5 className="font-medium text-gray-900 mb-2">Resultado:</h5>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p><strong>Total encontrados:</strong> {testResult.result.totalExpired}</p>
                            <p><strong>Marcados com sucesso:</strong> {testResult.result.markedCount}</p>
                            <p><strong>Erros:</strong> {testResult.result.errors?.length || 0}</p>
                          </div>
                          
                          {testResult.result.errors && testResult.result.errors.length > 0 && (
                            <div className="mt-2">
                              <h6 className="font-medium text-red-900">Erros encontrados:</h6>
                              <ul className="text-sm text-red-700 list-disc list-inside">
                                {testResult.result.errors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {testResult.error && (
                        <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                          <h5 className="font-medium text-red-900 mb-1">Erro:</h5>
                          <p className="text-sm text-red-700">{testResult.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>ℹ️</span>
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Cron Jobs Configurados</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marcar Tenants Expirados:</span>
                    <Badge variant="outline">Diário 03:00 UTC</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Relatório de Expirações:</span>
                    <Badge variant="outline">Semanal Segunda 09:00 UTC</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Limpeza de Dados:</span>
                    <Badge variant="outline">Mensal Dia 1 02:00 UTC</Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Status Atual</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Última verificação:</span>
                    <span className="font-medium">{formatTimestamp(cronStatus?.lastCheck)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horário atual:</span>
                    <span className="font-medium">{formatTimestamp(cronStatus?.currentTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status do sistema:</span>
                    <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
