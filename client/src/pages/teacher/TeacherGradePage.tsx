import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  Clock,
  Download,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useRoute, Link } from 'wouter';

const TeacherGradePage = () => {
  const [match, params] = useRoute('/teacher/activities/:id/grade');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [grades, setGrades] = useState<{[key: string]: {grade: number, feedback: string}}>({});

  // Mock data - em produção viria da API
  const activity = {
    id: params?.id || '1',
    title: 'Trabalho sobre Sistema Solar',
    description: 'Pesquisa detalhada sobre os planetas do sistema solar',
    subject: 'Ciências',
    class: '7º Ano A',
    dueDate: '2024-01-15',
    maxGrade: 10,
    totalSubmissions: 25,
    gradedSubmissions: 18,
    pendingSubmissions: 7
  };

  const submissions = [
    {
      id: '1',
      studentName: 'Ana Silva',
      studentId: 'std001',
      submittedAt: '2024-01-14 14:30',
      status: 'submitted',
      isLate: false,
      files: [
        { name: 'trabalho_sistema_solar.pdf', size: '2.5 MB' },
        { name: 'apresentacao.pptx', size: '5.1 MB' }
      ],
      grade: null,
      feedback: ''
    },
    {
      id: '2',
      studentName: 'Bruno Santos',
      studentId: 'std002',
      submittedAt: '2024-01-15 16:45',
      status: 'graded',
      isLate: true,
      files: [
        { name: 'pesquisa_planetas.docx', size: '1.8 MB' }
      ],
      grade: 8.5,
      feedback: 'Bom trabalho! Poderia ter explorado mais sobre as luas dos planetas.'
    },
    {
      id: '3',
      studentName: 'Carla Oliveira',
      studentId: 'std003',
      submittedAt: '2024-01-13 10:20',
      status: 'graded',
      isLate: false,
      files: [
        { name: 'sistema_solar_completo.pdf', size: '3.2 MB' },
        { name: 'imagens_planetas.zip', size: '8.7 MB' }
      ],
      grade: 9.5,
      feedback: 'Excelente trabalho! Muito bem estruturado e com ótimas imagens.'
    },
    {
      id: '4',
      studentName: 'Diego Costa',
      studentId: 'std004',
      submittedAt: '2024-01-14 20:15',
      status: 'submitted',
      isLate: false,
      files: [
        { name: 'trabalho_ciencias.pdf', size: '1.9 MB' }
      ],
      grade: null,
      feedback: ''
    }
  ];

  const handleGradeSubmission = (submissionId: string, grade: number, feedback: string) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: { grade, feedback }
    }));
    // Aqui faria a chamada para a API para salvar a nota
    console.log('Salvando nota:', { submissionId, grade, feedback });
  };

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === 'graded') {
      return <Badge variant="default" className="bg-green-100 text-green-800">Avaliado</Badge>;
    }
    if (isLate) {
      return <Badge variant="destructive">Atrasado</Badge>;
    }
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const selectedSubmissionData = submissions.find(s => s.id === selectedSubmission);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/teacher/activities">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Atividades
              </Button>
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{activity.title}</h1>
                <p className="text-gray-600 mb-4">{activity.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {activity.subject}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {activity.class}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Prazo: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{activity.maxGrade}</div>
                <div className="text-sm text-gray-500">Nota máxima</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Submissões</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.totalSubmissions}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avaliadas</p>
                  <p className="text-2xl font-bold text-green-600">{activity.gradedSubmissions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{activity.pendingSubmissions}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Submissões */}
          <Card>
            <CardHeader>
              <CardTitle>Submissões dos Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSubmission === submission.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedSubmission(submission.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                        <p className="text-sm text-gray-500">ID: {submission.studentId}</p>
                      </div>
                      {getStatusBadge(submission.status, submission.isLate)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(submission.submittedAt).toLocaleString('pt-BR')}
                      </span>
                      <span>{submission.files.length} arquivo(s)</span>
                    </div>

                    {submission.grade && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-gray-900">
                          Nota: {submission.grade}/{activity.maxGrade}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Painel de Avaliação */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSubmissionData ? `Avaliar - ${selectedSubmissionData.studentName}` : 'Selecione uma submissão'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSubmissionData ? (
                <div className="space-y-6">
                  {/* Arquivos */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Arquivos Enviados
                    </Label>
                    <div className="space-y-2">
                      {selectedSubmissionData.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">({file.size})</span>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Avaliação */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="grade" className="text-sm font-medium text-gray-700">
                        Nota (0 a {activity.maxGrade})
                      </Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max={activity.maxGrade}
                        step="0.1"
                        placeholder="Digite a nota"
                        defaultValue={selectedSubmissionData.grade || ''}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                        Feedback
                      </Label>
                      <Textarea
                        id="feedback"
                        placeholder="Escreva um feedback para o aluno..."
                        defaultValue={selectedSubmissionData.feedback}
                        className="mt-1"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          const gradeInput = document.getElementById('grade') as HTMLInputElement;
                          const feedbackInput = document.getElementById('feedback') as HTMLTextAreaElement;
                          handleGradeSubmission(
                            selectedSubmissionData.id,
                            parseFloat(gradeInput.value),
                            feedbackInput.value
                          );
                        }}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar Avaliação
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecione uma submissão para avaliar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherGradePage;