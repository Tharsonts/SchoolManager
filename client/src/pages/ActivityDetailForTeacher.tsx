import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  Star,
  BarChart3,
  Settings,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Image,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import TeacherLayout from '@/components/layout/TeacherLayout';
import { SubmissionListView } from '@/components/activities/SubmissionListView';
import { SubmissionDetailView } from '@/components/activities/SubmissionDetailView';

interface ActivityFile {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  fileCategory: string;
  uploadedBy: string;
  createdAt: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  type?: string;
  dueDate: string;
  maxGrade: number;
  status: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  instructions?: string;
  requirements?: string;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  subjectName?: string;
  className?: string;
  files?: ActivityFile[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SubmissionFile {
  id: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

interface Submission {
  submission: {
    id: string;
    activityId: string;
    studentId: string;
    submittedAt: string;
    comment: string;
    status: 'submitted' | 'late' | 'graded' | 'returned' | 'resubmitted';
    grade?: number;
    maxGrade: number;
    feedback?: string;
    gradedBy?: string;
    gradedAt?: string;
    isLate: boolean;
    latePenaltyApplied: number;
    finalGrade?: number;
    createdAt: string;
    updatedAt: string;
  };
  student: Student;
  files: SubmissionFile[];
}

export default function ActivityDetailForTeacher() {
  const [match, params] = useRoute('/teacher/activities/:id/detail');
  const [, navigate] = useLocation();
  const id = params?.id;
  const { user } = useAuth();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchActivity();
      fetchSubmissions();
    }
  }, [id]);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/activities/${id}`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data);
      } else {
        throw new Error('Atividade não encontrada');
      }
    } catch (error) {
      toast.error('Erro ao carregar atividade');
      console.error('Erro:', error);
      navigate('/teacher/activities');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/activities/${id}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        console.log('Nenhuma submissão encontrada ou erro ao carregar');
        setSubmissions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar submissões:', error);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsDetailViewOpen(true);
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsDetailViewOpen(true);
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    setSelectedSubmission(null);
  };

  const handleRefreshSubmissions = () => {
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Ativa</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-red-600 border-red-600">Arquivada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      homework: 'Tarefa de Casa',
      quiz: 'Quiz',
      project: 'Projeto',
      essay: 'Redação',
      presentation: 'Apresentação',
      exercise: 'Exercício'
    };
    return types[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canViewOnline = (fileType: string, fileName: string) => {
    const onlineViewableTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/html'
    ];
    
    const onlineViewableExtensions = ['.pdf', '.doc', '.docx', '.txt', '.html'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    return onlineViewableTypes.includes(fileType) || onlineViewableExtensions.includes(fileExtension);
  };

  const getViewerUrl = (fileId: string, fileName: string) => {
    // Para todos os tipos de arquivo, usar visualização direta interna
    return `/api/activities/files/${fileId}/view`;
  };

  const getSubmissionStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.submission.status === 'submitted' || s.submission.status === 'late').length;
    const graded = submissions.filter(s => s.submission.status === 'graded').length;
    const late = submissions.filter(s => s.submission.isLate).length;
    
    const gradedSubmissions = submissions.filter(s => s.submission.grade !== null && s.submission.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.submission.finalGrade || s.submission.grade || 0), 0) / gradedSubmissions.length
      : 0;

    return { total, submitted, graded, late, averageGrade };
  };

  const stats = getSubmissionStats();
  const isOverdue = activity ? new Date() > new Date(activity.dueDate) : false;

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando detalhes da atividade...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!activity) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Atividade não encontrada</h2>
            <p className="text-gray-600 mb-4">A atividade solicitada não foi encontrada.</p>
            <Button onClick={() => navigate('/teacher/activities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Atividades
            </Button>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/teacher/activities')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
              <p className="text-gray-600">{activity.type && getTypeLabel(activity.type)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(activity.status)}
            <Button
              variant="outline"
              onClick={() => navigate(`/teacher/activities/${activity.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Informações da Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informações da Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-700">{activity.description}</p>
                
                {activity.instructions && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-1">Instruções:</h4>
                    <p className="text-gray-700 text-sm">{activity.instructions}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <div>
                    <p className="text-sm">Prazo de Entrega</p>
                    <p className="font-medium">
                      {format(new Date(activity.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <div>
                    <p className="text-sm">Horário</p>
                    <p className="font-medium">
                      {format(new Date(activity.dueDate), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                {isOverdue && (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Prazo Expirado</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pontuação Máxima</p>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{activity.maxGrade} pontos</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Submissões em Atraso</p>
                  <p className="font-medium">
                    {activity.allowLateSubmission ? (
                      <>Permitidas (penalidade: -{activity.latePenalty} pontos)</>
                    ) : (
                      'Não permitidas'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Arquivos da Atividade */}
            {activity.files && activity.files.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Arquivos da Atividade</h3>
                <div className="space-y-2">
                  {activity.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        {file.fileType.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{file.originalFileName}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.fileSize)} • {file.fileCategory}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {file.fileType.startsWith('image/') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/activities/files/${file.id}/view`, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        )}
                        {canViewOnline(file.fileType, file.originalFileName) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const viewerUrl = getViewerUrl(file.id, file.originalFileName);
                              window.open(viewerUrl, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Ver Online
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/api/activities/files/${file.id}/download`;
                            link.download = file.originalFileName;
                            link.click();
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas de Submissões */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
              <div className="text-sm text-gray-600">Entregues</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
              <div className="text-sm text-gray-600">Avaliadas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Atrasadas</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Média</div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="overview" className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Submissões ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Status das Submissões</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-blue-800 font-medium">{stats.total}</p>
                        <p className="text-blue-600">Total de submissões</p>
                      </div>
                      <div>
                        <p className="text-green-800 font-medium">{stats.graded}</p>
                        <p className="text-green-600">Já avaliadas</p>
                      </div>
                      <div>
                        <p className="text-orange-800 font-medium">{stats.submitted}</p>
                        <p className="text-orange-600">Aguardando avaliação</p>
                      </div>
                      <div>
                        <p className="text-red-800 font-medium">{stats.late}</p>
                        <p className="text-red-600">Entregues com atraso</p>
                      </div>
                    </div>
                  </div>

                  {stats.graded > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Desempenho da Turma</h4>
                      <p className="text-green-800">
                        Média geral: <span className="font-bold">{stats.averageGrade.toFixed(1)}</span> de {activity.maxGrade} pontos
                      </p>
                    </div>
                  )}

                  {stats.submitted > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">⚠️ Ação Necessária</h4>
                      <p className="text-orange-800 mb-3">
                        Há {stats.submitted} submissão(ões) aguardando sua avaliação.
                      </p>
                      <Button
                        onClick={() => setActiveTab('submissions')}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Submissões
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            {submissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma submissão ainda
                  </h3>
                  <p className="text-gray-600">
                    Os alunos ainda não enviaram suas atividades. As submissões aparecerão aqui quando enviadas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <SubmissionListView
                activity={activity}
                onViewSubmission={handleViewSubmission}
                onGradeSubmission={handleGradeSubmission}
              />
            )}
          </TabsContent>

        </Tabs>

        {/* Modal de Detalhes da Submissão */}
        <SubmissionDetailView
          submission={selectedSubmission}
          activity={activity}
          isOpen={isDetailViewOpen}
          onClose={handleCloseDetailView}
          onGradeSubmission={handleGradeSubmission}
          onRefresh={handleRefreshSubmissions}
        />
        </div>
      </TeacherLayout>
    );
  }
