import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentPeriod } from '@/hooks/useCurrentPeriod';

interface PerformanceData {
  summary: {
    totalStudents: number;
    totalTeachers: number;
    avgPerformance: number;
    attendanceRate: number;
    completionRate: number;
  };
  keyMetrics: {
    topPerformingClass: string;
    needsAttention: number;
    overallTrend: 'up' | 'down' | 'stable';
  };
}

const CoordinatorPerformance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');
  
  // Buscar período atual
  const { data: currentPeriodData } = useCurrentPeriod();
  const currentPeriod = currentPeriodData?.data;
  
  // Buscar todos os períodos
  const { data: periodsData } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const response = await fetch('/api/periods', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar períodos');
      return response.json();
    }
  });

  // Buscar dados de performance simplificados
  const { data: performanceData, isLoading, error } = useQuery<PerformanceData>({
    queryKey: ['coordinator-performance-simple', selectedPeriod],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/performance-simple', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar dados de performance');
      }
      return response.json();
    },
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  const data = performanceData?.data;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPerformanceStatus = (value: number) => {
    if (value >= 8) return { color: 'text-green-600', status: 'Excelente' };
    if (value >= 6) return { color: 'text-yellow-600', status: 'Bom' };
    return { color: 'text-red-600', status: 'Atenção' };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando performance...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600">Erro ao carregar dados de performance</p>
        </div>
      </MainLayout>
    );
  }

  const performanceStatus = getPerformanceStatus(data.summary.avgPerformance);
  
  const periods = periodsData?.data || [];
  const selectedPeriodData = selectedPeriod === 'current' 
    ? currentPeriod 
    : periods.find((p: any) => p.id === selectedPeriod);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Simplificado */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Institucional</h1>
            <p className="text-gray-600 mt-1">Visão estratégica do desempenho da escola</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-gray-600">Período</span>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  {currentPeriod ? `${currentPeriod.name} (Atual)` : 'Período Atual'}
                </SelectItem>
                {periodsData?.data?.map((period: any) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name} {period.status === 'active' ? '(Ativo)' : 
                     period.status === 'completed' ? '(Concluído)' : 
                     period.status === 'pending' ? '(Pendente)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Informações do Período Selecionado */}
        {selectedPeriodData && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Calendar className="h-5 w-5" />
                {selectedPeriodData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Status</p>
                  <p className="text-lg font-semibold text-amber-800">
                    {selectedPeriodData.status === 'active' ? 'Em Andamento' :
                     selectedPeriodData.status === 'completed' ? 'Concluído' :
                     selectedPeriodData.status === 'pending' ? 'Pendente' : selectedPeriodData.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-600 font-medium">Duração</p>
                  <p className="text-lg font-semibold text-amber-800">
                    {selectedPeriodData.totalDays} dias
                  </p>
                </div>
                {selectedPeriodData.status === 'active' && (
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Dias Restantes</p>
                    <p className="text-lg font-semibold text-amber-800">
                      {selectedPeriodData.remainingDays} dias
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métricas Principais - Visão Estratégica */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Performance Geral */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Performance Geral</p>
                <p className={`text-3xl font-bold ${performanceStatus.color}`}>
                  {data.summary.avgPerformance.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">{performanceStatus.status}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          {/* Frequência */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Frequência</p>
                <p className="text-3xl font-bold text-green-600">
                  {data.summary.attendanceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">Alunos presentes</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          {/* Conclusão de Tarefas */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conclusão</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data.summary.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">Tarefas concluídas</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Pontos de Atenção */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atenção</p>
                <p className="text-3xl font-bold text-red-600">
                  {data.keyMetrics.needsAttention}
                </p>
                <p className="text-xs text-gray-500">Requerem ação</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Resumo Estratégico */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendência Geral */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tendência Geral</h3>
              {getTrendIcon(data.keyMetrics.overallTrend)}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Alunos</span>
                <span className="font-semibold">{data.summary.totalStudents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total de Professores</span>
                <span className="font-semibold">{data.summary.totalTeachers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Turma Destaque</span>
                <span className="font-semibold text-green-600">{data.keyMetrics.topPerformingClass}</span>
              </div>
            </div>
          </Card>

          {/* Ações Estratégicas */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ações Estratégicas</h3>
              <Target className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-3">
              {data.keyMetrics.needsAttention > 0 ? (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">
                    {data.keyMetrics.needsAttention} ponto(s) requerem atenção imediata
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Todos os indicadores estão dentro do esperado
                  </span>
                </div>
              )}
              
              {data.summary.avgPerformance < 7 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <TrendingDown className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Performance abaixo da meta - revisar estratégias pedagógicas
                  </span>
                </div>
              )}
              
              {data.summary.attendanceRate < 85 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    Frequência baixa - implementar ações de retenção
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CoordinatorPerformance;
