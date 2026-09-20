import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherActivities, useActivitySubmissions, usePendingSubmissions } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FileText,
  Calendar,
  BarChart3,
  Target,
  Award,
  Clock3,
  Edit,
  Eye,
  Download,
  CheckSquare,
  XSquare,
  FileText as FileTextIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Send,
  Star,
  Timer,
  Archive
} from 'lucide-react';
import { useLocation } from 'wouter';
import { GradeActivityModal } from '@/components/GradeActivityModal';
import { SubmissionManager } from '@/components/activities/SubmissionManager';

// Interfaces
interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  submittedAt?: string;
  comment?: string;
  grade?: number;
  feedback?: string;
  attachments?: Array<{
    type: 'file' | 'image' | 'url' | 'text';
    name: string;
    url?: string;
    content?: string;
  }>;
}

interface ActivityWithSubmissions {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  teacherId: string;
  dueDate: string;
  maxGrade: number;
  status: 'active' | 'expired' | 'archived';
  instructions?: string;
  requirements?: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  submissions: StudentSubmission[];
  createdAt: string;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [selectedActivityForGrading, setSelectedActivityForGrading] = useState<ActivityWithSubmissions | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [activitiesWithSubmissions, setActivitiesWithSubmissions] = useState<ActivityWithSubmissions[]>([]);

  // Queries para buscar atividades
  const { data: activitiesData, isLoading: isLoadingActivities } = useTeacherActivities(user?.id || '');
  
  // Buscar submissões pendentes do professor (solução correta)
  const { data: pendingSubmissionsData } = usePendingSubmissions(user?.id || '');

  const getTeacherSubject = (email: string) => {
    if (email.includes('mat')) return 'Matemática';
    if (email.includes('port')) return 'Português';
    if (email.includes('hist')) return 'História';
    if (email.includes('geo')) return 'Geografia';
    if (email.includes('cien')) return 'Ciências';
    if (email.includes('ing')) return 'Inglês';
    if (email.includes('ed.fis')) return 'Educação Física';
    if (email.includes('art')) return 'Arte';
    return 'Disciplina';
  };

  // Processar atividades com dados das submissões pendentes
  useEffect(() => {
    if (activitiesData?.data) {
      const processedActivities = activitiesData.data.map((activity: any) => {
        // Filtrar submissões pendentes desta atividade
        const activitySubmissions = pendingSubmissionsData?.data?.filter(
          (submission: any) => submission.activityId === activity.id
        ) || [];
        
        const formattedSubmissions: StudentSubmission[] = activitySubmissions.map((sub: any) => ({
          id: sub.submissionId,
          studentId: sub.studentId,
          studentName: sub.studentName || 'Aluno',
          studentEmail: sub.studentEmail || '',
          status: 'pending', // Submissões pendentes
          submittedAt: sub.submittedAt,
          comment: sub.comment,
          grade: null,
          feedback: '',
          attachments: []
        }));

        return {
          ...activity,
          subjectName: activity.subjectName || getTeacherSubject(user?.email || ''),
          submissions: formattedSubmissions
        };
      });
      
      setActivitiesWithSubmissions(processedActivities);
    }
  }, [activitiesData, pendingSubmissionsData, user?.email]);

  // Filtrar atividades por status
  const activeActivities = activitiesWithSubmissions.filter(activity => 
    activity.status === 'active' && new Date(activity.dueDate) >= new Date()
  );
  
  const expiredActivities = activitiesWithSubmissions.filter(activity => 
    activity.status === 'active' && new Date(activity.dueDate) < new Date()
  );
  
  const gradedActivities = activitiesWithSubmissions.filter(activity => 
    activity.submissions.some(s => s.status === 'graded')
  );

  // Handlers
  const handleViewDetails = (activity: ActivityWithSubmissions) => {
    setLocation(`/teacher/activities/${activity.id}`);
  };

  const handleGradeSubmission = (submission: StudentSubmission, activity: ActivityWithSubmissions) => {
    setSelectedSubmission(submission);
    setSelectedActivityForGrading(activity);
    setShowGradeModal(true);
  };

  const handleEditGrade = (submission: StudentSubmission, activity: ActivityWithSubmissions) => {
    setSelectedSubmission(submission);
    setSelectedActivityForGrading(activity);
    setShowGradeModal(true);
  };

  const handleGradeModalClose = () => {
    setShowGradeModal(false);
    setSelectedSubmission(null);
    setSelectedActivityForGrading(null);
  };

  const handleGradeSuccess = () => {
    // Refresh data after grading
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'graded': return 'bg-green-100 text-green-800 border-green-200';
      case 'late': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted': return 'Enviado';
      case 'graded': return 'Avaliado';
      case 'late': return 'Atrasado';
      default: return 'Pendente';
    }
  };

  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'url': return <LinkIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  if (isLoadingActivities) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Dashboard do Professor</h1>
          <p className="text-blue-100">Gerencie suas atividades e avalie submissões dos alunos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Atividades Ativas</p>
                  <p className="text-3xl font-bold text-slate-900">{activeActivities.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Aguardando Avaliação</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {activitiesWithSubmissions.reduce((acc, activity) => 
                      acc + activity.submissions.filter(s => s.status === 'submitted').length, 0
                    )}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Já Avaliadas</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {activitiesWithSubmissions.reduce((acc, activity) => 
                      acc + activity.submissions.filter(s => s.status === 'graded').length, 0
                    )}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Atividades Expiradas</p>
                  <p className="text-3xl font-bold text-slate-900">{expiredActivities.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ativas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ativas">Atividades Ativas</TabsTrigger>
            <TabsTrigger value="expiradas">Atividades Expiradas</TabsTrigger>
            <TabsTrigger value="avaliadas">Atividades Avaliadas</TabsTrigger>
            <TabsTrigger value="gerenciar">Gerenciar Submissões</TabsTrigger>
          </TabsList>

          {/* Aba: Atividades Ativas */}
          <TabsContent value="ativas" className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Atividades Ativas</span>
                </CardTitle>
                <CardDescription>
                  Atividades em andamento - monitore submissões e prazos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activeActivities.map((activity) => {
                    const submittedCount = activity.submissions.filter(s => s.status === 'submitted').length;
                    const totalStudents = 30; // Assumindo 30 alunos por turma
                    const submissionRate = (submittedCount / totalStudents) * 100;
                    
                    return (
                      <div key={activity.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-slate-900">{activity.title}</h3>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                Ativa
                              </Badge>
                            </div>
                            <p className="text-slate-600 mb-3">{activity.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-slate-500">
                              <span>Prazo: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}</span>
                              <span>Nota Máx: {activity.maxGrade}</span>
                              <span>Turma: {activity.className}</span>
                              <span>Enviadas: {submittedCount}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetails(activity)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Taxa de Submissão</span>
                            <span className="text-sm text-slate-500">{submittedCount}/{totalStudents}</span>
                          </div>
                          <Progress value={submissionRate} className="h-2" />
                        </div>

                        {/* Submissões Enviadas */}
                        {activity.submissions.filter(s => s.status === 'submitted').length > 0 && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-slate-900">Aguardando Avaliação</h4>
                            {activity.submissions
                              .filter(s => s.status === 'submitted')
                              .map((submission) => (
                                <div key={submission.id} className="border border-slate-200 rounded-lg p-4 bg-blue-50">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h5 className="font-semibold text-slate-900">{submission.studentName}</h5>
                                      <p className="text-sm text-slate-600">
                                        Enviado em: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className={getStatusColor(submission.status)}>
                                      {getStatusText(submission.status)}
                                    </Badge>
                                  </div>
                                  
                                  {submission.comment && (
                                    <p className="text-slate-700 mb-3 bg-white p-3 rounded border">
                                      <strong>Comentário:</strong> {submission.comment}
                                    </p>
                                  )}
                                  
                                  {submission.attachments && submission.attachments.length > 0 && (
                                    <div className="mb-3">
                                      <p className="text-sm font-medium text-slate-700 mb-2">Anexos:</p>
                                      {submission.attachments.map((attachment, index) => (
                                        <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                                          {getAttachmentIcon(attachment.type)}
                                          <span>{attachment.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex items-center space-x-3">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => handleGradeSubmission(submission, activity)}
                                    >
                                      <CheckSquare className="h-4 w-4 mr-2" />
                                      Avaliar
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver Entrega
                                    </Button>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        )}

                        {/* Mensagem quando não há submissões */}
                        {activity.submissions.filter(s => s.status === 'pending').length > 0 && (
                          <div className="text-center py-4 bg-slate-50 rounded-lg">
                            <Timer className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-slate-500">Aguardando entregas dos alunos</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {activeActivities.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">Nenhuma atividade ativa</p>
                      <p className="text-slate-400 text-sm">Crie uma nova atividade para começar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Atividades Expiradas */}
          <TabsContent value="expiradas" className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span>Atividades Expiradas</span>
                </CardTitle>
                <CardDescription>
                  Atividades com prazo vencido - finalize avaliações pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {expiredActivities.map((activity) => (
                    <div key={activity.id} className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-slate-900">{activity.title}</h3>
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              Expirada
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-3">{activity.description}</p>
                          <div className="flex items-center space-x-6 text-sm text-slate-500">
                            <span>Prazo: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}</span>
                            <span>Nota Máx: {activity.maxGrade}</span>
                            <span>Turma: {activity.className}</span>
                          </div>
                        </div>
                      </div>

                      {/* Submissões para avaliar */}
                      {activity.submissions
                        .filter(s => s.status === 'submitted')
                        .map((submission) => (
                          <div key={submission.id} className="border border-slate-200 rounded-lg p-4 bg-white mb-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-semibold text-slate-900">{submission.studentName}</h5>
                                <p className="text-sm text-slate-600">
                                  Enviado em: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                </p>
                              </div>
                              <Badge variant="outline" className={getStatusColor(submission.status)}>
                                {getStatusText(submission.status)}
                              </Badge>
                            </div>
                            
                            {submission.comment && (
                              <p className="text-slate-700 mb-3 bg-slate-50 p-3 rounded border">
                                <strong>Comentário:</strong> {submission.comment}
                              </p>
                            )}
                            
                            {submission.attachments && submission.attachments.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-slate-700 mb-2">Anexos:</p>
                                {submission.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                                    {getAttachmentIcon(attachment.type)}
                                    <span>{attachment.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center space-x-3">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleGradeSubmission(submission, activity)}
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Avaliar
                              </Button>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Entrega
                              </Button>
                            </div>
                          </div>
                        ))
                      }

                      {activity.submissions.filter(s => s.status === 'submitted').length === 0 && (
                        <p className="text-slate-500 text-center py-4">Nenhuma entrega para avaliar</p>
                      )}
                    </div>
                  ))}
                  
                  {expiredActivities.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">Nenhuma atividade expirada</p>
                      <p className="text-slate-400 text-sm">Todas as atividades estão dentro do prazo</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Atividades Avaliadas */}
          <TabsContent value="avaliadas" className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span>Atividades Avaliadas</span>
                </CardTitle>
                <CardDescription>
                  Atividades que você já avaliou - visualize notas e feedback dados aos alunos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {gradedActivities.map((activity) => {
                    const gradedSubmissions = activity.submissions.filter(s => s.status === 'graded');
                    const averageGrade = gradedSubmissions.length > 0 
                      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length 
                      : 0;
                    
                    return (
                      <div key={activity.id} className="border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-semibold text-slate-900">{activity.title}</h3>
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Avaliada
                              </Badge>
                            </div>
                            <p className="text-slate-600 mb-3">{activity.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-slate-500">
                              <span>Prazo: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}</span>
                              <span>Nota Máx: {activity.maxGrade}</span>
                              <span>Turma: {activity.className}</span>
                              <span>Avaliadas: {gradedSubmissions.length}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-slate-900">Entregas Avaliadas</h4>
                          {activity.submissions
                            .filter(s => s.status === 'graded')
                            .map((submission) => (
                              <div key={submission.id} className="border border-slate-200 rounded-lg p-4 bg-green-50">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h5 className="font-semibold text-slate-900">{submission.studentName}</h5>
                                    <p className="text-sm text-slate-600">
                                      Avaliado em: {new Date().toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                      Avaliado
                                    </Badge>
                                    <div className="mt-1">
                                      <span className="text-lg font-bold text-green-600">
                                        {submission.grade}/{activity.maxGrade}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {submission.feedback && (
                                  <p className="text-slate-700 mb-3 bg-white p-3 rounded border">
                                    <strong>Feedback:</strong> {submission.feedback}
                                  </p>
                                )}

                                <div className="flex items-center space-x-3">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditGrade(submission, activity)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar Nota
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Entrega
                                  </Button>
                                </div>
                              </div>
                            ))
                          }
                        
                          {activity.submissions.filter(s => s.status === 'graded').length === 0 && (
                            <p className="text-slate-500 text-center py-4">Nenhuma entrega avaliada</p>
                          )}  
                        </div>
                      </div>
                    );
                  })}
                  
                  {gradedActivities.length === 0 && (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">Nenhuma atividade avaliada</p>
                      <p className="text-slate-400 text-sm">As atividades aparecerão aqui após serem avaliadas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Gerenciar Submissões */}
          <TabsContent value="gerenciar" className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckSquare className="h-5 w-5 text-purple-600" />
                      <span>Gerenciamento Completo de Submissões</span>
                    </CardTitle>
                    <CardDescription>
                      Organize, filtre e avalie submissões de forma eficiente
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <SubmissionManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de Avaliação */}
      <GradeActivityModal
        submission={selectedSubmission}
        activity={selectedActivityForGrading}
        isOpen={showGradeModal}
        onClose={handleGradeModalClose}
        onSuccess={handleGradeSuccess}
      />
    </div>
  );
};

export default TeacherDashboard;
