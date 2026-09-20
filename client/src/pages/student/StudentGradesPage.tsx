import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BookOpen, 
  Star,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useStudentActivities } from '@/hooks/useStudentApi';

export default function StudentGradesPage() {
  const { data: activitiesData, isLoading, error } = useStudentActivities();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando notas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar notas</h3>
          <p className="text-gray-600">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  const activities = activitiesData?.data || [];
  const gradedActivities = activities.filter(a => a.submissionStatus === 'graded' && a.submissionGrade !== undefined);

  // Calcular média geral
  const totalGrade = gradedActivities.reduce((sum, activity) => sum + (activity.submissionGrade || 0), 0);
  const averageGrade = gradedActivities.length > 0 ? totalGrade / gradedActivities.length : 0;

  // Agrupar por disciplina
  const activitiesBySubject = gradedActivities.reduce((acc, activity) => {
    const subject = activity.subjectName || 'Sem disciplina';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(activity);
    return acc;
  }, {} as Record<string, any[]>);

  // Calcular média por disciplina
  const subjectAverages = Object.entries(activitiesBySubject).map(([subject, activities]) => {
    const total = activities.reduce((sum, activity) => sum + (activity.submissionGrade || 0), 0);
    const average = activities.length > 0 ? total / activities.length : 0;
    return { subject, average, count: activities.length };
  });

  const getGradeColor = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadge = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Média Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Média Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {averageGrade.toFixed(1)}
            </div>
            <p className="text-gray-600">
              Baseado em {gradedActivities.length} atividade{gradedActivities.length !== 1 ? 's' : ''} avaliada{gradedActivities.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-4">
              <Badge className={getGradeBadge(averageGrade, 10)}>
                {averageGrade >= 8 ? 'Excelente' : averageGrade >= 6 ? 'Bom' : 'Precisa melhorar'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Médias por Disciplina */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            Médias por Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectAverages.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma nota disponível
              </h3>
              <p className="text-gray-600">
                Ainda não há atividades avaliadas pelo professor.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectAverages.map(({ subject, average, count }) => (
                <div key={subject} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{subject}</h3>
                    <Badge className={getGradeBadge(average, 10)}>
                      {average.toFixed(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {count} atividade{count !== 1 ? 's' : ''} avaliada{count !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Notas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-600" />
            Histórico de Notas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gradedActivities.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade avaliada
              </h3>
              <p className="text-gray-600">
                Aguarde as avaliações dos professores.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gradedActivities
                .sort((a, b) => new Date(b.submissionDate || '').getTime() - new Date(a.submissionDate || '').getTime())
                .map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-600">{activity.subjectName}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {activity.submissionDate ? 
                          new Date(activity.submissionDate).toLocaleDateString('pt-BR') : 
                          'Data não disponível'
                        }
                      </span>
                    </div>
                    {activity.submissionFeedback && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        "{activity.submissionFeedback}"
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getGradeColor(activity.submissionGrade || 0, activity.maxGrade)}`}>
                      {activity.submissionGrade}/{activity.maxGrade}
                    </div>
                    <Badge className={getGradeBadge(activity.submissionGrade || 0, activity.maxGrade)}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Avaliada
                    </Badge>
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