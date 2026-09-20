import { useState, useEffect } from "react";
import { MainLayout } from "../components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  FileText,
  Download,
  Eye,
  Plus,
  Edit,
  Trash2,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudentActivities, useTeacherActivities, useSubjects } from "@/hooks/useApi";
import { useLocation } from "wouter";
import { ActivityDetailsModal } from "@/components/ActivityDetailsModal";

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  teacherId: string;
  classId: string;
  className?: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  requirements?: string;
  status: 'draft' | 'active' | 'expired' | 'archived';
  allowLateSubmission: boolean;
  latePenalty: number;
  createdAt: string;
  updatedAt: string;
  // Dados da submissão do aluno
  submissionStatus?: 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  isLate?: boolean;
  finalGrade?: number;
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Buscar atividades reais do aluno
  const { data: activitiesData, isLoading, error } = useStudentActivities(user?.id || '');
  
  // Usar dados reais ou array vazio se não houver dados
  const activities = activitiesData?.data || [];
  
  // Se for professor, buscar atividades criadas por ele
  const { data: teacherActivitiesData } = useTeacherActivities(user?.id || '');
  const teacherActivities = teacherActivitiesData?.data || [];
  
  // Buscar disciplinas para obter cores
  const { data: subjectsData } = useSubjects();
  const subjects = subjectsData?.data || [];
  
  // Função para obter cor da disciplina
  const getSubjectColor = (subjectName: string) => {
    const colorMap: Record<string, string> = {
      'Matemática': 'bg-blue-500 border-blue-200',
      'Português': 'bg-green-500 border-green-200',
      'História': 'bg-purple-500 border-purple-200',
      'Geografia': 'bg-orange-500 border-orange-200',
      'Ciências': 'bg-teal-500 border-teal-200',
      'Inglês': 'bg-red-500 border-red-200',
      'Filosofia': 'bg-indigo-500 border-indigo-200',
      'Sociologia': 'bg-pink-500 border-pink-200',
      'Arte': 'bg-yellow-500 border-yellow-200',
      'Educação Física': 'bg-cyan-500 border-cyan-200'
    };
    return colorMap[subjectName] || 'bg-gray-500 border-gray-200';
  };

  // Função para obter cor do texto da disciplina
  const getSubjectTextColor = (subjectName: string) => {
    const colorMap: Record<string, string> = {
      'Matemática': 'text-blue-800',
      'Português': 'text-green-800',
      'História': 'text-purple-800',
      'Geografia': 'text-orange-800',
      'Ciências': 'text-teal-800',
      'Inglês': 'text-red-800',
      'Filosofia': 'text-indigo-800',
      'Sociologia': 'text-pink-800',
      'Arte': 'text-yellow-800',
      'Educação Física': 'text-cyan-800'
    };
    return colorMap[subjectName] || 'text-gray-800';
  };

  // Função para abrir detalhes da atividade
  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  // Função para abrir modal de edição
  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowEditModal(true);
  };

  // Função para fechar modal e atualizar dados
  const handleModalClose = () => {
    setSelectedActivity(null);
    setShowDetailsModal(false);
    setShowEditModal(false);
    setShowSubmitModal(false);
  };

  // Função chamada após submissão bem-sucedida
  const handleSubmissionSuccess = () => {
    // Recarregar dados das atividades
    window.location.reload();
  };

  // Função para deletar atividade
  const handleDeleteActivity = async (activityId: string) => {
    try {
      // Aqui você implementaria a chamada para a API de deletar
      console.log('Deletando atividade:', activityId);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
    }
  };
  
  // Decidir quais atividades mostrar baseado no role
  const displayActivities = user?.role === 'teacher' ? teacherActivities : activities;

  const getPriorityColor = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-red-500 text-white'; // Atrasado
    if (diffDays <= 3) return 'bg-yellow-500 text-white'; // Urgente
    if (diffDays <= 7) return 'bg-orange-500 text-white'; // Atenção
    return 'bg-green-500 text-white'; // Normal
  };

  const getPriorityText = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Atrasado';
    if (diffDays <= 3) return 'Urgente';
    if (diffDays <= 7) return 'Atenção';
    return 'Baixa';
  };

  const getStatusColor = (submissionStatus?: string) => {
    switch (submissionStatus) {
      case 'submitted': return 'bg-blue-500 text-white';
      case 'graded': return 'bg-green-500 text-white';
      case 'returned': return 'bg-red-500 text-white';
      case 'resubmitted': return 'bg-purple-500 text-white';
      default: return 'bg-orange-500 text-white'; // pending
    }
  };

  const getStatusIcon = (submissionStatus?: string) => {
    switch (submissionStatus) {
      case 'submitted': return <FileText className="h-4 w-4" />;
      case 'graded': return <CheckCircle className="h-4 w-4" />;
      case 'returned': return <AlertCircle className="h-4 w-4" />;
      case 'resubmitted': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />; // pending
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrasado`;
    if (diffDays === 0) return "Vence hoje";
    if (diffDays === 1) return "Vence amanhã";
    return `${diffDays} dias restantes`;
  };

  const pendingActivities = displayActivities.filter(a => 
    !a.submissionStatus || a.submissionStatus === undefined
  );
  const submittedActivities = displayActivities.filter(a => 
    a.submissionStatus === 'submitted' || a.submissionStatus === 'late'
  );
  const gradedActivities = displayActivities.filter(a => 
    a.submissionStatus === 'graded' || a.submissionStatus === 'returned'
  );

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };




  return (
    <MainLayout pageTitle="Atividades">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-amber-900">
              {user?.role === 'teacher' ? 'Minhas Atividades Criadas' : 'Minhas Atividades'}
            </h1>
            <p className="text-amber-700 mt-1">
              {user?.role === 'teacher' 
                ? 'Gerencie as atividades que você criou' 
                : 'Acompanhe suas tarefas e progresso'
              }
            </p>
          </div>
          {user?.role === 'teacher' && (
            <Button 
              className="btn-primary"
              onClick={() => navigate('/create-activity')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          )}
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingActivities.length}</p>
                </div>
                <Clock className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Enviadas</p>
                  <p className="text-2xl font-bold">{submittedActivities.length}</p>
                </div>
                <FileText className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Avaliadas</p>
                  <p className="text-2xl font-bold">{gradedActivities.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Média Geral</p>
                  <p className="text-2xl font-bold">
                    {gradedActivities.length > 0 
                      ? (gradedActivities.reduce((sum, a) => sum + (a.grade || 0), 0) / gradedActivities.length).toFixed(1)
                      : 'N/A'
                    }
                  </p>
                </div>
                <BookOpen className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Atividades */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-amber-100">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              Pendentes ({pendingActivities.length})
            </TabsTrigger>
            <TabsTrigger 
              value="submitted" 
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              Enviadas ({submittedActivities.length})
            </TabsTrigger>
            <TabsTrigger 
              value="graded" 
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              Avaliadas ({gradedActivities.length})
            </TabsTrigger>
          </TabsList>

          {/* Atividades Pendentes */}
          <TabsContent value="pending" className="space-y-4">
            {pendingActivities.length === 0 ? (
              <Card className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-900 mb-2">Nenhuma atividade pendente!</h3>
                <p className="text-amber-700">Parabéns! Você está em dia com todas as suas tarefas.</p>
              </Card>
            ) : (
              pendingActivities.map((activity) => {
                const subjectName = activity.subjectName || 'Disciplina';
                return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow border-l-4" style={{
                  borderLeftColor: getSubjectColor(subjectName).split(' ')[0].replace('bg-', '').replace('-500', '')
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg text-amber-900">{activity.title}</CardTitle>
                          <Badge className={getPriorityColor(activity.dueDate)}>
                            {getPriorityText(activity.dueDate)}
                          </Badge>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getSubjectColor(subjectName).split(' ')[0]}`}>
                            {subjectName}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-amber-700">
                          <span className="font-medium">Atividade</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(activity.dueDate)}
                          </span>
                          {activity.className && (
                            <>
                              <span>•</span>
                              <span>Turma: {activity.className}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user?.role === 'teacher' && (
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditActivity(activity)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteActivity(activity.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="text-right">
                        <p className="text-sm font-medium text-amber-600">
                          Nota Máxima: {activity.maxGrade}
                        </p>
                      </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-800 mb-4">{activity.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(activity)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})
            )}
          </TabsContent>

          {/* Atividades Enviadas */}
          <TabsContent value="submitted" className="space-y-4">
            {submittedActivities.length === 0 ? (
              <Card className="text-center py-12">
                <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-900 mb-2">Nenhuma atividade enviada</h3>
                <p className="text-amber-700">Suas atividades enviadas aparecerão aqui.</p>
              </Card>
            ) : (
              submittedActivities.map((activity) => {
                const subjectName = activity.subjectName || 'Disciplina';
                return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow border-l-4" style={{
                  borderLeftColor: getSubjectColor(subjectName).split(' ')[0].replace('bg-', '').replace('-500', '')
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg text-amber-900">{activity.title}</CardTitle>
                          <Badge className={activity.submissionStatus === 'late' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}>
                            {activity.submissionStatus === 'late' ? 'Enviada com Atraso' : 'Enviada'}
                          </Badge>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getSubjectColor(subjectName).split(' ')[0]}`}>
                            {subjectName}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-amber-700">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Enviada em {activity.submittedAt ? formatDate(activity.submittedAt) : 'Data não disponível'}
                          </span>
                          <span>•</span>
                          <span>Prazo: {formatDate(activity.dueDate)}</span>
                          {activity.className && (
                            <>
                              <span>•</span>
                              <span>Turma: {activity.className}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {user?.role === 'teacher' && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditActivity(activity)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-800 mb-4">{activity.description}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewActivity(activity)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Arquivo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})
            )}
          </TabsContent>

          {/* Atividades Avaliadas */}
          <TabsContent value="graded" className="space-y-4">
            {gradedActivities.length === 0 ? (
              <Card className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-amber-900 mb-2">Nenhuma atividade avaliada</h3>
                <p className="text-amber-700">Suas atividades avaliadas aparecerão aqui.</p>
              </Card>
            ) : (
              gradedActivities.map((activity) => {
                const subjectName = activity.subjectName || 'Disciplina';
                return (
                <Card key={activity.id} className="hover:shadow-lg transition-shadow border-l-4" style={{
                  borderLeftColor: getSubjectColor(subjectName).split(' ')[0].replace('bg-', '').replace('-500', '')
                }}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg text-amber-900">{activity.title}</CardTitle>
                          <Badge className={activity.submissionStatus === 'returned' ? 'bg-purple-500 text-white' : 'bg-green-500 text-white'}>
                            {activity.submissionStatus === 'returned' ? 'Devolvida' : 'Avaliada'}
                          </Badge>
                          {activity.grade !== undefined && (
                            <Badge className="bg-blue-600 text-white">
                              Nota: {activity.grade}/{activity.maxGrade || 10}
                            </Badge>
                          )}
                          <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getSubjectColor(subjectName).split(' ')[0]}`}>
                            {subjectName}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-amber-700 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Avaliada em {activity.gradedAt ? formatDate(activity.gradedAt) : 'Data não disponível'}
                          </span>
                          <span>•</span>
                          <span>Enviada em {activity.submittedAt ? formatDate(activity.submittedAt) : 'Data não disponível'}</span>
                          {activity.className && (
                            <>
                              <span>•</span>
                              <span>Turma: {activity.className}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {user?.role === 'teacher' && (
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditActivity(activity)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-amber-800 mb-4">{activity.description}</p>
                    {activity.feedback && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-amber-900 mb-1">Feedback do Professor:</p>
                        <p className="text-amber-800 text-sm">{activity.feedback}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(activity)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Trabalho
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )})
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de detalhes da atividade */}
      {selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          isOpen={showDetailsModal}
          onClose={handleModalClose}
          onSubmissionSuccess={handleSubmissionSuccess}
        />
      )}

      {/* Modal de edição de atividade */}
      {selectedActivity && showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Editar Atividade</h2>
              <Button variant="ghost" size="sm" onClick={handleModalClose}>
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input 
                  type="text" 
                  defaultValue={selectedActivity.title}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea 
                  defaultValue={selectedActivity.description}
                  className="w-full p-2 border rounded-md h-24"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                  <input 
                    type="datetime-local" 
                    defaultValue={new Date(selectedActivity.dueDate).toISOString().slice(0, 16)}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Nota Máxima</label>
                  <input 
                    type="number" 
                    defaultValue={selectedActivity.maxGrade}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Instruções</label>
                <textarea 
                  defaultValue={selectedActivity.instructions || ''}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Instruções para os alunos..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Requisitos</label>
                <textarea 
                  defaultValue={selectedActivity.requirements || ''}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="Requisitos da atividade..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="allowLate"
                    defaultChecked={selectedActivity.allowLateSubmission}
                    className="rounded"
                  />
                  <label htmlFor="allowLate" className="text-sm">Permitir entrega atrasada</label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Penalidade por atraso (%)</label>
                  <input 
                    type="number" 
                    defaultValue={selectedActivity.latePenalty}
                    className="w-full p-2 border rounded-md"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={() => handleDeleteActivity(selectedActivity.id)}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir Atividade
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleModalClose}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  // Aqui você implementaria a lógica de salvar
                  console.log('Salvando alterações...');
                  handleModalClose();
                }}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
