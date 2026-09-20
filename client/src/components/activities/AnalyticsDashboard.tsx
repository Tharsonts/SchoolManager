import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Clock, 
  Target, 
  Award, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw,
  Eye,
  MessageSquare,
  Star,
  Brain,
  Zap,
  Trophy,
  Timer,
  FileText,
  Lightbulb
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalActivities: number;
    averageScore: number;
    completionRate: number;
    engagementRate: number;
    totalSubmissions: number;
  };
  trends: {
    date: string;
    submissions: number;
    averageScore: number;
    completionRate: number;
    engagementTime: number;
  }[];
  activityPerformance: {
    activityId: string;
    title: string;
    type: string;
    submissions: number;
    averageScore: number;
    completionRate: number;
    difficulty: number;
    timeSpent: number;
  }[];
  studentPerformance: {
    studentId: string;
    name: string;
    avatar?: string;
    totalScore: number;
    activitiesCompleted: number;
    averageScore: number;
    engagementLevel: 'high' | 'medium' | 'low';
    lastActivity: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  skillsAnalysis: {
    skill: string;
    averageScore: number;
    studentsCount: number;
    improvement: number;
  }[];
  timeAnalysis: {
    hour: number;
    submissions: number;
    averageScore: number;
  }[];
  difficultyDistribution: {
    level: string;
    count: number;
    averageScore: number;
  }[];
  collaborationMetrics: {
    teamProjects: number;
    peerReviews: number;
    discussions: number;
    averageTeamSize: number;
  };
  predictionInsights: {
    atRiskStudents: {
      studentId: string;
      name: string;
      riskLevel: 'high' | 'medium' | 'low';
      factors: string[];
      recommendations: string[];
    }[];
    improvementOpportunities: {
      area: string;
      impact: number;
      effort: number;
      description: string;
    }[];
  };
}

interface AnalyticsDashboardProps {
  classId?: string;
  activityId?: string;
}

export function AnalyticsDashboard({ classId, activityId }: AnalyticsDashboardProps) {
  const { request } = useApi();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [selectedMetric, setSelectedMetric] = useState('submissions');
  const [selectedClass, setSelectedClass] = useState(classId || 'all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedClass, activityId]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());
      if (selectedClass !== 'all') params.append('classId', selectedClass);
      if (activityId) params.append('activityId', activityId);

      const response = await request(`/api/analytics/dashboard?${params.toString()}`);
      setAnalyticsData(response);
    } catch (error) {
      console.error('Erro ao carregar dados de analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());
      if (selectedClass !== 'all') params.append('classId', selectedClass);
      params.append('format', format);

      const response = await request(`/api/analytics/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'csv' ? 'text/csv' : 'application/pdf'
        }
      });

      // Criar download do arquivo
      const blob = new Blob([response], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso!`);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Dashboard de Analytics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData('pdf')}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAnalyticsData}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange?.from?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setDateRange({
                    from: new Date(e.target.value),
                    to: dateRange?.to || new Date()
                  })}
                  className="px-3 py-2 border rounded-md"
                />
                <span>até</span>
                <input
                  type="date"
                  value={dateRange?.to?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setDateRange({
                    from: dateRange?.from || new Date(),
                    to: new Date(e.target.value)
                  })}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                <SelectItem value="class1">Turma A</SelectItem>
                <SelectItem value="class2">Turma B</SelectItem>
                <SelectItem value="class3">Turma C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards de métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Alunos</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {analyticsData.overview.totalStudents}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Atividades</p>
                    <p className="text-3xl font-bold text-green-600">
                      {analyticsData.overview.totalActivities}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nota Média</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatPercentage(analyticsData.overview.averageScore)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {formatPercentage(analyticsData.overview.completionRate)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Target className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de tendências */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendências de Submissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="submissions" 
                      stroke="#8884d8" 
                      name="Submissões"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Distribuição de Dificuldade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.difficultyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, count }) => `${level}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.difficultyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Desempenho por atividade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Desempenho por Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.activityPerformance.map((activity) => (
                  <div key={activity.activityId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <Badge variant="secondary">{activity.type}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercentage(activity.averageScore)}
                        </p>
                        <p className="text-sm text-gray-500">Nota média</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{activity.submissions}</p>
                        <p className="text-sm text-gray-500">Submissões</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {formatPercentage(activity.completionRate)}
                        </p>
                        <p className="text-sm text-gray-500">Taxa de Conclusão</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{activity.difficulty}/5</p>
                        <p className="text-sm text-gray-500">Dificuldade</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">
                          {formatTime(activity.timeSpent)}
                        </p>
                        <p className="text-sm text-gray-500">Tempo Médio</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Análise de habilidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Análise de Habilidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analyticsData.skillsAnalysis}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Pontuação Média"
                    dataKey="averageScore"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Métricas de colaboração */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projetos em Equipe</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {analyticsData.collaborationMetrics.teamProjects}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avaliações por Pares</p>
                    <p className="text-3xl font-bold text-green-600">
                      {analyticsData.collaborationMetrics.peerReviews}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Discussões</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {analyticsData.collaborationMetrics.discussions}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tamanho Médio da Equipe</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {analyticsData.collaborationMetrics.averageTeamSize.toFixed(1)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análise temporal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade por Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.timeAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="#8884d8" name="Submissões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Desempenho dos estudantes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Desempenho dos Estudantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.studentPerformance.slice(0, 10).map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getEngagementColor(student.engagementLevel)}>
                            {student.engagementLevel === 'high' ? 'Alto' :
                             student.engagementLevel === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Última atividade: {new Date(student.lastActivity).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatPercentage(student.averageScore)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {student.activitiesCompleted} atividades
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Oportunidades de melhoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Oportunidades de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.predictionInsights.improvementOpportunities.map((opportunity, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{opportunity.area}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Impacto: {opportunity.impact}/10</Badge>
                          <Badge variant="outline">Esforço: {opportunity.effort}/10</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{opportunity.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tendências de desempenho */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendências de Desempenho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="averageScore" 
                      stroke="#82ca9d" 
                      name="Nota Média"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      stroke="#ffc658" 
                      name="Taxa de Conclusão"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Estudantes em risco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Estudantes em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.predictionInsights.atRiskStudents.map((student) => (
                  <div key={student.studentId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <Badge className={getRiskColor(student.riskLevel)}>
                            Risco {student.riskLevel === 'high' ? 'Alto' :
                                   student.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium mb-2">Fatores de Risco:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {student.factors.map((factor, index) => (
                            <li key={index}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2">Recomendações:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {student.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}