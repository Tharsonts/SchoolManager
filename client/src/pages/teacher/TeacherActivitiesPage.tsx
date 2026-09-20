import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  TrendingUp,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherActivities } from '@/hooks/useApi';
import { toast } from 'sonner';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  dueDate: string;
  maxGrade: number;
  status: 'draft' | 'active' | 'expired' | 'archived';
  submissionCount: number;
  gradedCount: number;
  pendingCount: number;
  createdAt: string;
}

const TeacherActivitiesPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [filterClass, setFilterClass] = useState('all');

  // Buscar atividades do professor
  const { data: activitiesData, isLoading, error, refetch } = useTeacherActivities(user?.id || '');
  const activities = activitiesData?.data || [];

  // Refresh automático quando a página recebe foco
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetch]);

  // Refresh automático a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Usar apenas dados reais
  const allActivities = activities;

  // Estatísticas
  const stats = {
    total: allActivities.length,
    active: allActivities.filter(a => a.status === 'active').length,
    pending: allActivities.reduce((sum, a) => sum + a.pendingCount, 0),
    completed: allActivities.filter(a => a.gradedCount === a.submissionCount && a.submissionCount > 0).length
  };

  // Filtros
  const filteredActivities = allActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || activity.subjectName === filterSubject;
    const matchesClass = filterClass === 'all' || activity.className === filterClass;
    
    return matchesSearch && matchesSubject && matchesClass;
  });

  // Atividades por categoria
  const activeActivities = filteredActivities.filter(a => a.status === 'active');
  const expiredActivities = filteredActivities.filter(a => a.status === 'expired');
  const draftActivities = filteredActivities.filter(a => a.status === 'draft');
  const needingGrading = filteredActivities.filter(a => a.pendingCount > 0);

  const getStatusBadge = (activity: Activity) => {
    switch (activity.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativa</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expirada</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rascunho</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getSubjectColor = (subjectName: string) => {
    const colors: Record<string, string> = {
      'Matemática': 'bg-blue-500',
      'Português': 'bg-green-500',
      'Ciências': 'bg-purple-500',
      'História': 'bg-orange-500',
      'Geografia': 'bg-teal-500',
      'Inglês': 'bg-red-500'
    };
    return colors[subjectName] || 'bg-gray-500';
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete || confirmText.toLowerCase() !== 'confirmar') return;

    try {
      const response = await fetch(`/api/activities/${activityToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: '123456' }), // Senha fixa no backend
      });

      if (response.ok) {
        toast.success('Atividade deletada com sucesso!');
        setShowDeleteModal(false);
        setActivityToDelete(null);
        setConfirmText('');
        refetch(); // Recarregar a lista de atividades
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Erro ao deletar atividade');
      }
    } catch (error) {
      toast.error('Erro ao deletar atividade');
      console.error('Erro:', error);
    }
  };

  const openDeleteModal = (activity: Activity) => {
    setActivityToDelete(activity);
    setShowDeleteModal(true);
  };

  const renderActivityCard = (activity: Activity) => (
    <Card key={activity.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getSubjectColor(activity.subjectName)}`}></div>
              <span className="text-sm font-medium text-gray-600">{activity.subjectName}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{activity.className}</span>
            </div>
            <CardTitle className="text-lg mb-1">{activity.title}</CardTitle>
            <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
          </div>
          {getStatusBadge(activity)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Estatísticas da atividade */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span>{activity.submissionCount} entregas</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{activity.gradedCount} avaliadas</span>
            </div>
            {activity.pendingCount > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>{activity.pendingCount} pendentes</span>
              </div>
            )}
          </div>

          {/* Data de entrega */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Entrega: {format(new Date(activity.dueDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 pt-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/teacher/activities/${activity.id}/detail`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Visualizar
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/teacher/activities/${activity.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>

            <Button 
              size="sm" 
              variant="outline"
              onClick={() => openDeleteModal(activity)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Deletar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Atividades</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas atividades, avaliações e entregas dos alunos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/teacher/activities/create')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm">
            <Plus className="w-4 h-4 mr-1" />
            Nova Atividade
          </Button>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="px-3 py-2 text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Atividades</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pendentes Avaliação</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-48 h-12">
                <SelectValue placeholder="Filtrar por disciplina" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                <SelectItem value="Matemática">Matemática</SelectItem>
                <SelectItem value="Português">Português</SelectItem>
                <SelectItem value="Ciências">Ciências</SelectItem>
                <SelectItem value="História">História</SelectItem>
                <SelectItem value="Geografia">Geografia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-48 h-12">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                <SelectItem value="9º Ano A">9º Ano A</SelectItem>
                <SelectItem value="9º Ano B">9º Ano B</SelectItem>
                <SelectItem value="8º Ano A">8º Ano A</SelectItem>
                <SelectItem value="8º Ano B">8º Ano B</SelectItem>
                <SelectItem value="7º Ano A">7º Ano A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de atividades */}
      <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="todas" 
                  className="py-4 px-6 text-base font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Todas ({filteredActivities.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="ativas" 
                  className="py-4 px-6 text-base font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Ativas ({activeActivities.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="avaliar" 
                  className="py-4 px-6 text-base font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Avaliar ({needingGrading.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="rascunhos" 
                  className="py-4 px-6 text-base font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Rascunhos ({draftActivities.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="expiradas" 
                  className="py-4 px-6 text-base font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  Expiradas ({expiredActivities.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando atividades...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Erro ao carregar atividades
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error?.message || 'Ocorreu um erro inesperado'}
                  </p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              ) : (
                <>
                  <TabsContent value="todas" className="mt-0">
                    {filteredActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma atividade encontrada
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Comece criando sua primeira atividade para os alunos.
                        </p>
                        <Button 
                          onClick={() => navigate('/teacher/activities/create')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeira Atividade
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {filteredActivities.map(renderActivityCard)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ativas" className="mt-0">
                    {activeActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma atividade ativa
                        </h3>
                        <p className="text-gray-600">
                          Não há atividades ativas no momento.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {activeActivities.map(renderActivityCard)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="avaliar" className="mt-0">
                    {needingGrading.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma atividade para avaliar
                        </h3>
                        <p className="text-gray-600">
                          Todas as atividades estão avaliadas.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {needingGrading.map(renderActivityCard)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="rascunhos" className="mt-0">
                    {draftActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhum rascunho
                        </h3>
                        <p className="text-gray-600">
                          Não há atividades em rascunho.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {draftActivities.map(renderActivityCard)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="expiradas" className="mt-0">
                    {expiredActivities.length === 0 ? (
                      <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma atividade expirada
                        </h3>
                        <p className="text-gray-600">
                          Não há atividades expiradas.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {expiredActivities.map(renderActivityCard)}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
        </div>
      </div>
      

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a atividade "{activityToDelete?.title}"? 
              Esta ação não pode ser desfeita e todos os arquivos e submissões serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirm">Digite "confirmar" para prosseguir:</Label>
              <Input
                id="confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite 'confirmar'"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setActivityToDelete(null);
                setConfirmText('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteActivity}
              disabled={confirmText.toLowerCase() !== 'confirmar'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Atividade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherActivitiesPage;