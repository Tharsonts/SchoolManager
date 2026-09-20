import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { MainLayout } from "../components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar, BookOpen, Users, FileText, Clock, Upload, X, Image, File } from "lucide-react";
import { useLocation } from "wouter";

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  dueDate: string;
  maxGrade: number;
  allowLateSubmission: boolean;
  latePenalty: number;
  instructions?: string;
  requirements?: string;
  files?: Array<{
    id: string;
    originalFileName: string;
    fileSize: number;
    fileType: string;
  }>;
}

export default function EditActivityPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: '',
    dueTime: '23:59',
    maxGrade: 10,
    allowLateSubmission: false,
    latePenalty: 0,
    instructions: '',
    requirements: ''
  });
  
  // Estados de carregamento
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Estado para arquivos anexados
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadActivityData();
      loadSubjectsAndClasses();
    }
  }, [id]);

  const loadActivityData = async () => {
    try {
      const response = await fetch(`/api/activities/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Atividade não encontrada');
      }
      
      const activityData = await response.json();
      console.log('🔍 Dados da atividade para edição:', activityData);
      
      setActivity(activityData);
      setExistingFiles(activityData.files || []);
      
      // Parsear a data para separar data e hora
      const dueDateTime = new Date(activityData.dueDate);
      const dueDateStr = dueDateTime.toISOString().split('T')[0];
      const dueTimeStr = dueDateTime.toTimeString().substring(0, 5);
      
      setFormData({
        title: activityData.title || '',
        description: activityData.description || '',
        subjectId: activityData.subjectId || '',
        classId: activityData.classId || '',
        dueDate: dueDateStr,
        dueTime: dueTimeStr,
        maxGrade: activityData.maxGrade || 10,
        allowLateSubmission: activityData.allowLateSubmission || false,
        latePenalty: activityData.latePenalty || 0,
        instructions: activityData.instructions || '',
        requirements: activityData.requirements || ''
      });
      
    } catch (error) {
      console.error('Erro ao carregar atividade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da atividade.",
        variant: "destructive",
      });
      navigate('/teacher/activities');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjectsAndClasses = async () => {
    try {
      // Carregar disciplinas
      const subjectsResponse = await fetch('/api/subjects', {
        credentials: 'include'
      });
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData);
      }

      // Carregar turmas
      const classesResponse = await fetch('/api/classes', {
        credentials: 'include'
      });
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
    }
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/activities/${id}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setExistingFiles(prev => prev.filter(file => file.id !== fileId));
        toast({
          title: "Arquivo removido",
          description: "O arquivo foi removido com sucesso.",
        });
      } else {
        throw new Error('Erro ao remover arquivo');
      }
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o arquivo.",
        variant: "destructive",
      });
    }
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
      return <Image className="w-5 h-5 text-green-600" />;
    }
    return <File className="w-5 h-5 text-blue-600" />;
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro de validação",
        description: "O título é obrigatório.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Erro de validação",
        description: "A descrição é obrigatória.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.subjectId) {
      toast({
        title: "Erro de validação",
        description: "Selecione uma disciplina.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.classId) {
      toast({
        title: "Erro de validação",
        description: "Selecione uma turma.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.dueDate || !formData.dueTime) {
      toast({
        title: "Erro de validação",
        description: "Data e hora de entrega são obrigatórias.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Combinar data e hora
      const dueDatetime = `${formData.dueDate}T${formData.dueTime}:00`;
      
      // Atualizar dados da atividade
      const activityData = {
        title: formData.title,
        description: formData.description,
        subjectId: formData.subjectId,
        classId: formData.classId,
        dueDate: dueDatetime,
        maxGrade: Number(formData.maxGrade),
        allowLateSubmission: formData.allowLateSubmission,
        latePenalty: Number(formData.latePenalty),
        instructions: formData.instructions,
        requirements: formData.requirements
      };
      
      const response = await fetch(`/api/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(activityData),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar atividade');
      }
      
      // Upload de novos arquivos se houver
      if (attachedFiles.length > 0) {
        const formData = new FormData();
        attachedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('category', 'reference'); // Categoria padrão para arquivos de atividade
        
        const fileResponse = await fetch(`/api/activities/${id}/files`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        if (!fileResponse.ok) {
          console.warn('Alguns arquivos podem não ter sido salvos');
        }
      }
      
      toast({
        title: "Sucesso!",
        description: "Atividade atualizada com sucesso.",
      });
      
      navigate('/teacher/activities');
      
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a atividade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Carregando atividade...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!activity) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Atividade não encontrada</h2>
            <p className="text-gray-600 mb-4">A atividade que você está tentando editar não foi encontrada.</p>
            <Button onClick={() => navigate('/teacher/activities')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Atividades
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/teacher/activities')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Atividade</h1>
              <p className="text-gray-600">Atualize as informações da atividade</p>
            </div>
          </div>
        </div>

        {/* Formulário Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Atividade *</Label>
              <Input
                id="title"
                placeholder="Digite o título da atividade"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que os alunos devem fazer nesta atividade"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>

            {/* Disciplina e Turma */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) => handleInputChange('subjectId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2" />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Turma *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(value) => handleInputChange('classId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {classItem.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data, Hora e Pontuação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Entrega *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueTime">Hora de Entrega *</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => handleInputChange('dueTime', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxGrade">Pontuação Máxima</Label>
                <Input
                  id="maxGrade"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxGrade}
                  onChange={(e) => handleInputChange('maxGrade', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Submissão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Configurações de Submissão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir submissões em atraso</Label>
                <p className="text-sm text-gray-600">
                  Os alunos poderão entregar a atividade após o prazo
                </p>
              </div>
              <Switch
                checked={formData.allowLateSubmission}
                onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
              />
            </div>

            {formData.allowLateSubmission && (
              <div className="space-y-2">
                <Label htmlFor="latePenalty">Penalidade por Atraso (pontos)</Label>
                <Input
                  id="latePenalty"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.latePenalty}
                  onChange={(e) => handleInputChange('latePenalty', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-gray-600">
                  Pontos que serão descontados da nota final por submissão em atraso
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruções Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções</Label>
              <Textarea
                id="instructions"
                placeholder="Instruções específicas para os alunos (opcional)"
                rows={2}
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos</Label>
              <Textarea
                id="requirements"
                placeholder="Requisitos específicos da atividade (opcional)"
                rows={2}
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Anexos Existentes */}
        {existingFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <File className="w-5 h-5 mr-2" />
                Arquivos Anexados ({existingFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.fileType)}
                      <div>
                        <p className="font-medium">{file.originalFileName}</p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(file.fileSize)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExistingFile(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload de Novos Arquivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Adicionar Novos Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-900">
                  Clique para adicionar arquivos
                </span>
                <p className="text-gray-600 mt-1">
                  ou arraste e solte aqui
                </p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </label>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Novos arquivos para adicionar:</h4>
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAttachedFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/activities')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}




