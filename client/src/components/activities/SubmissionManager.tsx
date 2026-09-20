import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import {
  Search,
  Filter,
  Download,
  Eye,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  BarChart3,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  User,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  MessageSquare,
  Send,
  CheckSquare,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SubmissionFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface Submission {
  submission: {
    id: string;
    studentId: string;
    activityId: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
    gradedAt?: string;
    gradedBy?: string;
    status: 'submitted' | 'graded' | 'late';
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  files: SubmissionFile[];
}

interface Activity {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
  subjectName: string;
  className: string;
}

export function SubmissionManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [showBatchGrade, setShowBatchGrade] = useState(false);
  const [batchGrade, setBatchGrade] = useState('');
  const [batchFeedback, setBatchFeedback] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Buscar atividades do professor
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['teacher-activities', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/activities`);
      if (!response.ok) throw new Error('Falha ao carregar atividades');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar submissões da atividade selecionada
  const { data: submissionsData, isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery({
    queryKey: ['activity-submissions', selectedActivity, statusFilter, searchTerm, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      
      const response = await fetch(`/api/activities/${selectedActivity}/submissions/filtered?${params}`);
      if (!response.ok) throw new Error('Falha ao carregar submissões');
      return response.json();
    },
    enabled: !!selectedActivity
  });

  // Mutation para avaliação individual
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, grade, feedback }: { submissionId: string; grade: number; feedback: string }) => {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, feedback })
      });
      if (!response.ok) throw new Error('Falha ao avaliar submissão');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] });
      refetchSubmissions();
    }
  });

  // Mutation para avaliação em lote
  const batchGradeMutation = useMutation({
    mutationFn: async ({ activityId, submissionIds, grade, feedback }: {
      activityId: string;
      submissionIds: string[];
      grade: number;
      feedback: string;
    }) => {
      const response = await fetch(`/api/activities/${activityId}/submissions/batch-grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionIds, grade, feedback })
      });
      if (!response.ok) throw new Error('Falha na avaliação em lote');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] });
      setSelectedSubmissions([]);
      setShowBatchGrade(false);
      setBatchGrade('');
      setBatchFeedback('');
      refetchSubmissions();
    }
  });

  const handleGradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    await gradeMutation.mutateAsync({ submissionId, grade, feedback });
  };

  const handleBatchGrade = async () => {
    if (!selectedActivity || selectedSubmissions.length === 0 || !batchGrade) return;
    
    const gradeValue = parseFloat(batchGrade);
    const selectedActivityData = activities?.find((a: Activity) => a.id === selectedActivity);
    
    if (isNaN(gradeValue) || gradeValue < 0 || (selectedActivityData && gradeValue > selectedActivityData.maxGrade)) {
      alert(`Nota deve ser entre 0 e ${selectedActivityData?.maxGrade || 10}`);
      return;
    }

    await batchGradeMutation.mutateAsync({
      activityId: selectedActivity,
      submissionIds: selectedSubmissions,
      grade: gradeValue,
      feedback: batchFeedback
    });
  };

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissions(prev => 
      prev.includes(submissionId)
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === submissionsData?.submissions?.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissionsData?.submissions?.map((s: Submission) => s.submission.id) || []);
    }
  };

  const getStatusBadge = (submission: Submission) => {
    const { status, submittedAt } = submission.submission;
    const selectedActivityData = activities?.find((a: Activity) => a.id === selectedActivity);
    
    if (status === 'graded') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Avaliada</Badge>;
    }
    
    if (selectedActivityData?.dueDate && new Date(submittedAt) > new Date(selectedActivityData.dueDate)) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Atrasada</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Entregue</Badge>;
  };

  const getStatistics = () => {
    if (!submissionsData?.submissions) return { total: 0, graded: 0, pending: 0, late: 0 };
    
    const submissions = submissionsData.submissions;
    const selectedActivityData = activities?.find((a: Activity) => a.id === selectedActivity);
    
    return {
      total: submissions.length,
      graded: submissions.filter((s: Submission) => s.submission.status === 'graded').length,
      pending: submissions.filter((s: Submission) => s.submission.status !== 'graded').length,
      late: submissions.filter((s: Submission) => 
        selectedActivityData?.dueDate && 
        new Date(s.submission.submittedAt) > new Date(selectedActivityData.dueDate)
      ).length
    };
  };

  const statistics = getStatistics();
  const selectedActivityData = activities?.find((a: Activity) => a.id === selectedActivity);

  return (
    <div className="space-y-6">
      {/* Seleção de Atividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>Selecionar Atividade</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha uma atividade para gerenciar" />
            </SelectTrigger>
            <SelectContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Carregando...</span>
                </div>
              ) : (
                activities?.map((activity: Activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-sm text-gray-500">
                        {activity.subjectName} • {activity.className} • Prazo: {formatDate(new Date(activity.dueDate))}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedActivity && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{statistics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avaliadas</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.graded}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Atrasadas</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.late}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Controles */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="graded">Avaliadas</SelectItem>
                    <SelectItem value="late">Atrasadas</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submittedAt-desc">Mais recentes</SelectItem>
                    <SelectItem value="submittedAt-asc">Mais antigas</SelectItem>
                    <SelectItem value="student-asc">Nome A-Z</SelectItem>
                    <SelectItem value="student-desc">Nome Z-A</SelectItem>
                    <SelectItem value="grade-desc">Maior nota</SelectItem>
                    <SelectItem value="grade-asc">Menor nota</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedSubmissions.length > 0 && (
                  <Button
                    onClick={() => setShowBatchGrade(true)}
                    className="flex items-center space-x-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Avaliar Selecionadas ({selectedSubmissions.length})</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Submissões */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Submissões</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedSubmissions.length === submissionsData?.submissions?.length && submissionsData?.submissions?.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Selecionar todas</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando submissões...</span>
                </div>
              ) : submissionsData?.submissions?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Nenhuma submissão encontrada</p>
                  <p className="text-sm">Ajuste os filtros ou aguarde as entregas dos alunos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissionsData?.submissions?.map((submission: Submission) => (
                    <div key={submission.submission.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            checked={selectedSubmissions.includes(submission.submission.id)}
                            onCheckedChange={() => handleSelectSubmission(submission.submission.id)}
                          />
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {submission.student.firstName} {submission.student.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{submission.student.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Entregue em</p>
                            <p className="text-sm font-medium">
                              {formatDate(new Date(submission.submission.submittedAt))}
                            </p>
                          </div>
                          
                          {getStatusBadge(submission)}
                          
                          {submission.submission.grade !== null && submission.submission.grade !== undefined && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Nota</p>
                              <p className="text-lg font-bold text-green-600">
                                {submission.submission.grade}/{selectedActivityData?.maxGrade}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission({
                                  ...submission.submission,
                                  student: submission.student,
                                  files: submission.files
                                });
                                setShowDetailModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalhes
                            </Button>
                            
                            {submission.files.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {submission.files.length} arquivo{submission.files.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Paginação */}
              {submissionsData?.pagination && submissionsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-gray-500">
                    Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, submissionsData.pagination.total)} de {submissionsData.pagination.total} submissões
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {submissionsData.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(submissionsData.pagination.totalPages, prev + 1))}
                      disabled={currentPage === submissionsData.pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal de Avaliação em Lote */}
      {showBatchGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Avaliar em Lote</CardTitle>
              <p className="text-sm text-gray-500">
                Avaliando {selectedSubmissions.length} submissões
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="batch-grade">Nota (0 a {selectedActivityData?.maxGrade})</Label>
                <Input
                  id="batch-grade"
                  type="number"
                  min="0"
                  max={selectedActivityData?.maxGrade}
                  step="0.1"
                  value={batchGrade}
                  onChange={(e) => setBatchGrade(e.target.value)}
                  placeholder="Digite a nota"
                />
              </div>
              
              <div>
                <Label htmlFor="batch-feedback">Feedback (opcional)</Label>
                <Textarea
                  id="batch-feedback"
                  value={batchFeedback}
                  onChange={(e) => setBatchFeedback(e.target.value)}
                  placeholder="Feedback para todas as submissões..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleBatchGrade}
                  disabled={batchGradeMutation.isPending || !batchGrade}
                  className="flex-1"
                >
                  {batchGradeMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Avaliando...</>
                  ) : (
                    <><CheckSquare className="h-4 w-4 mr-2" />Avaliar Todas</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBatchGrade(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        activity={selectedActivityData}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedSubmission(null);
        }}
        onGrade={handleGradeSubmission}
      />
    </div>
  );
}