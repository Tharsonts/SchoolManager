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
  Users,
  Eye,
  Plus,
  FileText,
  Calendar,
  Star,
  Send,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherActivities } from '@/hooks/useApi';
import { MainLayout } from '@/components/layout/MainLayout';
import { TeacherSubmissionInterface } from '@/components/activities/TeacherSubmissionInterface';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classId: string;
  className: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  requirements?: string;
  status: 'draft' | 'active' | 'expired' | 'archived';
  allowLateSubmission: boolean;
  latePenalty: number;
  maxFileSize?: number;
  allowedFileTypes?: string;
  createdAt: string;
  updatedAt: string;
  submissionCount: number;
  gradedCount: number;
  pendingCount: number;
}

export default function TeacherActivitiesFlow() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showSubmissionInterface, setShowSubmissionInterface] = useState(false);

  // Buscar atividades do professor
  const { data: activitiesData, isLoading, error } = useTeacherActivities(user?.id || '');
  const activities = activitiesData?.data || [];

  // Estatísticas gerais
  const stats = {
    total: activities.length,
    active: activities.filter(a => a.status === 'active' && new Date(a.dueDate) >= new Date()).length,
    expired: activities.filter(a => a.status === 'active' && new Date(a.dueDate) < new Date()).length,
    totalSubmissions: activities.reduce((sum, a) => sum + a.submissionCount, 0),
    totalPending: activities.reduce((sum, a) => sum + a.pendingCount, 0),
    totalGraded: activities.reduce((sum, a) => sum + a.gradedCount, 0)
  };

  // Filtros de atividades
  const activeActivities = activities.filter(a => 
    a.status === 'active' && new Date(a.dueDate) >= new Date()
  );
  
  const expiredActivities = activities.filter(a => 
    a.status === 'active' && new Date(a.dueDate) < new Date()
  );
  
  const withSubmissions = activities.filter(a => a.submissionCount > 0);
  const needingGrading = activities.filter(a => a.pendingCount > 0);

  const getStatusBadge = (activity: Activity) => {
    const isExpired = new Date(activity.dueDate) < new Date();
    
    if (activity.status === 'draft') {
      return <Badge variant="outline" className="text-gray-600 border-gray-600">Rascunho</Badge>;
    }
    
    if (isExpired) {
      return <Badge variant="outline" className="text-red-600 border-red-600">Expirada</Badge>;
    }
    
    return <Badge variant="outline" className="text-green-600 border-green-600">Ativa</Badge>;
  };

  const getSubmissionStatus = (activity: Activity) => {
    if (activity.submissionCount === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm">Aguardando submissões</span>
        </div>
      );
    }

    if (activity.pendingCount > 0) {
      return (
        <div className="flex items-center text-orange-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">
            {activity.pendingCount} submiss{activity.pendingCount === 1 ? 'ão' : 'ões'} para avaliar
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" />
        <span className="text-sm">Todas avaliadas</span>
      </div>
    );
  };

  const handleViewSubmissions = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowSubmissionInterface(true);
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
                <Users className="w-4 h-4 mr-1" />
                {activity.className}
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
          {/* Estatísticas de Submissão */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activity.submissionCount}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{activity.pendingCount}</div>
              <div className="text-xs text-orange-600">Pendentes</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{activity.gradedCount}</div>
              <div className="text-xs text-green-600">Avaliadas</div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t">
            {getSubmissionStatus(activity)}
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/teacher/activities/${activity.id}/edit`)}
              >
                <FileText className="w-4 h-4 mr-1" />
                Editar
              </Button>
              
              {activity.submissionCount > 0 ? (
                <Button
                  size="sm"
                  onClick={() => navigate(`/teacher/activities/${activity.id}/detail`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Submissões
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/teacher/activities/${activity.id}/detail`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Detalhes
                </Button>
              )}
            </div>
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
            <p className="text-slate-600">Carregando atividades...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (showSubmissionInterface && selectedActivity) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowSubmissionInterface(false)}
            >
              ← Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedActivity.title}</h1>
              <p className="text-gray-600">Gerenciar submissões e avaliações</p>
            </div>
          </div>
          
          <TeacherSubmissionInterface activity={selectedActivity} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fluxo de Atividades</h1>
            <p className="text-gray-600">Gerencie o ciclo completo: criação → entrega → avaliação</p>
          </div>
          <Button
            onClick={() => navigate('/teacher/activities/create')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total de Atividades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Ativas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-sm text-gray-600">Expiradas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalSubmissions}</div>
              <div className="text-sm text-gray-600">Submissões</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalPending}</div>
              <div className="text-sm text-gray-600">Para Avaliar</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.totalGraded}</div>
              <div className="text-sm text-gray-600">Avaliadas</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="active">Ativas ({stats.active})</TabsTrigger>
            <TabsTrigger value="pending">
              Precisam Avaliação ({stats.totalPending})
            </TabsTrigger>
            <TabsTrigger value="with-submissions">
              Com Submissões ({withSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="expired">Expiradas ({stats.expired})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Fluxo Visual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Fluxo do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium">Professor Cria</p>
                      </div>
                      
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                          <Send className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium">Aluno Recebe</p>
                      </div>
                      
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium">Aluno Entrega</p>
                      </div>
                      
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium">Professor Avalia</p>
                      </div>
                      
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                      
                      <div className="text-center">
                        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center mb-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-sm font-medium">Aluno Vê Resultado</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              {needingGrading.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-orange-800">
                      🔔 Atividades Precisando de Avaliação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {needingGrading.slice(0, 3).map(activity => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-600">
                              {activity.pendingCount} submissão(ões) pendente(s)
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/teacher/activities/${activity.id}/detail`)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Avaliar Agora
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Atividades Recentes */}
              <div className="grid gap-4">
                <h2 className="text-xl font-semibold">Atividades Recentes</h2>
                {activities.slice(0, 3).map(renderActivityCard)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades Ativas</h2>
              {activeActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma atividade ativa no momento</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeActivities.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades com Submissões Pendentes</h2>
              {needingGrading.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Todas as submissões foram avaliadas! 🎉</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {needingGrading.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="with-submissions">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades com Submissões</h2>
              {withSubmissions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aguardando primeiras submissões</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {withSubmissions.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="expired">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Atividades Expiradas</h2>
              {expiredActivities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma atividade expirada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {expiredActivities.map(renderActivityCard)}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
