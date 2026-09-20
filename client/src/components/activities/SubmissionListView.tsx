import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  Clock, 
  Eye, 
  Star, 
  MessageSquare,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  Send,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  maxGrade: number;
  dueDate: string;
}

interface SubmissionListViewProps {
  activity: Activity;
  onViewSubmission: (submission: Submission) => void;
  onGradeSubmission: (submission: Submission) => void;
}

export function SubmissionListView({ 
  activity, 
  onViewSubmission, 
  onGradeSubmission 
}: SubmissionListViewProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'submitted' | 'grade'>('submitted');

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

  const getStatusBadge = (submission: Submission) => {
    const { status, isLate } = submission.submission;
    
    if (status === 'graded') {
      return <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Avaliada
      </Badge>;
    }
    
    if (isLate) {
      return <Badge variant="outline" className="text-red-600 border-red-600">
        <AlertCircle className="w-3 h-3 mr-1" />
        Atrasada
      </Badge>;
    }
    
    return <Badge variant="outline" className="text-blue-600 border-blue-600">
      <Send className="w-3 h-3 mr-1" />
      Entregue
    </Badge>;
  };

  const getGradeDisplay = (submission: Submission) => {
    const { grade, finalGrade, maxGrade, latePenaltyApplied } = submission.submission;
    
    if (grade !== undefined && grade !== null) {
      if (latePenaltyApplied > 0) {
        return (
          <div className="text-sm">
            <div className="font-medium">{finalGrade?.toFixed(1) || 0}/{maxGrade}</div>
            <div className="text-red-600 text-xs">
              Nota original: {grade.toFixed(1)} (-{latePenaltyApplied.toFixed(1)} atraso)
            </div>
          </div>
        );
      }
      return <div className="font-medium">{grade.toFixed(1)}/{maxGrade}</div>;
    }
    
    return <div className="text-gray-500">Não avaliada</div>;
  };

  const filteredAndSortedSubmissions = submissions
    .filter(submission => {
      const studentName = `${submission.student.firstName} ${submission.student.lastName}`.toLowerCase();
      const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
                           (submission.student.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           submission.submission.status === statusFilter ||
                           (statusFilter === 'pending' && submission.submission.status === 'submitted');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.student.firstName} ${a.student.lastName}`.localeCompare(
            `${b.student.firstName} ${b.student.lastName}`
          );
        case 'grade':
          const gradeA = a.submission.finalGrade || a.submission.grade || 0;
          const gradeB = b.submission.finalGrade || b.submission.grade || 0;
          return gradeB - gradeA;
        case 'submitted':
        default:
          return new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime();
      }
    });

  const stats = {
    total: submissions.length,
    graded: submissions.filter(s => s.submission.status === 'graded').length,
    pending: submissions.filter(s => s.submission.status === 'submitted' || s.submission.status === 'late').length,
    late: submissions.filter(s => s.submission.isLate).length,
    averageGrade: submissions.filter(s => s.submission.grade !== null).length > 0
      ? submissions
          .filter(s => s.submission.grade !== null)
          .reduce((sum, s) => sum + (s.submission.finalGrade || s.submission.grade || 0), 0) /
        submissions.filter(s => s.submission.grade !== null).length
      : 0
  };

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
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
            <div className="text-sm text-gray-600">Avaliadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.late}</div>
            <div className="text-sm text-gray-600">Atrasadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.averageGrade.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Média</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou email do aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="graded">Avaliadas</SelectItem>
                <SelectItem value="late">Atrasadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'name' | 'submitted' | 'grade') => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Data de Entrega</SelectItem>
                <SelectItem value="name">Nome do Aluno</SelectItem>
                <SelectItem value="grade">Nota</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Submissões */}
      <div className="space-y-4">
        {filteredAndSortedSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma submissão encontrada
              </h3>
              <p className="text-gray-600">
                {submissions.length === 0 
                  ? "Ainda não há submissões para esta atividade." 
                  : "Nenhuma submissão corresponde aos filtros aplicados."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedSubmissions.map((submission) => (
            <Card key={submission.submission.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">
                        {submission.student.firstName} {submission.student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{submission.student.email}</p>
                      <div className="flex items-center mt-1 space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(submission.submission.submittedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(new Date(submission.submission.submittedAt), 'HH:mm', { locale: ptBR })}
                        </div>
                        {submission.files.length > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FileText className="w-4 h-4 mr-1" />
                            {submission.files.length} arquivo(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      {getGradeDisplay(submission)}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(submission)}
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSubmission(submission)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {submission.submission.comment && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start">
                      <MessageSquare className="w-4 h-4 mt-1 mr-2 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{submission.submission.comment}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {submission.submission.feedback && (
                  <div className="mt-2 pt-2 border-t border-green-200 bg-green-50 rounded p-3">
                    <div className="flex items-start">
                      <MessageSquare className="w-4 h-4 mt-1 mr-2 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">Feedback do Professor:</p>
                        <p className="text-sm text-green-700">{submission.submission.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

