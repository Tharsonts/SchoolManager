import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  FileText, 
  Calendar, 
  Users, 
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherActivities, useDeleteActivity } from '@/hooks/useApi';
import { MainLayout } from '@/components/layout/MainLayout';
import { toast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  className: string;
  dueDate: string;
  maxGrade: number;
  status: string;
  submissionCount: number;
  gradedCount: number;
  pendingCount: number;
}

export default function TeacherActivitiesFlowSimplified() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('todas');
  
  // Estados para o modal de confirmação
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{ id: string; title: string } | null>(null);

  // Buscar atividades do professor
  const { data: activitiesData, isLoading, error } = useTeacherActivities(user?.id || '');
  const activities = activitiesData?.data || [];
  
  // Hook para deletar atividade
  const deleteActivityMutation = useDeleteActivity();

  // Função para abrir modal de confirmação
  const handleDeleteActivity = (activityId: string, activityTitle: string) => {
    setActivityToDelete({ id: activityId, title: activityTitle });
    setShowDeleteModal(true);
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    
    try {
      await deleteActivityMutation.mutateAsync(activityToDelete.id);
      toast({
        title: "Atividade deletada",
        description: `A atividade "${activityToDelete.title}" foi deletada com sucesso.`,
      });
      setShowDeleteModal(false);
      setActivityToDelete(null);
    } catch (error) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a atividade. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para fechar modal
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setActivityToDelete(null);
  };

  // Classificar atividades 
  const allActivities = activities;
  const pendingActivities = activities.filter(a => a.pendingCount > 0);
  const completedActivities = activities.filter(a => 
    a.submissionCount > 0 && a.pendingCount === 0
  );

  // Estatísticas
  const stats = {
    total: activities.length,
    pending: pendingActivities.length,
    completed: completedActivities.length,
    totalSubmissions: activities.reduce((sum, a) => sum + a.submissionCount, 0),
    totalPending: activities.reduce((sum, a) => sum + a.pendingCount, 0)
  };

  const getStatusColor = (activity: Activity) => {
    if (activity.pendingCount > 0) return 'border-orange-200 bg-orange-50';
    if (activity.submissionCount > 0) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getStatusBadge = (activity: Activity) => {
    if (activity.pendingCount > 0) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">
        {activity.pendingCount} pendente{activity.pendingCount > 1 ? 's' : ''}
      </Badge>;
    }
    if (activity.submissionCount > 0) {
      return <Badge variant="outline" className="text-green-600 border-green-600">
        {activity.gradedCount}/{activity.submissionCount} avaliadas
      </Badge>;
    }
    return <Badge variant="outline" className="text-gray-600 border-gray-600">
      Sem submissões
    </Badge>;
  };

  const renderActivityCard = (activity: Activity) => (
    <Card key={activity.id} className={`transition-all hover:shadow-md ${getStatusColor(activity)}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-gray-900">{activity.title}</h3>
              {getStatusBadge(activity)}
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{activity.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{activity.subjectName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{activity.className}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Entrega: {format(new Date(activity.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {activity.pendingCount > 0 && (
              <Button
                size="sm"
                onClick={() => navigate(`/teacher/activities/${activity.id}/detail`)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Avaliar
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/teacher/activities/${activity.id}/detail`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver Detalhes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/edit-activity/${activity.id}`)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteActivity(activity.id, activity.title)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={deleteActivityMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Deletar
            </Button>
          </div>
        </div>

        {/* Estatísticas da atividade */}
        {activity.submissionCount > 0 && (
          <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">{activity.submissionCount} submissões</span>
            </div>
            {activity.gradedCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">{activity.gradedCount} avaliadas</span>
              </div>
            )}
            {activity.pendingCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{activity.pendingCount} pendentes</span>
              </div>
            )}
          </div>
        )}
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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Atividades</h1>
            <p className="text-gray-600 mt-1">Gerencie todas as suas atividades e avaliações</p>
          </div>
          
          <Button 
            onClick={() => navigate('/create-activity')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
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
              <div className="text-2xl font-bold text-green-600">{stats.totalSubmissions}</div>
              <div className="text-sm text-gray-600">Submissões</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="todas" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Todas ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pendentes" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Para Avaliar ({stats.totalPending})
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Concluídas ({stats.completed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-4">
            {allActivities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma atividade ainda
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Comece criando sua primeira atividade para os alunos.
                  </p>
                  <Button onClick={() => navigate('/create-activity')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Atividade
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allActivities.map(renderActivityCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pendentes" className="space-y-4">
            {pendingActivities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tudo em dia! 🎉
                  </h3>
                  <p className="text-gray-600">
                    Não há submissões pendentes de avaliação no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingActivities.map(renderActivityCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="concluidas" className="space-y-4">
            {completedActivities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma atividade concluída
                  </h3>
                  <p className="text-gray-600">
                    As atividades com todas as submissões avaliadas aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedActivities.map(renderActivityCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Deletar Atividade"
        description="Esta ação irá remover permanentemente a atividade e todos os dados relacionados."
        itemName={activityToDelete?.title || ''}
        isLoading={deleteActivityMutation.isPending}
      />
    </MainLayout>
  );
}
