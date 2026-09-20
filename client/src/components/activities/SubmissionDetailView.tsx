import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
  Edit3,
  Save,
  X,
  Eye,
  Image,
  Link
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
  description: string;
  maxGrade: number;
  dueDate: string;
}

interface SubmissionDetailViewProps {
  submission: Submission | null;
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onGradeSubmission: (submission: Submission) => void;
  onRefresh: () => void;
}

export function SubmissionDetailView({ 
  submission, 
  activity, 
  isOpen, 
  onClose, 
  onGradeSubmission,
  onRefresh
}: SubmissionDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  React.useEffect(() => {
    if (submission) {
      setGrade(submission.submission.grade?.toString() || '');
      setFeedback(submission.submission.feedback || '');
    }
  }, [submission]);

  if (!submission) return null;

  const getStatusBadge = () => {
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    if (fileType === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const handleDownloadFile = async (file: SubmissionFile) => {
    try {
      const response = await fetch(`/api/submissions/files/${file.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erro ao baixar arquivo');
      }
    } catch (error) {
      toast.error('Erro ao baixar arquivo');
      console.error('Erro:', error);
    }
  };

  const handleGradeSubmit = async () => {
    if (!grade || parseFloat(grade) < 0 || parseFloat(grade) > activity.maxGrade) {
      toast.error(`A nota deve estar entre 0 e ${activity.maxGrade}`);
      return;
    }

    setIsGrading(true);
    
    try {
      const response = await fetch(`/api/submissions/${submission.submission.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: parseFloat(grade),
          feedback: feedback.trim() || undefined
        }),
      });

      if (response.ok) {
        toast.success('Avaliação salva com sucesso!');
        setIsEditing(false);
        onRefresh();
        
        // Fechar o modal após 1.5 segundos para dar tempo de ver o feedback
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar avaliação');
      }
    } catch (error) {
      toast.error('Erro ao salvar avaliação. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setIsGrading(false);
    }
  };

  const getDaysLate = () => {
    const dueDate = new Date(activity.dueDate);
    const submittedDate = new Date(submission.submission.submittedAt);
    const diffTime = submittedDate.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Submissão - {activity.title}</span>
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Consolidadas */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            {/* Aluno */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-lg">
                    {submission.student.firstName} {submission.student.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{submission.student.email}</p>
                </div>
              </div>
              {getStatusBadge()}
            </div>
            
            {/* Informações de Entrega */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Entregue em</p>
                  <p className="font-medium">
                    {format(new Date(submission.submission.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Prazo</p>
                  <p className="font-medium">
                    {format(new Date(activity.dueDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              {submission.submission.isLate && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-xs text-red-500 uppercase tracking-wide">Atraso</p>
                    <p className="font-medium text-red-600">
                      {getDaysLate()} dia(s)
                      {submission.submission.latePenaltyApplied > 0 && 
                        ` (-${submission.submission.latePenaltyApplied}pts)`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resposta do Aluno */}
          {submission.submission.comment && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">Resposta do Aluno</h3>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="whitespace-pre-wrap">{submission.submission.comment}</p>
              </div>
            </div>
          )}

          {/* Arquivos Anexados */}
          {submission.files.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold">Arquivos Anexados ({submission.files.length})</h3>
              </div>
              <div className="space-y-2">
                {submission.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.fileType)}
                      <div>
                        <p className="font-medium">{file.originalFileName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.fileSize)} • {format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {file.fileType.startsWith('image/') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/submissions/files/${file.id}/view`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avaliação */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-lg">Avaliação</h3>
              </div>
              {submission.submission.status === 'graded' && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
              {submission.submission.status === 'graded' && !isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nota</p>
                      <p className="text-2xl font-bold">
                        {submission.submission.finalGrade?.toFixed(1) || submission.submission.grade?.toFixed(1) || 0}
                        <span className="text-sm text-gray-600">/{activity.maxGrade}</span>
                      </p>
                      {submission.submission.latePenaltyApplied > 0 && (
                        <p className="text-sm text-red-600">
                          Nota original: {submission.submission.grade?.toFixed(1)} 
                          (-{submission.submission.latePenaltyApplied} penalidade)
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avaliado em</p>
                      <p className="font-medium">
                        {submission.submission.gradedAt && 
                          format(new Date(submission.submission.gradedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        }
                      </p>
                    </div>
                  </div>
                  
                  {submission.submission.feedback && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Feedback</p>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="whitespace-pre-wrap">{submission.submission.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grade">Nota (0 a {activity.maxGrade})</Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max={activity.maxGrade}
                        step="0.1"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="Digite a nota"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="feedback">Feedback (Opcional)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Escreva um feedback para o aluno..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setGrade(submission.submission.grade?.toString() || '');
                          setFeedback(submission.submission.feedback || '');
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                    <Button
                      onClick={handleGradeSubmit}
                      disabled={isGrading || !grade}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isGrading ? (
                        'Salvando...'
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          {isEditing ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
