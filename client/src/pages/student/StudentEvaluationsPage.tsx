import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  Calendar, 
  Clock, 
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen
} from 'lucide-react';

const StudentEvaluationsPage = () => {
  // Mock data - em produção viria da API
  const evaluations = [
    {
      id: 1,
      title: 'Prova de Matemática',
      subject: 'Matemática',
      type: 'exam',
      date: '2023-07-15',
      grade: 8.5,
      maxGrade: 10,
      status: 'completed',
      teacher: 'Prof. Maria Silva',
      description: 'Avaliação sobre equações do 2º grau e funções quadráticas'
    },
    {
      id: 2,
      title: 'Trabalho de História',
      subject: 'História',
      type: 'assignment',
      date: '2023-07-10',
      grade: 9.0,
      maxGrade: 10,
      status: 'completed',
      teacher: 'Prof. Carlos Lima',
      description: 'Pesquisa sobre a Revolução Industrial'
    },
    {
      id: 3,
      title: 'Prova de Português',
      subject: 'Português',
      type: 'exam',
      date: '2023-07-25',
      grade: null,
      maxGrade: 10,
      status: 'scheduled',
      teacher: 'Prof. João Santos',
      description: 'Avaliação sobre literatura brasileira'
    },
    {
      id: 4,
      title: 'Apresentação de Ciências',
      subject: 'Ciências',
      type: 'presentation',
      date: '2023-07-20',
      grade: 7.5,
      maxGrade: 10,
      status: 'completed',
      teacher: 'Prof. Ana Costa',
      description: 'Apresentação sobre sistema solar'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'scheduled':
        return 'Agendada';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <FileText className="h-4 w-4" />;
      case 'assignment':
        return <BookOpen className="h-4 w-4" />;
      case 'presentation':
        return <Award className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getGradeColor = (grade: number | null, maxGrade: number) => {
    if (grade === null) return 'text-gray-500';
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeTrend = (grade: number | null) => {
    if (grade === null) return null;
    if (grade >= 8) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (grade >= 6) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const completedEvaluations = evaluations.filter(e => e.status === 'completed');
  const averageGrade = completedEvaluations.length > 0 
    ? (completedEvaluations.reduce((sum, e) => sum + (e.grade || 0), 0) / completedEvaluations.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Avaliações</h1>
          <p className="text-gray-600 mt-1">Acompanhe suas avaliações e notas</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{averageGrade}</p>
          <p className="text-sm text-gray-600">Média Geral</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
              </div>
              <Award className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">
                  {evaluations.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {evaluations.filter(e => e.status === 'scheduled').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média</p>
                <p className="text-2xl font-bold text-purple-600">{averageGrade}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluations List */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Lista de Avaliações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div key={evaluation.id} className="p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(evaluation.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{evaluation.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{evaluation.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {evaluation.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(evaluation.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {evaluation.teacher}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`text-xs ${getStatusColor(evaluation.status)}`}>
                      {getStatusText(evaluation.status)}
                    </Badge>
                    {evaluation.grade !== null && (
                      <div className="flex items-center gap-1">
                        <span className={`text-lg font-bold ${getGradeColor(evaluation.grade, evaluation.maxGrade)}`}>
                          {evaluation.grade}
                        </span>
                        <span className="text-sm text-gray-500">/{evaluation.maxGrade}</span>
                        {getGradeTrend(evaluation.grade)}
                      </div>
                    )}
                  </div>
                </div>
                
                {evaluation.status === 'completed' && evaluation.grade !== null && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Desempenho</span>
                      <span className="text-gray-900">
                        {((evaluation.grade / evaluation.maxGrade) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (evaluation.grade / evaluation.maxGrade) >= 0.8 ? 'bg-green-500' :
                          (evaluation.grade / evaluation.maxGrade) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(evaluation.grade / evaluation.maxGrade) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEvaluationsPage;









