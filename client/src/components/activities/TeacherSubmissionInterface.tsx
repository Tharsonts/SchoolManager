import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  Star, 
  Eye, 
  Download,
  BarChart3,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SubmissionListView } from './SubmissionListView';
import { SubmissionDetailView } from './SubmissionDetailView';
import { toast } from 'sonner';

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
}

interface TeacherSubmissionInterfaceProps {
  activity: Activity;
}

export function TeacherSubmissionInterface({ activity }: TeacherSubmissionInterfaceProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  useEffect(() => {
    fetchSubmissions();
  }, [activity.id]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/activities/${activity.id}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        throw new Error('Erro ao carregar submissões');
      }
    } catch (error) {
      toast.error('Erro ao carregar submissões');
      console.error('Erro:', error);
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

  const downloadAllSubmissions = async () => {
    try {
      const response = await fetch(`/api/activities/${activity.id}/submissions/download-all`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activity.title}_submissoes.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Download iniciado');
      } else {
        throw new Error('Erro ao baixar submissões');
      }
    } catch (error) {
      toast.error('Erro ao baixar submissões');
      console.error('Erro:', error);
    }
  };

  const exportGrades = async () => {
    try {
      const response = await fetch(`/api/activities/${activity.id}/submissions/export-grades`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activity.title}_notas.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Planilha de notas exportada');
      } else {
        throw new Error('Erro ao exportar notas');
      }
    } catch (error) {
      toast.error('Erro ao exportar notas');
      console.error('Erro:', error);
    }
  };

  const getStats = () => {
    const total = submissions.length;
    const graded = submissions.filter(s => s.submission.status === 'graded').length;
    const pending = submissions.filter(s => 
      s.submission.status === 'submitted' || s.submission.status === 'late'
    ).length;
    const late = submissions.filter(s => s.submission.isLate).length;
    
    const gradedSubmissions = submissions.filter(s => s.submission.grade !== null && s.submission.grade !== undefined);
    const averageGrade = gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.submission.finalGrade || s.submission.grade || 0), 0) / gradedSubmissions.length
      : 0;

    return { total, graded, pending, late, averageGrade };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando submissões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{activity.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Gerenciar submissões e avaliações dos alunos
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={downloadAllSubmissions}
                disabled={submissions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Todas
              </Button>
              <Button
                variant="outline"
                onClick={exportGrades}
                disabled={stats.graded === 0}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Exportar Notas
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total de Submissões</div>
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
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
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
            <div className="text-sm text-gray-600">Média Geral</div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="submissions" className="flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Submissões ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Pendentes ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="graded" className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Avaliadas ({stats.graded})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <SubmissionListView
            activity={activity}
            onViewSubmission={handleViewSubmission}
            onGradeSubmission={handleGradeSubmission}
          />
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Submissões Pendentes de Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.pending === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Todas as submissões foram avaliadas!
                  </h3>
                  <p className="text-gray-600">
                    Parabéns! Você avaliou todas as submissões desta atividade.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter(s => s.submission.status === 'submitted' || s.submission.status === 'late')
                    .map((submission) => (
                      <div
                        key={submission.submission.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {submission.student.firstName} {submission.student.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{submission.student.email}</p>
                            {submission.submission.isLate && (
                              <Badge variant="outline" className="text-red-600 border-red-600 mt-1">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Atrasada
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSubmission(submission)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleGradeSubmission(submission)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Avaliar
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graded">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Submissões Avaliadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.graded === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma submissão avaliada ainda
                  </h3>
                  <p className="text-gray-600">
                    As submissões avaliadas aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions
                    .filter(s => s.submission.status === 'graded')
                    .sort((a, b) => (b.submission.finalGrade || b.submission.grade || 0) - (a.submission.finalGrade || a.submission.grade || 0))
                    .map((submission) => (
                      <div
                        key={submission.submission.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {submission.student.firstName} {submission.student.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{submission.student.email}</p>
                            {submission.submission.feedback && (
                              <div className="flex items-center mt-1">
                                <MessageSquare className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs text-gray-500">Com feedback</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {submission.submission.finalGrade?.toFixed(1) || submission.submission.grade?.toFixed(1) || 0}
                              <span className="text-sm text-gray-600">/{activity.maxGrade}</span>
                            </div>
                            {submission.submission.latePenaltyApplied > 0 && (
                              <div className="text-xs text-red-600">
                                (-{submission.submission.latePenaltyApplied} atraso)
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSubmission(submission)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGradeSubmission(submission)}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
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
  );
}

