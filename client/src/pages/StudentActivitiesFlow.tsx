import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Star,
  Send,
  Eye,
  FileText,
  MessageSquare,
  TrendingUp,
  Award,
  Timer,
  Target,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useStudentActivities } from '@/hooks/useApi';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentSubmissionForm } from '@/components/activities/StudentSubmissionForm';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  requirements?: string;
  status: 'draft' | 'active' | 'expired' | 'archived';
  allowLateSubmission: boolean;
  latePenalty: number;
  createdAt: string;
  updatedAt: string;
  // Dados da submissão
  submissionId?: string;
  submissionStatus?: 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
  submittedAt?: string;
  submissionComment?: string;
  grade?: number;
  feedback?: string;
  isLate?: boolean;
  finalGrade?: number;
}

interface ExistingSubmission {
  id: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
  isLate: boolean;
  latePenaltyApplied: number;
  finalGrade?: number;
  files?: Array<{
    id: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    fileType: string;
  }>;
}

export default function StudentActivitiesFlow() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  // Buscar atividades do aluno
  const { data: activitiesData, isLoading, error } = useStudentActivities(user?.id || '');
  const activities = activitiesData?.data || [];

  // Classificar atividades baseado no submissionStatus

  // Classificar atividades - corrigir lógica
  const pendingActivities = activities.filter(a => {
    // Só é pendente se NÃO tem submissionStatus OU submissionStatus é null/undefined
    const hasNoSubmission = !a.submissionStatus || a.submissionStatus === null || a.submissionStatus === undefined;
    const isActive = a.status === 'active';
    const notOverdue = new Date(a.dueDate) >= new Date();
    
    return hasNoSubmission && isActive && notOverdue;
  });
  
  const lateActivities = activities.filter(a => {
    const hasNoSubmission = !a.submissionStatus || a.submissionStatus === null || a.submissionStatus === undefined;
    const isActive = a.status === 'active';
    const isOverdue = new Date(a.dueDate) < new Date();
    const allowsLate = a.allowLateSubmission;
    
    return hasNoSubmission && isActive && isOverdue && allowsLate;
  });
  
  const submittedActivities = activities.filter(a => {
    const hasSubmissionStatus = a.submissionStatus && a.submissionStatus !== null;
    const isSubmittedStatus = ['submitted', 'late', 'resubmitted'].includes(a.submissionStatus || '');
    
    return hasSubmissionStatus && isSubmittedStatus;
  });
  
  const gradedActivities = activities.filter(a => {
    const isGraded = a.submissionStatus === 'graded';
    const hasGrade = a.grade !== undefined && a.grade !== null;
    
    return isGraded && hasGrade;
  });

  // Estatísticas
  const stats = {
    total: activities.length,
    pending: pendingActivities.length,
    late: lateActivities.length,
    submitted: submittedActivities.length,
    graded: gradedActivities.length,
    averageGrade: gradedActivities.length > 0 
      ? gradedActivities.reduce((sum, a) => sum + (a.finalGrade || a.grade || 0), 0) / gradedActivities.length
      : 0
  };

  const getStatusBadge = (activity: Activity) => {
    if (activity.submissionStatus === 'graded') {
      return <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Avaliada
      </Badge>;
    }
    
    if (activity.submissionStatus) {
      const isLate = activity.isLate;
      return <Badge variant="outline" className={isLate ? "text-orange-600 border-orange-600" : "text-blue-600 border-blue-600"}>
        <Send className="w-3 h-3 mr-1" />
        {isLate ? 'Entregue (Atraso)' : 'Entregue'}
      </Badge>;
    }
    
    const isOverdue = new Date(activity.dueDate) < new Date();
    if (isOverdue) {
      if (activity.allowLateSubmission) {
        return <Badge variant="outline" className="text-red-600 border-red-600">
          <Timer className="w-3 h-3 mr-1" />
          Atrasada
        </Badge>;
      }
      return <Badge variant="outline" className="text-gray-600 border-gray-600">
        <Clock className="w-3 h-3 mr-1" />
        Expirada
      </Badge>;
    }
    
    return <Badge variant="outline" className="text-orange-600 border-orange-600">
      <Clock className="w-3 h-3 mr-1" />
      Pendente
    </Badge>;
  };

  const getActivityActions = (activity: Activity) => {
    const isOverdue = new Date(activity.dueDate) < new Date();
    const canSubmit = !activity.submissionStatus && (
      !isOverdue || (isOverdue && activity.allowLateSubmission)
    );
    const hasSubmission = activity.submissionStatus;

    return (
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetails(activity)}
        >
          <Eye className="w-4 h-4 mr-1" />
          Ver Detalhes
        </Button>
        
        {canSubmit && (
          <Button
            size="sm"
            onClick={() => handleSubmitActivity(activity)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-1" />
            Entregar
          </Button>
        )}
        
        {activity.submissionStatus === 'returned' && (
          <Button
            size="sm"
            onClick={() => handleSubmitActivity(activity)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-1" />
            Reenviar
          </Button>
        )}
      </div>
    );
  };

  const handleSubmitActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowSubmissionForm(true);
  };

  const handleViewDetails = (activity: Activity) => {
    navigate(`/student/activities/${activity.id}/detail`);
  };

  const handleSubmissionUpdate = () => {
    setShowSubmissionForm(false);
    // Recarregar dados
    window.location.reload();
  };

  const convertToSubmissionFormat = (activity: Activity): ExistingSubmission | undefined => {
    if (!activity.submissionStatus) return undefined;
    
    return {
      id: activity.submissionId || '',
      content: activity.submissionComment || '',
      submittedAt: activity.submittedAt || '',
      grade: activity.grade,
      feedback: activity.feedback,
      status: activity.submissionStatus,
      isLate: activity.isLate || false,
      latePenaltyApplied: activity.latePenalty || 0,
      finalGrade: activity.finalGrade,
      files: []
    };
  };

  const renderActivityCard = (activity: Activity) => (
    <Card key={activity.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{activity.title}</CardTitle>
            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {activity.subjectName}
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {activity.teacherName}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(activity.dueDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            {getStatusBadge(activity)}
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-sm font-medium">{activity.maxGrade} pts</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Resultado da Avaliação */}
          {activity.submissionStatus === 'graded' && activity.grade !== undefined && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-900">Resultado da Avaliação</h4>
                <div className="text-2xl font-bold text-green-900">
                  {activity.finalGrade?.toFixed(1) || activity.grade.toFixed(1)}/{activity.maxGrade}
                </div>
              </div>
              
              {activity.isLate && activity.latePenalty > 0 && (
                <p className="text-sm text-red-600 mb-2">
                  Penalidade por atraso: -{activity.latePenalty} pontos
                </p>
              )}
              
              {activity.feedback && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-green-900 mb-1">Feedback do Professor:</p>
                  <p className="text-sm text-green-800">{activity.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Informações de Submissão */}
          {activity.submissionStatus && activity.submissionStatus !== 'graded' && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Send className="w-4 h-4 text-blue-600 mr-2" />
                <h4 className="font-medium text-blue-900">Atividade Entregue</h4>
              </div>
              <p className="text-sm text-blue-800">
                Entregue em: {activity.submittedAt && format(new Date(activity.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
              {activity.isLate && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Entregue com atraso
                </p>
              )}
            </div>
          )}

          {/* Aviso de Prazo */}
          {!activity.submissionStatus && (
            <div className={`p-4 rounded-lg border ${
              new Date(activity.dueDate) < new Date()
                ? 'bg-red-50 border-red-200'
                : new Date(activity.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center">
                <Clock className={`w-4 h-4 mr-2 ${
                  new Date(activity.dueDate) < new Date()
                    ? 'text-red-600'
                    : new Date(activity.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                }`} />
                <p className={`text-sm font-medium ${
                  new Date(activity.dueDate) < new Date()
                    ? 'text-red-800'
                    : new Date(activity.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                }`}>
                  {new Date(activity.dueDate) < new Date()
                    ? activity.allowLateSubmission
                      ? 'Prazo expirado - Submissão com penalidade permitida'
                      : 'Prazo expirado - Submissão não permitida'
                    : new Date(activity.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                      ? 'Prazo se aproximando - Entregue logo!'
                      : 'Dentro do prazo'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end pt-2 border-t">
            {getActivityActions(activity)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando suas atividades...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (showSubmissionForm && selectedActivity) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowSubmissionForm(false)}
            >
              ← Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedActivity.title}</h1>
              <p className="text-gray-600">Entregar sua atividade</p>
            </div>
          </div>
          
          <StudentSubmissionForm
            activity={selectedActivity}
            existingSubmission={convertToSubmissionFormat(selectedActivity)}
            onSubmissionUpdate={handleSubmissionUpdate}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Atividades</h1>
          <p className="text-gray-600">Acompanhe suas atividades, entregas e resultados</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              <div className="text-sm text-gray-600">Entregues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
              <div className="text-sm text-gray-600">Avaliadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageGrade.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Média</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pendentes ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="submitted">
              Entregues ({stats.submitted})
            </TabsTrigger>
            <TabsTrigger value="graded">
              Avaliadas ({stats.graded})
            </TabsTrigger>
            <TabsTrigger value="late">
              Atrasadas ({stats.late})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades Pendentes</h2>
              {pendingActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Parabéns! Não há atividades pendentes.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingActivities.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="submitted">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades Entregues</h2>
              {submittedActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma atividade entregue ainda.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {submittedActivities.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="graded">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades Avaliadas</h2>
              {gradedActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aguardando primeiras avaliações.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {gradedActivities.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="late">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades Atrasadas</h2>
              {lateActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Ótimo! Você está em dia com suas atividades.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {lateActivities.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
