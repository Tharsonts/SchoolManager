import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Calendar,
  Clock,
  FileText,
  Download,
  Star,
  AlertTriangle,
  CheckCircle,
  Save,
  X,
  Eye,
  MessageSquare
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
  id: string;
  studentId: string;
  activityId: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  status: 'submitted' | 'graded' | 'late';
  files?: SubmissionFile[];
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Activity {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxGrade: number;
  instructions?: string;
}

interface SubmissionDetailModalProps {
  submission: Submission | null;
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onGrade: (submissionId: string, grade: number, feedback: string) => Promise<void>;
}

export function SubmissionDetailModal({
  submission,
  activity,
  isOpen,
  onClose,
  onGrade
}: SubmissionDetailModalProps) {
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);
  const [showGradeForm, setShowGradeForm] = useState(false);

  React.useEffect(() => {
    if (submission) {
      setGrade(submission.grade?.toString() || '');
      setFeedback(submission.feedback || '');
      setShowGradeForm(false);
    }
  }, [submission]);

  const handleGradeSubmit = async () => {
    if (!submission || !grade) return;

    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || (activity && gradeValue > activity.maxGrade)) {
      alert(`Nota deve ser entre 0 e ${activity?.maxGrade || 10}`);
      return;
    }

    setIsGrading(true);
    try {
      await onGrade(submission.id, gradeValue, feedback);
      setShowGradeForm(false);
    } catch (error) {
      console.error('Erro ao avaliar submissão:', error);
      alert('Erro ao salvar avaliação');
    } finally {
      setIsGrading(false);
    }
  };

  const getStatusBadge = (status: string, submittedAt: string, dueDate?: string) => {
    if (status === 'graded') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Avaliada</Badge>;
    }
    
    if (dueDate && new Date(submittedAt) > new Date(dueDate)) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Atrasada</Badge>;
    }
    
    return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Entregue</Badge>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!submission || !activity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Detalhes da Submissão</span>
          </DialogTitle>
          <DialogDescription>
            {activity.title} - {submission.student.firstName} {submission.student.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Aluno */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <User className="h-4 w-4" />
                <span>Informações do Aluno</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nome</Label>
                  <p className="text-sm">{submission.student.firstName} {submission.student.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm">{submission.student.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Submissão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Calendar className="h-4 w-4" />
                <span>Informações da Entrega</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Entrega</Label>
                  <p className="text-sm">{formatDate(new Date(submission.submittedAt))}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(submission.status, submission.submittedAt, activity.dueDate)}
                  </div>
                </div>
              </div>
              
              {activity.dueDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Prazo da Atividade</Label>
                  <p className="text-sm">{formatDate(new Date(activity.dueDate))}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arquivos Enviados */}
          {submission.files && submission.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="h-4 w-4" />
                  <span>Arquivos Enviados ({submission.files.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {submission.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {formatDate(new Date(file.uploadedAt))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Visualizar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Avaliação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4" />
                  <span>Avaliação</span>
                </div>
                {submission.status !== 'graded' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGradeForm(!showGradeForm)}
                  >
                    {showGradeForm ? 'Cancelar' : 'Avaliar'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.status === 'graded' ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nota</Label>
                      <p className="text-2xl font-bold text-green-600">
                        {submission.grade}/{activity.maxGrade}
                      </p>
                    </div>
                    {submission.gradedAt && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Avaliada em</Label>
                        <p className="text-sm">{formatDate(new Date(submission.gradedAt))}</p>
                      </div>
                    )}
                  </div>
                  
                  {submission.feedback && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Feedback</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{submission.feedback}</p>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGradeForm(true)}
                  >
                    Editar Avaliação
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Esta submissão ainda não foi avaliada</p>
                </div>
              )}

              {showGradeForm && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="feedback">Feedback (opcional)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Escreva um feedback para o aluno..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleGradeSubmit}
                      disabled={isGrading || !grade}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isGrading ? 'Salvando...' : 'Salvar Avaliação'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowGradeForm(false)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}