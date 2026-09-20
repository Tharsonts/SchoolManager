import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FileText, Clock, Calendar, Send, Upload, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  points: number;
  status: 'pendente' | 'submitted' | 'graded';
  submission?: {
    content: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
  };
}

interface StudentActivityViewProps {
  activity: Activity;
  onSubmissionUpdate: () => void;
}

export function StudentActivityView({ activity, onSubmissionUpdate }: StudentActivityViewProps) {
  const [submissionText, setSubmissionText] = useState(activity.submission?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-orange-600 border-orange-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
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

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      toast.error('Por favor, escreva sua resposta antes de enviar');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/activities/${activity.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: submissionText,
          submittedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast.success('Atividade entregue com sucesso!');
        onSubmissionUpdate();
      } else {
        throw new Error('Erro ao entregar atividade');
      }
    } catch (error) {
      toast.error('Erro ao entregar atividade. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const isOverdue = new Date(activity.dueDate) < new Date() && activity.status === 'pendente';
  const canSubmit = activity.status === 'pendente';

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Atividade */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
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
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(activity.status)}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Atrasada
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">{activity.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Área de Entrega */}
      {canSubmit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sua Resposta</CardTitle>
            <CardDescription>
              Escreva sua resposta para esta atividade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission">Resposta *</Label>
              <Textarea
                id="submission"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                rows={8}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Anexar Arquivo (Opcional)</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !submissionText.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Enviando...' : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Entregar Atividade
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Atividade Já Entregue */}
      {activity.status === 'submitted' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-blue-600">Atividade Entregue</CardTitle>
            <CardDescription>
              Entregue em {format(new Date(activity.submission!.submittedAt), "PPP 'às' HH:mm", { locale: ptBR })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{activity.submission!.content}</p>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              Aguardando avaliação do professor...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Atividade Avaliada */}
      {activity.status === 'graded' && activity.submission && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-green-600">Sua Entrega</CardTitle>
              <CardDescription>
                Entregue em {format(new Date(activity.submission.submittedAt), "PPP 'às' HH:mm", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{activity.submission.content}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="font-medium">Nota:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {activity.submission.grade}/{activity.points}
                  </span>
                </div>
                
                {activity.submission.feedback && (
                  <div className="space-y-2">
                    <Label>Feedback do Professor:</Label>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{activity.submission.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Atividade Atrasada */}
      {isOverdue && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Atividade em Atraso</p>
                <p className="text-sm text-red-500">
                  O prazo de entrega foi {format(new Date(activity.dueDate), "PPP 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}