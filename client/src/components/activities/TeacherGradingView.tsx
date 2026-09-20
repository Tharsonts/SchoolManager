import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FileText, Clock, Calendar, Send, User, Star, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
}

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  points: number;
  submissions: Submission[];
}

interface TeacherGradingViewProps {
  activity: Activity;
  onGradingUpdate: () => void;
}

export function TeacherGradingView({ activity, onGradingUpdate }: TeacherGradingViewProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('all');

  const filteredSubmissions = activity.submissions.filter(submission => {
    if (filter === 'all') return true;
    return submission.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Send className="w-3 h-3 mr-1" />Entregue</Badge>;
      case 'graded':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Avaliada</Badge>;
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

  const handleSubmissionSelect = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;
    
    if (!grade || parseInt(grade) < 0 || parseInt(grade) > activity.points) {
      toast.error(`A nota deve estar entre 0 e ${activity.points}`);
      return;
    }

    setIsGrading(true);
    
    try {
      const response = await fetch(`/api/activities/${activity.id}/submissions/${selectedSubmission.id}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade: parseInt(grade),
          feedback: feedback.trim() || undefined
        }),
      });

      if (response.ok) {
        toast.success('Avaliação salva com sucesso!');
        onGradingUpdate();
        setSelectedSubmission(null);
        setGrade('');
        setFeedback('');
      } else {
        throw new Error('Erro ao salvar avaliação');
      }
    } catch (error) {
      toast.error('Erro ao salvar avaliação. Tente novamente.');
    } finally {
      setIsGrading(false);
    }
  };

  const submittedCount = activity.submissions.filter(s => s.status === 'submitted').length;
  const gradedCount = activity.submissions.filter(s => s.status === 'graded').length;
  const totalSubmissions = activity.submissions.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Atividade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {activity.title}
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(activity.dueDate), "PPP 'às' HH:mm", { locale: ptBR })}
            </span>
            <span>{getTypeLabel(activity.type)}</span>
            <span>{activity.points} pontos</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalSubmissions}</div>
              <div className="text-sm text-blue-600">Total de Entregas</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{submittedCount}</div>
              <div className="text-sm text-orange-600">Aguardando Avaliação</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
              <div className="text-sm text-green-600">Avaliadas</div>
            </div>
          </div>
          <p className="text-gray-700">{activity.description}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Entregas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Entregas dos Alunos</CardTitle>
              <Select value={filter} onValueChange={(value: 'all' | 'submitted' | 'graded') => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="submitted">Não Avaliadas</SelectItem>
                  <SelectItem value="graded">Avaliadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSubmissions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma entrega encontrada</p>
              ) : (
                filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSubmission?.id === submission.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSubmissionSelect(submission)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{submission.studentName}</span>
                      </div>
                      {getStatusBadge(submission.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Entregue em {format(new Date(submission.submittedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {submission.grade !== undefined && (
                      <div className="text-sm font-medium text-green-600 mt-1">
                        Nota: {submission.grade}/{activity.points}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Área de Avaliação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              {selectedSubmission ? 'Avaliar Entrega' : 'Selecione uma Entrega'}
            </CardTitle>
            {selectedSubmission && (
              <CardDescription>
                Avaliando entrega de {selectedSubmission.studentName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedSubmission ? (
              <div className="space-y-4">
                {/* Conteúdo da Entrega */}
                <div className="space-y-2">
                  <Label>Resposta do Aluno:</Label>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                </div>

                <Separator />

                {/* Formulário de Avaliação */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Nota (0 a {activity.points}) *</Label>
                    <Input
                      id="grade"
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      min="0"
                      max={activity.points}
                      placeholder="Ex: 8"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Opcional)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Escreva um feedback para o aluno..."
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleGradeSubmit}
                    disabled={isGrading || !grade}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isGrading ? 'Salvando...' : 'Salvar Avaliação'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Selecione uma entrega na lista ao lado para começar a avaliar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}