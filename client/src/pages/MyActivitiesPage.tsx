import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Calendar, Clock, FileText, CheckCircle, AlertCircle, XCircle, Eye, Filter, SortAsc, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStudentActivities } from '@/hooks/useApi';
import { SubmitActivityModal } from '@/components/SubmitActivityModal';
import { ActivityDetailsModal } from '@/components/ActivityDetailsModal';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectName?: string;
  teacherName?: string;
  dueDate: string;
  maxGrade: number;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  isLate?: boolean;
  finalGrade?: number;
  allowLateSubmission?: boolean;
  instructions?: string;
  requirements?: string;
}

interface ActivitySubmission {
  id: string;
  submittedAt: string;
  comment: string;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  attachments?: string[];
}

export default function MyActivitiesPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Record<string, ActivitySubmission>>({});
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  // Usar o hook useStudentActivities do React Query
  const { data: activitiesData, isLoading: loading, error: queryError } = useStudentActivities(user?.id || '');
  
  // Mapear os dados da API para o formato esperado
  const activities = activitiesData?.data ? activitiesData.data.map((activity: any) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    subjectName: activity.subjectName || 'Disciplina',
    teacherName: activity.teacherName || 'Professor',
    dueDate: activity.dueDate,
    maxGrade: activity.maxGrade,
    status: activity.submissionStatus ? 
      (activity.grade ? 'graded' : 'submitted') : 
      (new Date(activity.dueDate) < new Date() ? 'late' : 'pending'),
    submittedAt: activity.submittedAt,
    grade: activity.grade,
    finalGrade: activity.finalGrade,
    feedback: activity.feedback,
    isLate: activity.isLate,
    allowLateSubmission: activity.allowLateSubmission,
    instructions: activity.instructions,
    requirements: activity.requirements
  })) : [];
  
  const error = queryError ? 'Erro ao carregar suas atividades' : null;

  // Não usar dados de exemplo - apenas dados reais do banco
  const exampleActivities: any[] = [];
        
  // Usar as atividades finais (reais ou de exemplo)
  const finalActivities = activities.length > 0 ? activities : exampleActivities;

  // Não usar dados simulados - apenas dados reais do banco

  // Funções para lidar com ações
  const handleSubmitActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowSubmitModal(true);
  };

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  const handleSubmissionSuccess = () => {
    toast({
      title: "Atividade enviada com sucesso!",
      description: "Sua atividade foi enviada e está aguardando avaliação.",
    });
    setShowSubmitModal(false);
    setSelectedActivity(null);
  };

  // Verificar se uma atividade está atrasada
  const isActivityLate = (activity: Activity) => {
    const now = new Date();
    const dueDate = new Date(activity.dueDate);
    return now > dueDate && activity.status === 'pending';
  };

  // Verificar se pode entregar com atraso
  const canSubmitLate = (activity: Activity) => {
    return isActivityLate(activity) && activity.allowLateSubmission;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'submitted':
        return 'Entregue';
      case 'graded':
        return 'Avaliada';
      case 'late':
        return 'Atrasada';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterActivitiesByTab = (tabActivities: Activity[]) => {
    let filtered = tabActivities;

    // Filtrar por matéria
    if (filterSubject !== 'all') {
      filtered = filtered.filter(activity => activity.subjectName === filterSubject);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'subject':
          return (a.subjectName || '').localeCompare(b.subjectName || '');
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getUniqueSubjects = () => {
    const subjects = finalActivities.map(activity => activity.subjectName).filter(Boolean);
    return [...new Set(subjects)];
  };

  // Funções para categorizar atividades por abas
  const getPendingActivities = () => {
    return finalActivities.filter(activity => 
      activity.status === 'pending' || (activity.status === 'late')
    );
  };

  const getSubmittedActivities = () => {
    return finalActivities.filter(activity => 
      activity.status === 'submitted'
    );
  };

  const getGradedActivities = () => {
    return finalActivities.filter(activity => 
      activity.status === 'graded'
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Atividades</h1>
        <p className="text-gray-600">Acompanhe todas as suas atividades e trabalhos escolares</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{error}</p>
          <p className="text-sm text-yellow-600 mt-1">Exibindo dados de exemplo</p>
        </div>
      )}

      {/* Filtros e Controles */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {/* Filtro por Matéria */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            <select 
              value={filterSubject} 
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todas as Matérias</option>
              {getUniqueSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-gray-500" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="dueDate">Ordenar por Data</option>
            <option value="subject">Ordenar por Matéria</option>
            <option value="title">Ordenar por Título</option>
          </select>
        </div>
      </div>

      {/* Sistema de Abas para Atividades */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pendentes
            <Badge variant="secondary" className="ml-1">
              {getPendingActivities().length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="submitted" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Enviadas
            <Badge variant="secondary" className="ml-1">
              {getSubmittedActivities().length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="graded" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Avaliadas
            <Badge variant="secondary" className="ml-1">
              {getGradedActivities().length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Aba Pendentes */}
        <TabsContent value="pending" className="mt-6">
          {getPendingActivities().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterActivitiesByTab(getPendingActivities()).map((activity) => (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="h-5 w-5 text-amber-600" />
                        <Badge variant="secondary" className="text-xs">
                          {activity.subjectName}
                        </Badge>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(activity.status)}
                          <span>{getStatusText(activity.status)}</span>
                        </div>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {activity.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Entrega: {formatDate(activity.dueDate)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>Nota máxima: {activity.maxGrade}</span>
                    </div>
                    
                    {activity.teacherName && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Professor: {activity.teacherName}</span>
                      </div>
                    )}
                    
                    <div className="mt-3 space-y-2">
                      {!isActivityLate(activity) && (
                        <>
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => handleSubmitActivity(activity)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Entregar Atividade
                          </Button>
                          <Button 
                            className="w-full" 
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewActivity(activity)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </>
                      )}
                      
                      {isActivityLate(activity) && canSubmitLate(activity) && (
                        <>
                          <Button 
                            className="w-full" 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSubmitActivity(activity)}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Entregar com Atraso
                          </Button>
                          <Button 
                            className="w-full" 
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewActivity(activity)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </>
                      )}
                      
                      {isActivityLate(activity) && !canSubmitLate(activity) && (
                        <>
                          <Button 
                            className="w-full" 
                            size="sm"
                            variant="outline"
                            disabled
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Prazo Expirado
                          </Button>
                          <Button 
                            className="w-full" 
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewActivity(activity)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade pendente</h3>
              <p className="text-gray-600">
                Você não possui atividades pendentes no momento.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Aba Enviadas */}
        <TabsContent value="submitted" className="mt-6">
          {getSubmittedActivities().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterActivitiesByTab(getSubmittedActivities()).map((activity) => (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="h-5 w-5 text-blue-600" />
                        <Badge variant="secondary" className="text-xs">
                          {activity.subjectName}
                        </Badge>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(activity.status)}
                          <span>{getStatusText(activity.status)}</span>
                        </div>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {activity.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Entrega: {formatDate(activity.dueDate)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>Nota máxima: {activity.maxGrade}</span>
                    </div>
                    
                    {activity.teacherName && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Professor: {activity.teacherName}</span>
                      </div>
                    )}
                    
                    {activity.submittedAt && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-blue-800">Entregue em:</p>
                        <p className="text-sm text-blue-700">{formatDate(activity.submittedAt)}</p>
                        {activity.isLate && activity.submittedAt && new Date(activity.submittedAt) > new Date(activity.dueDate) && (
                          <p className="text-sm text-red-600 mt-1">⚠️ Entregue com atraso</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3 space-y-2">
                      <Button 
                        className="w-full" 
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewActivity(activity)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade enviada</h3>
              <p className="text-gray-600">
                Você não possui atividades enviadas aguardando avaliação.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Aba Avaliadas */}
        <TabsContent value="graded" className="mt-6">
          {getGradedActivities().length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterActivitiesByTab(getGradedActivities()).map((activity) => (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="h-5 w-5 text-green-600" />
                        <Badge variant="secondary" className="text-xs">
                          {activity.subjectName}
                        </Badge>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(activity.status)}
                          <span>{getStatusText(activity.status)}</span>
                        </div>
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{activity.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {activity.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Entrega: {formatDate(activity.dueDate)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>Nota máxima: {activity.maxGrade}</span>
                    </div>
                    
                    {activity.teacherName && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>Professor: {activity.teacherName}</span>
                      </div>
                    )}
                    
                    {activity.submittedAt && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-blue-800">Entregue em:</p>
                        <p className="text-sm text-blue-700">{formatDate(activity.submittedAt)}</p>
                        {activity.isLate && (
                          <p className="text-sm text-red-600 mt-1">⚠️ Entregue com atraso</p>
                        )}
                      </div>
                    )}
                    
                    {activity.grade !== undefined && (
                      <div className="mt-3 p-2 bg-green-50 rounded-md">
                        <p className="text-sm font-medium text-green-800">Nota: {activity.finalGrade || activity.grade}/{activity.maxGrade}</p>
                        {activity.feedback && (
                          <p className="text-sm text-green-700 mt-1">{activity.feedback}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-3 space-y-2">
                      <Button 
                        className="w-full" 
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewActivity(activity)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade avaliada</h3>
              <p className="text-gray-600">
                Você não possui atividades avaliadas no momento.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mensagem quando não há atividades */}
      {finalActivities.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
          <p className="text-gray-600">
            Você não possui atividades no momento.
          </p>
        </div>
      )}
      
      {/* Modal de Submissão */}
      <SubmitActivityModal
        activity={selectedActivity}
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={handleSubmissionSuccess}
      />
      
      {/* Modal de Detalhes */}
      <ActivityDetailsModal
        activity={selectedActivity}
        submission={selectedActivity ? submissions[selectedActivity.id] : undefined}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        canSubmit={false}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}