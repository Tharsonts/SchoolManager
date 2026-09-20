import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  BookOpen,
  Eye,
  Upload,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useRealtimeActivities } from '@/hooks/useRealtimeActivities';
import { SubmitActivityModal } from '@/components/SubmitActivityModal';
import { ActivityDetailsModal } from '@/components/ActivityDetailsModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectName?: string;
  subjectCode?: string;
  className?: string;
  dueDate: string;
  maxGrade: number;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  isLate?: boolean;
  allowLateSubmission?: boolean;
  instructions?: string;
  requirements?: string;
  submissionStatus?: string;
  submissionGrade?: number;
  submissionFeedback?: string;
  submissionDate?: string;
  files?: Array<{
    id: string;
    originalFileName: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    filePath: string;
  }>;
}

export default function StudentActivitiesPage() {
  const { activities, stats, isConnected, refetch } = useRealtimeActivities();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'submitted': return FileText;
      case 'graded': return CheckCircle;
      case 'late': return AlertCircle;
      default: return Clock;
    }
  };

  const handleViewDetails = async (activity: Activity) => {
    try {
      // Buscar detalhes completos da atividade incluindo arquivos
      const response = await fetch(`/api/activities/${activity.id}`);
      if (response.ok) {
        const activityDetails = await response.json();
        setSelectedActivity(activityDetails);
        setIsDetailsModalOpen(true);
      } else {
        // Se falhar, usar a atividade da lista
        setSelectedActivity(activity);
        setIsDetailsModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da atividade:', error);
      // Se falhar, usar a atividade da lista
      setSelectedActivity(activity);
      setIsDetailsModalOpen(true);
    }
  };

  const handleSubmitActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsSubmitModalOpen(true);
  };

  const handleSubmissionSuccess = () => {
    setIsSubmitModalOpen(false);
    refetch(); // Refresh activities after submission
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'submitted': return 'Enviada';
      case 'graded': return 'Avaliada';
      case 'late': return 'Atrasada';
      default: return 'Desconhecido';
    }
  };

  const renderActivityCard = (activity: Activity) => {
    const StatusIcon = getStatusIcon(activity.status);
    
    return (
      <Card key={activity.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">{activity.subjectName}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">{activity.className}</span>
              </div>
              <CardTitle className="text-lg mb-1">{activity.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
            </div>
            <Badge className={getStatusColor(activity.status)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {getStatusText(activity.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Informações da atividade */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Entrega: {format(new Date(activity.dueDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <FileText className="w-4 h-4" />
                <span>Nota máxima: {activity.maxGrade}</span>
              </div>
            </div>

            {/* Nota e feedback se avaliada */}
            {activity.status === 'graded' && activity.grade !== undefined && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Nota:</span>
                  <span className="text-lg font-bold text-green-900">{activity.grade}/{activity.maxGrade}</span>
                </div>
                {activity.feedback && (
                  <p className="text-sm text-green-700 mt-1">{activity.feedback}</p>
                )}
              </div>
            )}

            {/* Data de envio se enviada */}
            {activity.status === 'submitted' && activity.submittedAt && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Enviada em: {format(new Date(activity.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleViewDetails(activity)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Detalhes
              </Button>
              
              {activity.status === 'pending' || activity.status === 'late' ? (
                <Button 
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleSubmitActivity(activity)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Entregar
                </Button>
              ) : activity.status === 'submitted' ? (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Enviada
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Avaliada ({activity.grade}/{activity.maxGrade})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status de conexão */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Atividades</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-sm font-medium">Tempo Real</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.submitted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avaliadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.graded}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="enviadas">Enviadas ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="avaliadas">Avaliadas ({stats.graded})</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-6">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-gray-600">
                Sua turma ainda não possui atividades disponíveis.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {activities.map(renderActivityCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="mt-6">
          {activities.filter(a => a.status === 'pending' || a.status === 'late').length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade pendente
              </h3>
              <p className="text-gray-600">
                Todas as suas atividades estão em dia!
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {activities.filter(a => a.status === 'pending' || a.status === 'late').map(renderActivityCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enviadas" className="mt-6">
          {activities.filter(a => a.status === 'submitted').length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade enviada
              </h3>
              <p className="text-gray-600">
                Você ainda não enviou nenhuma atividade.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {activities.filter(a => a.status === 'submitted').map(renderActivityCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="avaliadas" className="mt-6">
          {activities.filter(a => a.status === 'graded').length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade avaliada
              </h3>
              <p className="text-gray-600">
                Ainda não há atividades avaliadas pelo professor.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {activities.filter(a => a.status === 'graded').map(renderActivityCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <SubmitActivityModal
        activity={selectedActivity}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={handleSubmissionSuccess}
      />

      <ActivityDetailsModal
        activity={selectedActivity}
        submission={selectedActivity ? {
          id: '',
          content: '',
          attachments: [],
          submittedAt: selectedActivity.submittedAt || '',
          grade: selectedActivity.grade,
          feedback: selectedActivity.feedback,
          status: selectedActivity.submissionStatus || 'pending'
        } : null}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        canSubmit={selectedActivity?.status === 'pending' || selectedActivity?.status === 'late'}
        onSubmissionSuccess={handleSubmissionSuccess}
      />
    </div>
  );
}