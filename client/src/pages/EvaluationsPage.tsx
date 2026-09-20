import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BookOpen, Filter, SortAsc } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';

interface Evaluation {
  id: string;
  title: string;
  subjectName: string;
  teacherName: string;
  date: string;
  time: string;
  type: 'prova' | 'trabalho' | 'seminario' | 'projeto';
  status: 'agendada' | 'realizada' | 'cancelada';
}

export default function EvaluationsPage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'date' | 'subject'>('date');

  useEffect(() => {
    // Simulando dados de exemplo de avaliações
    const mockEvaluations: Evaluation[] = [
      {
        id: '1',
        title: 'Prova de Álgebra',
        subjectName: 'Matemática',
        teacherName: 'Prof. João Silva',
        date: '2025-01-25',
        time: '08:00',
        type: 'prova',
        status: 'agendada'
      },
      {
        id: '2',
        title: 'Avaliação de Literatura',
        subjectName: 'Português',
        teacherName: 'Prof. Ana Santos',
        date: '2025-01-28',
        time: '10:00',
        type: 'prova',
        status: 'agendada'
      },
      {
        id: '3',
        title: 'Seminário sobre Revolução Industrial',
        subjectName: 'História',
        teacherName: 'Prof. Carlos Lima',
        date: '2025-01-30',
        time: '14:00',
        type: 'seminario',
        status: 'agendada'
      },
      {
        id: '4',
        title: 'Prova de Química Orgânica',
        subjectName: 'Ciências',
        teacherName: 'Prof. Maria Costa',
        date: '2025-02-02',
        time: '09:00',
        type: 'prova',
        status: 'agendada'
      },
      {
        id: '5',
        title: 'Projeto de Física',
        subjectName: 'Física',
        teacherName: 'Prof. Roberto Santos',
        date: '2025-02-05',
        time: '15:00',
        type: 'projeto',
        status: 'agendada'
      }
    ];

    setEvaluations(mockEvaluations);
    setLoading(false);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prova':
        return 'bg-red-100 text-red-800';
      case 'trabalho':
        return 'bg-blue-100 text-blue-800';
      case 'seminario':
        return 'bg-purple-100 text-purple-800';
      case 'projeto':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prova':
        return 'Prova';
      case 'trabalho':
        return 'Trabalho';
      case 'seminario':
        return 'Seminário';
      case 'projeto':
        return 'Projeto';
      default:
        return 'Avaliação';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const filterEvaluations = () => {
    let filtered = evaluations;
    
    if (selectedType !== 'todos') {
      filtered = filtered.filter(evaluation => evaluation.type === selectedType);
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return a.subjectName.localeCompare(b.subjectName);
      }
    });
  };

  const getUpcomingEvaluations = () => {
    const today = new Date();
    return filterEvaluations().filter(evaluation => {
      const evalDate = new Date(evaluation.date);
      return evalDate >= today && evaluation.status === 'agendada';
    });
  };

  const getPastEvaluations = () => {
    const today = new Date();
    return filterEvaluations().filter(evaluation => {
      const evalDate = new Date(evaluation.date);
      return evalDate < today || evaluation.status === 'realizada';
    });
  };

  if (loading) {
    return (
      <MainLayout pageTitle="Avaliações">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando avaliações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const upcomingEvaluations = getUpcomingEvaluations();
  const pastEvaluations = getPastEvaluations();

  return (
    <MainLayout pageTitle="Avaliações">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-gray-600">Organize e acompanhe suas avaliações acadêmicas</p>
        </div>

        {/* Filtros e Ordenação */}
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
              </div>
              <div className="flex gap-1">
                {['todos', 'prova', 'trabalho', 'seminario', 'projeto'].map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="text-xs"
                  >
                    {type === 'todos' ? 'Todos' : getTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-1">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('date')}
                  className="text-xs"
                >
                  Data
                </Button>
                <Button
                  variant={sortBy === 'subject' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('subject')}
                  className="text-xs"
                >
                  Matéria
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Próximas Avaliações */}
        {upcomingEvaluations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Próximas Avaliações</h2>
              <Badge variant="secondary" className="ml-2">{upcomingEvaluations.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-amber-600" />
                        <Badge variant="secondary" className="text-xs">
                          {evaluation.subjectName}
                        </Badge>
                      </div>
                      <Badge className={`text-xs ${getTypeColor(evaluation.type)}`}>
                        {getTypeLabel(evaluation.type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{evaluation.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {evaluation.teacherName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{formatDate(evaluation.date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{formatTime(evaluation.time)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Avaliações Realizadas */}
        {pastEvaluations.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Avaliações Realizadas</h2>
              <Badge variant="outline" className="ml-2">{pastEvaluations.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-gray-300 opacity-60 hover:opacity-80">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                        <Badge variant="outline" className="text-xs">
                          {evaluation.subjectName}
                        </Badge>
                      </div>
                      <Badge className={`text-xs ${getTypeColor(evaluation.type)}`}>
                        {getTypeLabel(evaluation.type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-gray-600">{evaluation.title}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {evaluation.teacherName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(evaluation.date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(evaluation.time)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {upcomingEvaluations.length === 0 && pastEvaluations.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedType === 'todos' ? 'Nenhuma avaliação encontrada' : `Nenhuma avaliação do tipo "${getTypeLabel(selectedType)}" encontrada`}
            </h3>
            <p className="text-gray-600">
              {selectedType === 'todos' 
                ? 'Você não possui avaliações no momento.' 
                : 'Tente selecionar outro tipo de avaliação ou remover os filtros.'
              }
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}