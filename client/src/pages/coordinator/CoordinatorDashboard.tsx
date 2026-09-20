import React from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCoordinatorDashboard, useCoordinatorClasses, useSystemStatus } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building,
  TrendingUp,
  Calendar,
  MessageSquare,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';

const CoordinatorDashboard: React.FC = () => {
  const [, navigate] = useLocation();

  const { data: dashboardData, isLoading: statsLoading } = useCoordinatorDashboard();
  const { data: classesData, isLoading: classesLoading } = useCoordinatorClasses();
  const { data: systemStatus } = useSystemStatus();

  const stats = [
    {
      title: 'Total de Alunos',
      value: dashboardData?.totals?.students ?? 0,
      change: '',
      changeType: 'neutral',
      icon: Users,
      description: 'atual'
    },
    {
      title: 'Professores Ativos',
      value: dashboardData?.totals?.teachers ?? 0,
      change: '',
      changeType: 'neutral',
      icon: GraduationCap,
      description: 'atual'
    },
    {
      title: 'Turmas',
      value: dashboardData?.totals?.classes ?? 0,
      change: '',
      changeType: 'neutral',
      icon: Building,
      description: 'atual'
    },
    {
      title: 'Atividades Pendentes',
      value: dashboardData?.totals?.pendingActivities ?? 0,
      change: '',
      changeType: 'neutral',
      icon: FileText,
      description: 'aguardando aprovação'
    },
  ];

  // Garantir que usamos o array corretamente, pois a API retorna { success, data }
  const classesList = Array.isArray(classesData?.data)
    ? classesData.data
    : Array.isArray(classesData)
    ? classesData
    : [];

  const recentActivities = classesList
    .map((cls: any) => ({
      id: `${cls.id}-last-activity`,
      type: 'activity',
      message: cls.lastActivity
        ? `Atividade recente em ${cls.name}: ${cls.lastActivity.title}`
        : `Sem atividades recentes em ${cls.name}`,
      time: cls.lastActivity
        ? format(new Date(cls.lastActivity.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
        : '—',
      icon: Activity
    }))
    .slice(0, 6);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Coordenador</h1>
          <p className="text-gray-600">Visão geral do sistema escolar</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            {systemStatus?.serverOnline ? 'Sistema Online' : 'Sistema Offline'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(statsLoading ? [1,2,3,4] : stats).map((stat: any, index: number) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {statsLoading ? 'Carregando...' : stat.title}
              </CardTitle>
              {!statsLoading && stat.icon && <stat.icon className="h-4 w-4 text-gray-400" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '—' : stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  stat.changeType === 'positive' 
                    ? 'bg-green-100 text-green-800' 
                    : stat.changeType === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {stat.change || '—'}
                </span>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(classesLoading ? [] : recentActivities).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <activity.icon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
              {(!classesLoading && recentActivities.length === 0) && (
                <div className="text-sm text-gray-500">Nenhuma atividade recente encontrada.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate('/coordinator/students')}>
                <Users className="h-6 w-6 mb-2" />
                <span className="text-sm">Gerenciar Alunos</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate('/coordinator/teachers')}>
                <GraduationCap className="h-6 w-6 mb-2" />
                <span className="text-sm">Gerenciar Professores</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate('/coordinator/classes')}>
                <Building className="h-6 w-6 mb-2" />
                <span className="text-sm">Gerenciar Turmas</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate('/coordinator/activities')}>
                <BookOpen className="h-6 w-6 mb-2" />
                <span className="text-sm">Gerenciar Atividades</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${systemStatus?.serverOnline ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
              <span className="text-sm">Servidor {systemStatus?.serverOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${systemStatus?.databaseConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
              <span className="text-sm">Banco de Dados {systemStatus?.databaseConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${systemStatus?.apiWorking ? 'bg-green-500' : 'bg-red-500'} rounded-full`}></div>
              <span className="text-sm">API {systemStatus?.apiWorking ? 'Funcionando' : 'Indisponível'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoordinatorDashboard;




