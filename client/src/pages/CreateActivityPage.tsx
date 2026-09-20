import { useState } from "react";
// Removido MainLayout - usando TeacherLayout da rota
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useCreateActivity, useTeacherSubjects, useTeacherClasses } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Calendar, BookOpen, Users, FileText, Clock, Upload, X, Image, File } from "lucide-react";
import { useLocation } from "wouter";
import TeacherActivityConfirmModal from "../components/TeacherActivityConfirmModal";
import { useQuery } from "@tanstack/react-query";

export default function CreateActivityPage() {
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
    instructions: '',
    requirements: '',
    allowLateSubmission: false,
    latePenalty: 0
  });
  
  // Estado para arquivos anexados
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  // Estado para o modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hooks da API
  const createActivityMutation = useCreateActivity();
  
  // Hook para turmas do professor (formato simples para seletores)
  const { data: classesData, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['teacher-classes-simple', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes`, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      const data = await response.json();
      
      // Transformar dados para formato simples de seletor
      const simpleClasses = data.data?.map((item: any) => ({
        id: item.classId,
        name: item.className,
        grade: item.className.split(' ')[0] || 'N/A'
      })) || [];
      
      // Remover duplicatas por ID
      const uniqueClasses = simpleClasses.filter((cls: any, index: number, self: any[]) => 
        self.findIndex(c => c.id === cls.id) === index
      );
      
      return { data: uniqueClasses };
    },
    enabled: !!user?.id
  });
  
  // Hook para disciplinas filtradas por turma
  const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useQuery({
    queryKey: ['subjects', formData.classId],
    queryFn: async () => {
      const url = formData.classId 
        ? `/api/subjects?classId=${formData.classId}`
        : '/api/subjects';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Erro ao buscar disciplinas');
      return response.json();
    },
    enabled: !!user?.id
  });
  
  const subjects = subjectsData || [];
  const classes = classesData?.data || [];
  
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se a turma mudou, limpar a disciplina selecionada
      if (field === 'classId') {
        newData.subjectId = '';
      }
      
      return newData;
    });
  };
  
  // Função para lidar com upload de arquivos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar tamanho dos arquivos (máximo 10MB por arquivo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: `O arquivo ${file.name} excede o limite de 10MB.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    
    // Adicionar arquivos válidos à lista
    setAttachedFiles(prev => [...prev, ...validFiles]);
    
    // Limpar o input
    e.target.value = '';
  };
  
  // Função para remover arquivo
  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.subjectId || !formData.classId || !formData.dueDate || !formData.dueTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios (incluindo data e horário de entrega)",
        variant: "destructive"
      });
      return;
    }
    
    // Mostrar modal de confirmação ao invés de enviar diretamente
    setShowConfirmModal(true);
  };
  
  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    
    try {
      // Combinar data e hora para criar o datetime completo
      const dueDatetime = `${formData.dueDate}T${formData.dueTime}:00`;
      
      // Criar a atividade primeiro
      const activityResponse = await createActivityMutation.mutateAsync({
        ...formData,
        dueDate: dueDatetime, // Enviar data e hora combinadas
        maxGrade: Number(formData.maxGrade),
        latePenalty: Number(formData.latePenalty),
        files: attachedFiles // Incluir arquivos no FormData
      });
      
      // Se há arquivos anexados, mostrar mensagem de sucesso
      if (attachedFiles.length > 0) {
        toast({
          title: "Sucesso!",
          description: `Atividade criada com sucesso! ${attachedFiles.length} arquivo(s) anexado(s).`
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Atividade criada com sucesso"
        });
      }
      
      // Limpar formulário
      setFormData({
        title: '',
        description: '',
        subjectId: '',
        classId: '',
        dueDate: '',
        dueTime: '23:59',
        maxGrade: 10,
        instructions: '',
        requirements: '',
        allowLateSubmission: false,
        latePenalty: 0
      });
      
      // Limpar arquivos anexados
      setAttachedFiles([]);
      
      // Fechar modal
      setShowConfirmModal(false);
      
      // Redirecionar de volta para a página de atividades
      navigate('/teacher/activities');
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar atividade",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseModal = () => {
    if (!isSubmitting) {
      setShowConfirmModal(false);
    }
  };
  
  if (user?.role !== 'teacher') {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-gray-600 mt-2">Apenas professores podem criar atividades.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/teacher/activities')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Criar Nova Atividade</h1>
              <p className="text-gray-600 mt-1">Preencha os dados da nova atividade</p>
            </div>
          </div>
        </div>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Atividade *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Equações do 2º Grau"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxGrade">Nota Máxima *</Label>
                  <Input
                    id="maxGrade"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.maxGrade}
                    onChange={(e) => handleInputChange('maxGrade', Number(e.target.value))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva brevemente o que será avaliado"
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Disciplina e Turma */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Disciplina e Turma</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Disciplina *</Label>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => handleInputChange('subjectId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="classId">Turma *</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => handleInputChange('classId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem: any) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Prazo e Configurações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Prazo e Configurações</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="dueTime">Horário de Entrega *</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime || '23:59'}
                    onChange={(e) => handleInputChange('dueTime', e.target.value)}
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
                    onChange={(e) => handleInputChange('latePenalty', Number(e.target.value))}
                    disabled={!formData.allowLateSubmission}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onCheckedChange={(checked) => handleInputChange('allowLateSubmission', checked)}
                />
                <Label htmlFor="allowLateSubmission">
                  Permitir entrega após o prazo
                </Label>
              </div>
            </CardContent>
          </Card>
          
          {/* Anexos da Atividade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Anexos da Atividade</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Arquivos e Imagens</Label>
                <p className="text-sm text-gray-600">
                  Anexe materiais de apoio, imagens, documentos ou outros arquivos necessários para a atividade.
                </p>
                
                {/* Área de Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Clique para selecionar arquivos</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Suporte: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, MP4, MP3, ZIP, RAR
                    </p>
                  </label>
                </div>
                
                {/* Lista de Arquivos Anexados */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Arquivos Anexados ({attachedFiles.length})</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            {file.type.startsWith('image/') ? (
                              <Image className="h-5 w-5 text-blue-500" />
                            ) : (
                              <File className="h-5 w-5 text-gray-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          
          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/teacher/activities')}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Revisar e Enviar
            </Button>
          </div>
        </form>
        
        {/* Modal de Confirmação */}
        <TeacherActivityConfirmModal
          activity={formData}
          attachedFiles={attachedFiles}
          isOpen={showConfirmModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmSend}
          isSubmitting={isSubmitting}
          subjectName={subjects.find(s => s.id === formData.subjectId)?.name}
          className={classes.find(c => c.id === formData.classId)?.name}
        />
        </div>
      </div>
    );
  }


