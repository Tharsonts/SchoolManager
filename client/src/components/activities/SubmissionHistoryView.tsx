import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  History, 
  Calendar, 
  Clock, 
  User, 
  Star,
  CheckCircle,
  AlertCircle,
  Send,
  FileText,
  MessageSquare,
  Edit3,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface HistoryEntry {
  id: string;
  submissionId: string;
  action: 'submitted' | 'graded' | 'returned' | 'resubmitted' | 'late_penalty_applied';
  performedBy: string;
  performedAt: string;
  details?: string;
  previousStatus?: string;
  newStatus?: string;
  gradeChange?: number;
  performerName?: string;
  performerRole?: string;
}

interface Submission {
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
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Activity {
  id: string;
  title: string;
  dueDate: string;
  maxGrade: number;
}

interface SubmissionHistoryViewProps {
  submission: Submission;
  student: Student;
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmissionHistoryView({ 
  submission, 
  student, 
  activity, 
  isOpen, 
  onClose 
}: SubmissionHistoryViewProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen && submission) {
      fetchSubmissionHistory();
    }
  }, [isOpen, submission.id]);

  const fetchSubmissionHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/submissions/${submission.id}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        throw new Error('Erro ao carregar histórico');
      }
    } catch (error) {
      toast.error('Erro ao carregar histórico da submissão');
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'submitted':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'graded':
        return <Star className="w-4 h-4 text-green-600" />;
      case 'returned':
        return <ArrowDown className="w-4 h-4 text-orange-600" />;
      case 'resubmitted':
        return <ArrowUp className="w-4 h-4 text-blue-600" />;
      case 'late_penalty_applied':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <History className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionDescription = (entry: HistoryEntry) => {
    switch (entry.action) {
      case 'submitted':
        return submission.isLate ? 'Submeteu a atividade (em atraso)' : 'Submeteu a atividade';
      case 'graded':
        return `Avaliou a submissão com nota ${entry.gradeChange || 0}`;
      case 'returned':
        return 'Retornou a submissão para correção';
      case 'resubmitted':
        return 'Reenviou a atividade';
      case 'late_penalty_applied':
        return `Aplicou penalidade por atraso (-${submission.latePenaltyApplied} pontos)`;
      default:
        return 'Ação desconhecida';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'submitted':
        return 'border-blue-200 bg-blue-50';
      case 'graded':
        return 'border-green-200 bg-green-50';
      case 'returned':
        return 'border-orange-200 bg-orange-50';
      case 'resubmitted':
        return 'border-blue-200 bg-blue-50';
      case 'late_penalty_applied':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Enviada</Badge>;
      case 'late':
        return <Badge variant="outline" className="text-red-600 border-red-600">Atrasada</Badge>;
      case 'graded':
        return <Badge variant="outline" className="text-green-600 border-green-600">Avaliada</Badge>;
      case 'returned':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Retornada</Badge>;
      case 'resubmitted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Reenviada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getCurrentStatus = () => {
    const { status, isLate, grade } = submission;
    
    if (status === 'graded') {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        text: 'Avaliada',
        color: 'text-green-600'
      };
    }
    
    if (isLate) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-red-600" />,
        text: 'Entregue com Atraso',
        color: 'text-red-600'
      };
    }
    
    return {
      icon: <Send className="w-5 h-5 text-blue-600" />,
      text: 'Entregue',
      color: 'text-blue-600'
    };
  };

  const currentStatus = getCurrentStatus();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Histórico da Submissão</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activity.title} - {student.firstName} {student.lastName}
            </p>
          </div>
          <Button variant="outline" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Informações da Submissão Atual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {currentStatus.icon}
                    <span className="ml-2">Status Atual</span>
                  </div>
                  {getStatusBadge(submission.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Data de Entrega</p>
                    <p className="font-medium">
                      {format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Prazo</p>
                    <p className="font-medium">
                      {format(new Date(activity.dueDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  
                  {submission.grade !== undefined && submission.grade !== null && (
                    <div>
                      <p className="text-sm text-gray-600">Nota</p>
                      <p className="font-medium text-lg">
                        {submission.finalGrade?.toFixed(1) || submission.grade.toFixed(1)}/{activity.maxGrade}
                      </p>
                      {submission.latePenaltyApplied > 0 && (
                        <p className="text-xs text-red-600">
                          Penalidade: -{submission.latePenaltyApplied}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {submission.isLate && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <div>
                        <p className="font-medium text-red-800">Entrega em Atraso</p>
                        <p className="text-sm text-red-600">
                          Esta submissão foi entregue após o prazo estabelecido.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {submission.feedback && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <MessageSquare className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 mb-1">Feedback do Professor:</p>
                        <p className="text-sm text-green-700">{submission.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de Ações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Histórico de Ações
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Carregando histórico...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum histórico disponível ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={entry.id} className="relative">
                        {index !== history.length - 1 && (
                          <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                        )}
                        
                        <div className={`p-4 rounded-lg border-l-4 ${getActionColor(entry.action)}`}>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getActionIcon(entry.action)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">
                                  {getActionDescription(entry)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(entry.performedAt), 'dd/MM HH:mm', { locale: ptBR })}
                                </p>
                              </div>
                              
                              <div className="mt-1 flex items-center space-x-2">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {entry.performerName || 'Sistema'}
                                  {entry.performerRole && ` (${entry.performerRole})`}
                                </span>
                              </div>
                              
                              {showDetails && entry.details && (
                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700">
                                  {entry.details}
                                </div>
                              )}
                              
                              {showDetails && (entry.previousStatus || entry.newStatus) && (
                                <div className="mt-2 flex items-center space-x-2 text-xs">
                                  {entry.previousStatus && (
                                    <span className="px-2 py-1 bg-gray-100 rounded">
                                      De: {entry.previousStatus}
                                    </span>
                                  )}
                                  {entry.newStatus && (
                                    <span className="px-2 py-1 bg-blue-100 rounded">
                                      Para: {entry.newStatus}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Timeline da Submissão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {/* Criação da Atividade */}
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">Atividade Criada</p>
                        <p className="text-sm text-gray-600">Prazo definido para {format(new Date(activity.dueDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                      </div>
                    </div>
                    
                    {/* Submissão */}
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${submission.isLate ? 'bg-red-100' : 'bg-blue-100'}`}>
                        <Send className={`w-4 h-4 ${submission.isLate ? 'text-red-600' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {submission.isLate ? 'Submetida com Atraso' : 'Submetida'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(submission.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Avaliação */}
                    {submission.status === 'graded' && submission.gradedAt && (
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Star className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Avaliada</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(submission.gradedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            Nota: {submission.finalGrade?.toFixed(1) || submission.grade?.toFixed(1)}/{activity.maxGrade}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

