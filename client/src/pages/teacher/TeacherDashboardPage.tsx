import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  Calendar,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Library
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherExams, useTeacherActivities, useTeacherMaterials, useTeacherClasses, useTeacherSubjects } from '@/hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CurrentPeriodCard from '@/components/CurrentPeriodCard';

function TeacherDashboardPage() {
  const { user } = useAuth();
  
  const { data: examsData } = useTeacherExams(user?.id);
  const { data: activitiesData } = useTeacherActivities(user?.id);
  const { data: materialsData } = useTeacherMaterials(user?.id);
  const { data: classesData } = useTeacherClasses(user?.id);
  const { data: subjectsData } = useTeacherSubjects(user?.id);

  // Garantir que os dados são arrays
  const exams = Array.isArray(examsData) ? examsData : [];
  const activities = Array.isArray(activitiesData) ? activitiesData : [];
  const materials = Array.isArray(materialsData) ? materialsData : [];
  const classes = Array.isArray(classesData) ? classesData : [];
  const subjects = Array.isArray(subjectsData) ? subjectsData : [];

  // Estatísticas
  const totalExams = exams.length;
  const completedExams = exams.filter((exam: any) => exam.status === 'completed').length;
  const scheduledExams = exams.filter((exam: any) => exam.status === 'scheduled').length;
  
  const totalActivities = activities.length;
  const activeActivities = activities.filter((activity: any) => activity.status === 'active').length;
  
  const totalMaterials = materials.length;
  
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;

  // Próximas provas (próximos 7 dias)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingExams = exams
    .filter((exam: any) => {
      const examDate = new Date(exam.examDate);
      return examDate >= new Date() && examDate <= nextWeek && exam.status === 'scheduled';
    })
    .sort((a: any, b: any) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
    .slice(0, 5);

  // Atividades recentes
  const recentActivities = activities
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Agendada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Cancelada</Badge>;
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Ativa</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inativa</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Period Card */}
      <CurrentPeriodCard />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo, {user?.firstName}! Aqui está um resumo das suas atividades.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Provas</p>
                <p className="text-2xl font-semibold text-gray-900">{totalExams}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{completedExams} concluídas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Atividades</p>
                <p className="text-2xl font-semibold text-gray-900">{totalActivities}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">{activeActivities} ativas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Library className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Materiais</p>
                <p className="text-2xl font-semibold text-gray-900">{totalMaterials}</p>
                <div className="flex items-center mt-1">
                  <BookOpen className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-600">Didáticos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Turmas</p>
                <p className="text-2xl font-semibold text-gray-900">{totalClasses}</p>
                <div className="flex items-center mt-1">
                  <BookOpen className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-600">{totalSubjects} disciplinas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Provas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Próximas Provas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma prova agendada para os próximos 7 dias</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingExams.map((exam: any) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exam.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {exam.subjectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {exam.className}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(exam.examDate), 'dd/MM', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(exam.examDate), 'EEEE', { locale: ptBR })}
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
              <FileText className="h-5 w-5 text-green-600" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma atividade criada ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {activity.subjectName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {activity.className}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(activity.status)}
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(activity.createdAt), 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Provas por Bimestre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Resumo de Provas por Bimestre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['1', '2', '3', '4'].map((bimonthly) => {
              const bimonthlyExams = exams.filter((exam: any) => exam.bimonthly === bimonthly);
              const completedBimonthlyExams = bimonthlyExams.filter((exam: any) => exam.status === 'completed');
              
              return (
                <div key={bimonthly} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{bimonthly}º Bimestre</h4>
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      {bimonthlyExams.length} provas
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Concluídas:</span>
                      <span className="font-medium text-green-600">{completedBimonthlyExams.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agendadas:</span>
                      <span className="font-medium text-blue-600">
                        {bimonthlyExams.filter((exam: any) => exam.status === 'scheduled').length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ 
                          width: `${bimonthlyExams.length > 0 ? (completedBimonthlyExams.length / bimonthlyExams.length) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TeacherDashboardPage;
