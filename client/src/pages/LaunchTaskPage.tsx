import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCreateActivity } from '@/hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  Target, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Upload,
  Link,
  Image as ImageIcon
} from 'lucide-react';
import { useLocation } from 'wouter';

const LaunchTaskPage: React.FC = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const createActivity = useCreateActivity();

  // Estado do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxGrade: '10',
    dueDate: '',
    instructions: '',
    requirements: '',
    allowLateSubmission: false,
    latePenalty: '0'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determinar disciplina baseado no email
  const getTeacherSubject = (email: string) => {
    if (email.includes('mat')) return { 
      name: 'Matemática', 
      code: 'MAT', 
      color: 'bg-blue-100 text-blue-800',
      id: 'mat_001'
    };
    if (email.includes('port')) return { 
      name: 'Português', 
      code: 'PORT', 
      color: 'bg-green-100 text-green-800',
      id: 'port_001'
    };
    if (email.includes('hist')) return { 
      name: 'História', 
      code: 'HIST', 
      color: 'bg-purple-100 text-purple-800',
      id: 'hist_001'
    };
    if (email.includes('cien')) return { 
      name: 'Ciências', 
      code: 'CIEN', 
      color: 'bg-orange-100 text-orange-800',
      id: 'cien_001'
    };
    if (email.includes('ing')) return { 
      name: 'Inglês', 
      code: 'ING', 
      color: 'bg-red-100 text-red-800',
      id: 'ing_001'
    };
    return { 
      name: 'Disciplina', 
      code: 'DISC', 
      color: 'bg-gray-100 text-gray-800',
      id: 'mat_001'
    };
  };

  const teacherSubject = getTeacherSubject(user?.email || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        subjectId: teacherSubject.id,
        classId: 'turma_1a', // Turma fixa
        dueDate: formData.dueDate,
        maxGrade: Number(formData.maxGrade),
        instructions: formData.instructions,
        requirements: formData.requirements,
        allowLateSubmission: formData.allowLateSubmission,
        latePenalty: Number(formData.latePenalty)
      };

      await createActivity.mutateAsync(taskData);
      
      // Redirecionar para o dashboard
      navigate('/activities');
    } catch (error) {
      console.error('Erro ao lançar tarefa:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <MainLayout pageTitle="Lançar Nova Tarefa">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/activities')}
            className="hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Título da Página */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Lançar Nova Tarefa
          </h1>
          <p className="text-slate-600">
            Crie uma nova tarefa educacional para seus alunos
          </p>
        </div>

        {/* Informações do Professor */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${teacherSubject.color}`}>
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-slate-600">
                  Professor de <span className="font-semibold">{teacherSubject.name}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulário da Tarefa */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Informações da Tarefa</span>
              </CardTitle>
              <CardDescription>
                Defina os detalhes principais da tarefa educacional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Tarefa *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Resolução de Equações do 2º Grau"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGrade">Nota Máxima *</Label>
                  <Input
                    id="maxGrade"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxGrade}
                    onChange={(e) => handleInputChange('maxGrade', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Tarefa *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o que será avaliado, os objetivos de aprendizagem e os critérios de avaliação..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Disciplina e Turma (Pré-selecionadas) */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span>Disciplina e Turma</span>
              </CardTitle>
              <CardDescription>
                Informações acadêmicas da tarefa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Disciplina</Label>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border">
                    <div className={`p-2 rounded-full ${teacherSubject.color}`}>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{teacherSubject.name}</p>
                      <p className="text-sm text-slate-600">Código: {teacherSubject.code}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      Selecionada
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Turma</Label>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-800">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">1º Ano A</p>
                      <p className="text-sm text-slate-600">Turma Principal</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      Selecionada
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prazo e Configurações */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span>Prazo e Configurações</span>
              </CardTitle>
              <CardDescription>
                Defina o prazo e as regras de entrega
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Entrega *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="latePenalty">Penalidade por Atraso (pontos)</Label>
                  <Input
                    id="latePenalty"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.latePenalty}
                    onChange={(e) => handleInputChange('latePenalty', e.target.value)}
                    disabled={!formData.allowLateSubmission}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Switch
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                />
                <Label htmlFor="allowLateSubmission">
                  Permitir entrega após o prazo
                </Label>
              </div>
              
              {formData.allowLateSubmission && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-orange-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Entregas tardias serão aceitas com penalidade de {formData.latePenalty} pontos
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instruções e Requisitos */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span>Instruções e Requisitos</span>
              </CardTitle>
              <CardDescription>
                Orientações específicas para os alunos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções para os Alunos</Label>
                <Textarea
                  id="instructions"
                  placeholder="Forneça instruções claras sobre como realizar a tarefa, formato esperado, recursos necessários..."
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requirements">Requisitos da Tarefa</Label>
                <Textarea
                  id="requirements"
                  placeholder="Especifique os requisitos mínimos, critérios de avaliação, formato de entrega..."
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/activities')}
              className="hover:bg-slate-50"
            >
              Cancelar
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                className="hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Salvar como Rascunho
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Lançando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Lançar Tarefa
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default LaunchTaskPage;


