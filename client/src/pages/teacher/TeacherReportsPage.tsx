import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText,
  Download,
  Calendar,
  BookOpen
} from 'lucide-react';
import { useTeacherActivities } from '@/hooks/useApi';

export default function TeacherReportsPage() {
  const { data: activitiesData, isLoading } = useTeacherActivities();

  const activities = activitiesData?.data || [];

  // Calcular estatísticas
  const totalActivities = activities.length;
  const activeActivities = activities.filter(a => a.status === 'active').length;
  const totalSubmissions = activities.reduce((sum, a) => sum + (a.submissionCount || 0), 0);
  const pendingGrading = activities.reduce((sum, a) => sum + (a.pendingCount || 0), 0);
  const gradedSubmissions = activities.reduce((sum, a) => sum + (a.gradedCount || 0), 0);

  // Agrupar por disciplina
  const activitiesBySubject = activities.reduce((acc, activity) => {
    const subject = activity.subjectName || 'Sem disciplina';
    if (!acc[subject]) {
      acc[subject] = {
        total: 0,
        active: 0,
        submissions: 0,
        pending: 0,
        graded: 0
      };
    }
    acc[subject].total++;
    if (activity.status === 'active') acc[subject].active++;
    acc[subject].submissions += activity.submissionCount || 0;
    acc[subject].pending += activity.pendingCount || 0;
    acc[subject].graded += activity.gradedCount || 0;
    return acc;
  }, {} as Record<string, any>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Acompanhe o desempenho das suas atividades</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Atividades</p>
                <p className="text-2xl font-bold text-gray-900">{totalActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atividades Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{activeActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Submissões</p>
                <p className="text-2xl font-bold text-gray-900">{totalSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Avaliação</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório por Disciplina */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Relatório por Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(activitiesBySubject).length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-gray-600">
                Crie atividades para ver os relatórios por disciplina.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(activitiesBySubject).map(([subject, stats]) => (
                <div key={subject} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{subject}</h3>
                    <Badge variant="outline">{stats.total} atividade{stats.total !== 1 ? 's' : ''}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{stats.active}</p>
                      <p className="text-xs text-gray-600">Ativas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{stats.submissions}</p>
                      <p className="text-xs text-gray-600">Submissões</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                      <p className="text-xs text-gray-600">Pendentes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{stats.graded}</p>
                      <p className="text-xs text-gray-600">Avaliadas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade criada
              </h3>
              <p className="text-gray-600">
                Crie atividades para acompanhar o progresso dos alunos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.subjectName} • {activity.className}</p>
                    <p className="text-xs text-gray-500">
                      Criada em: {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">
                      {activity.submissionCount || 0} submissões
                    </Badge>
                    {activity.pendingCount > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {activity.pendingCount} pendentes
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






