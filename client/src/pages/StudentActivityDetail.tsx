import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText,
  Star,
  User,
  AlertCircle,
  CheckCircle,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { StudentSubmissionForm } from '@/components/activities/StudentSubmissionForm';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  maxGrade: number;
  status: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  instructions?: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    filePath: string;
  }>;
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

export function StudentActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [submission, setSubmission] = useState<ExistingSubmission | null>(null);
  const [activityFiles, setActivityFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (id) {
      fetchActivityAndSubmission();
    }
  }, [id]);

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
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const directUrl = `/api/activities/files/${fileId}/view`;
    if (ext === '.doc' || ext === '.docx') {
      return `/viewer/docx/${fileId}`;
    }
    return directUrl;
  };

  const fetchActivityAndSubmission = async () => {
    try {
      setIsLoading(true);
      
      // Buscar atividade (que já inclui os arquivos)
      const activityResponse = await fetch(`/api/activities/${id}`);
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivity(activityData);
        
        // Usar os arquivos que já vêm na resposta da API
        if (activityData.files && activityData.files.length > 0) {
          setActivityFiles(activityData.files);
        }
      } else {
        throw new Error('Atividade não encontrada');
      }
      
      // Buscar submissão do aluno
      const submissionResponse = await fetch(`/api/activities/${id}/my-submission`);
      if (submissionResponse.ok) {
        const submissionData = await submissionResponse.json();
        setSubmission(submissionData);
      }
      // Se não encontrou submissão, é normal (aluno ainda não entregou)
      
    } catch (error) {
      toast.error('Erro ao carregar atividade');
      console.error('Erro:', error);
      navigate('/activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionUpdate = () => {
    fetchActivityAndSubmission();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Disponível</Badge>;
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

  const isOverdue = activity ? new Date() > new Date(activity.dueDate) : false;
  const canSubmit = activity?.status === 'active' && (!isOverdue || activity.allowLateSubmission);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando atividade...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!activity) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Atividade não encontrada</h2>
            <p className="text-gray-600 mb-4">A atividade solicitada não foi encontrada.</p>
            <Button onClick={() => navigate('/activities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Atividades
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/activities')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
              <p className="text-gray-600">{getTypeLabel(activity.type)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(activity.status)}
            {submission && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Entregue
              </Badge>
            )}
          </div>
        </div>

        {/* Alerta de Prazo */}
        {isOverdue && !submission && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h3 className="font-medium text-red-800">Prazo Expirado</h3>
                  <p className="text-sm text-red-600">
                    {activity.allowLateSubmission 
                      ? `O prazo expirou, mas você ainda pode entregar com penalidade de ${activity.latePenalty} pontos.`
                      : 'O prazo para esta atividade expirou e submissões não são mais aceitas.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Detalhes da Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-700 mb-4">{activity.description}</p>
                
                {activity.instructions && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">Instruções:</h4>
                    <p className="text-sm text-blue-800">{activity.instructions}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Prazo de Entrega</p>
                    <p className="font-medium">
                      {format(new Date(activity.dueDate), 'dd/MM/yyyy', { locale: ptBR })} às{' '}
                      {format(new Date(activity.dueDate), 'HH:mm', { locale: ptBR })}
                    </p>
                    {isOverdue && (
                      <p className="text-sm text-red-600 font-medium">Prazo expirado</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Pontuação</p>
                    <p className="font-medium">{activity.maxGrade} pontos</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Submissões em Atraso</p>
                    <p className="font-medium">
                      {activity.allowLateSubmission ? (
                        <span className="text-orange-600">
                          Permitidas (penalidade: -{activity.latePenalty} pontos)
                        </span>
                      ) : (
                        <span className="text-red-600">Não permitidas</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arquivos da Atividade */}
        {activityFiles && activityFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Materiais da Atividade ({activityFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activityFiles.map((file: any) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{file.originalName || file.fileName}</p>
                        <p className="text-sm text-gray-600">
                          {file.fileSize && `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {file.fileType && file.fileType.startsWith('image/') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/activities/files/${file.id}/view`, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      )}
                      {canViewOnline(file.fileType, file.originalName || file.fileName) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const viewerUrl = getViewerUrl(file.id, file.originalName || file.fileName);
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
                          link.download = file.originalName || file.fileName;
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
            </CardContent>
          </Card>
        )}

        {/* Status da Submissão */}
        {submission && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Status da Sua Submissão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    {submission.status === 'graded' ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Avaliada
                      </Badge>
                    ) : submission.isLate ? (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Entregue com Atraso
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Entregue
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Entregue em</p>
                  <p className="font-medium">
                    {format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                
                {submission.grade !== undefined && submission.grade !== null && (
                  <div>
                    <p className="text-sm text-gray-600">Nota</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold text-green-600">
                        {submission.finalGrade?.toFixed(1) || submission.grade.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-600 ml-1">/{activity.maxGrade}</span>
                    </div>
                    {submission.latePenaltyApplied > 0 && (
                      <p className="text-xs text-red-600">
                        Penalidade: -{submission.latePenaltyApplied} pontos
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {submission.feedback && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1">Feedback do Professor:</h4>
                  <p className="text-sm text-green-800">{submission.feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Formulário de Submissão */}
        {canSubmit && (
          <StudentSubmissionForm
            activity={activity}
            existingSubmission={submission || undefined}
            onSubmissionUpdate={handleSubmissionUpdate}
          />
        )}

        {/* Mensagem quando não pode submeter */}
        {!canSubmit && !submission && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Submissão não disponível
              </h3>
              <p className="text-gray-600">
                {activity.status !== 'active' 
                  ? 'Esta atividade não está mais disponível para submissão.'
                  : 'O prazo para esta atividade expirou e submissões em atraso não são permitidas.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
