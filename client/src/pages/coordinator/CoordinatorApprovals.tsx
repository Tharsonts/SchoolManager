import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  Users,
  BookOpen
} from 'lucide-react';

export default function CoordinatorApprovals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('todas');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [comments, setComments] = useState('');
  const queryClient = useQueryClient();

  // Buscar atividades pendentes reais da API
  const { data: pendingActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['coordinator-pending-activities'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/activities');
      if (!response.ok) throw new Error('Erro ao buscar atividades');
      const activities = await response.json();
      // Filtrar apenas atividades pendentes
      return activities.filter((activity: any) => 
        !activity.status || 
        activity.status.toLowerCase() === 'pendente' || 
        activity.status.toLowerCase() === 'pending'
      );
    }
  });

  // Mutation para aprovar/rejeitar atividade
  const approveMutation = useMutation({
    mutationFn: async ({ activityId, approved, comments }: { activityId: string, approved: boolean, comments: string }) => {
      const response = await fetch(`/api/coordinator/activities/${activityId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          comments
        })
      });
      
      if (!response.ok) throw new Error('Erro ao processar atividade');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-pending-activities'] });
      queryClient.invalidateQueries({ queryKey: ['coordinator-activities'] });
      setSelectedActivity(null);
      setComments('');
    }
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertTriangle className="w-3 h-3 mr-1" />Alta Prioridade</Badge>;
      case 'média':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Média Prioridade</Badge>;
      case 'baixa':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Baixa Prioridade</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1" />Média Prioridade</Badge>;
    }
  };

  const filteredActivities = pendingActivities.filter((activity: any) => {
    const matchesSearch = activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch; // Prioridade será implementada futuramente
  });

  const handleApprove = (activityId: string, approved: boolean) => {
    approveMutation.mutate({ activityId, approved, comments });
  };

  const openDetails = (activity: any) => {
    setSelectedActivity(activity);
    setComments('');
  };

  if (activitiesLoading) {
    return (
      <MainLayout pageTitle="Aprovações Pedagógicas">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando atividades pendentes...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Aprovações Pedagógicas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aprovações Pedagógicas</h1>
            <p className="text-gray-600 mt-2">
              Revise e acompanhe as atividades criadas pelos professores
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Atividades pendentes</p>
            <p className="text-3xl font-bold text-red-600">{pendingActivities.length}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingActivities.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">
                  {pendingActivities.filter((a: any) => {
                    const dueDate = new Date(a.dueDate || a.createdAt);
                    const today = new Date();
                    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 3;
                  }).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Materialias Diferentes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(pendingActivities.map((a: any) => a.subject?.name).filter(Boolean)).size}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Professores</p>
                <p className="text-2xl font-bold text-orange-600">
                  {new Set(pendingActivities.map((a: any) => a.teacher?.name).filter(Boolean)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar atividades, professores ou matérias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity: any) => (
              <Card key={activity.id} className="p-6 border-l-4 border-l-yellow-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{activity.title || 'Atividade sem título'}</h3>
                      {getPriorityBadge(activity.priority)}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{activity.description || 'Sem descrição'}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Professor:</span>
                        <span>{activity.teacher?.name || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Matéria:</span>
                        <span>{activity.subject?.name || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Turma:</span>
                        <span>{activity.class?.name || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Prazo:</span>
                        <span>{activity.dueDate ? new Date(activity.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Criada em:</span>
                          <p className="text-gray-600">{new Date(activity.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Status:</span>
                          <p className="text-gray-600">{activity.status || 'Pendente'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Tipo:</span>
                          <p className="text-gray-600">{activity.type || 'Atividade'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openDetails(activity)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Revisar
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(activity.id, true)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleApprove(activity.id, false)}
                      disabled={approveMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Todas as atividades foram revisadas!</h3>
              <p className="text-gray-600">
                Parabéns! Não há atividades pendentes no momento.
              </p>
            </Card>
          )}
        </div>

        {/* Activity Details Modal */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl-sans-serif-bold">{selectedActivity.title || 'Atividade sem título'}</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedActivity(null)}
                >
                  Fechar
                </Button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Professor:</label>
                    <p>{selectedActivity.teacher?.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Disciplina:</label>
                    <p>{selectedActivity.subject?.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Turma:</label>
                    <p>{selectedActivity.class?.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="font-medium">Prazo:</label>
                    <p>{selectedActivity.dueDate ? new Date(selectedActivity.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                  </div>
                </div>
                
                <div>
                  <label className="font-medium">Descrição:</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded border">{selectedActivity.description || 'Sem descrição'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <label className="font-medium block mb-2">Observações:</label>
                <Textarea
                  placeholder="Escreva suas observações sobre esta atividade..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
                
                <div className="flex gap-3 mt-4">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedActivity.id, true)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar Atividade
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleApprove(selectedActivity.id, false)}
                    disabled={approveMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Solicitar Alterações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}