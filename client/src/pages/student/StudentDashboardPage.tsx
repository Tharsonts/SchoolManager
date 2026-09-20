import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useStudentClassInfo } from '@/hooks/useStudentApi';
import { useStudentActivities } from '@/hooks/useStudentApi';
import CurrentPeriodCard from '@/components/CurrentPeriodCard';

export default function StudentDashboardPage() {
  const { data: classData, isLoading: classLoading } = useStudentClassInfo();
  const { data: activitiesData, isLoading: activitiesLoading } = useStudentActivities();

  const activities = activitiesData?.data || [];
  const classInfo = classData?.data;

  // Calcular estatísticas
  const pendingActivities = activities.filter(a => !a.submissionStatus).length;
  const submittedActivities = activities.filter(a => a.submissionStatus === 'submitted').length;
  const gradedActivities = activities.filter(a => a.submissionStatus === 'graded').length;

  if (classLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Período Atual */}
      <CurrentPeriodCard />

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            Bem-vindo de volta!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Sua Turma</h3>
              <p className="text-2xl font-bold text-amber-600">
                {classInfo?.class?.name || 'Não matriculado'}
              </p>
              <p className="text-sm text-gray-600">
                {classInfo?.teachers?.length || 0} professores • {classInfo?.totalStudents || 0} alunos
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Status</h3>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
              <p className="text-sm text-gray-600 mt-1">
                Matriculado desde {classInfo?.enrollmentDate ? 
                  new Date(classInfo.enrollmentDate).toLocaleDateString('pt-BR') : 
                  'Data não disponível'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">{submittedActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avaliadas</p>
                <p className="text-2xl font-bold text-gray-900">{gradedActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-gray-600">
                Sua turma ainda não possui atividades disponíveis.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.subjectName}</p>
                    <p className="text-xs text-gray-500">
                      Entrega: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.submissionStatus === 'graded' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Avaliada
                      </Badge>
                    ) : activity.submissionStatus === 'submitted' ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        <FileText className="h-3 w-3 mr-1" />
                        Enviada
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
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