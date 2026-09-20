import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Settings, Users, Brain, Microscope, Presentation, FolderOpen, Eye, Code, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApi } from '@/hooks/useApi';
import { ActivityType, QuizConfig, CollaborativeProjectConfig, VirtualLabConfig, PresentationConfig, PortfolioConfig, CodingChallengeConfig, DiscussionConfig } from '@/shared/advanced-types';
import { toast } from 'sonner';

interface AdvancedActivityCreatorProps {
  onActivityCreated?: (activity: any) => void;
  onCancel?: () => void;
}

const activityTypeIcons: Record<string, React.ReactNode> = {
  quiz_interactive: <Brain className="w-5 h-5" />,
  collaborative_project: <Users className="w-5 h-5" />,
  virtual_lab: <Microscope className="w-5 h-5" />,
  interactive_presentation: <Presentation className="w-5 h-5" />,
  digital_portfolio: <FolderOpen className="w-5 h-5" />,
  peer_review: <Eye className="w-5 h-5" />,
  coding_challenge: <Code className="w-5 h-5" />,
  discussion_forum: <MessageSquare className="w-5 h-5" />
};

export function AdvancedActivityCreator({ onActivityCreated, onCancel }: AdvancedActivityCreatorProps) {
  const { request } = useApi();
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dados básicos da atividade
  const [basicData, setBasicData] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: undefined as Date | undefined,
    maxScore: 100,
    instructions: ''
  });
  
  // Tipo de atividade selecionado
  const [selectedType, setSelectedType] = useState<string>('');
  
  // Configurações específicas por tipo
  const [quizConfig, setQuizConfig] = useState<Partial<QuizConfig>>({
    timeLimit: 60,
    allowMultipleAttempts: false,
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleOptions: true,
    showCorrectAnswers: true,
    showExplanations: true,
    passingScore: 70,
    questions: []
  });
  
  const [projectConfig, setProjectConfig] = useState<Partial<CollaborativeProjectConfig>>({
    allowTeamFormation: true,
    maxTeamSize: 4,
    minTeamSize: 2,
    requiresPeerReview: false,
    phases: [],
    deliverables: []
  });
  
  const [labConfig, setLabConfig] = useState<Partial<VirtualLabConfig>>({
    objectives: [],
    equipment: [],
    procedures: [],
    safetyNotes: []
  });
  
  const [presentationConfig, setPresentationConfig] = useState<Partial<PresentationConfig>>({
    allowAudience: true,
    enablePolls: true,
    enableQA: true,
    enableChat: true,
    recordSession: false,
    maxDuration: 30
  });
  
  const [portfolioConfig, setPortfolioConfig] = useState<Partial<PortfolioConfig>>({
    allowReflections: true,
    requiresApproval: false,
    publicView: false,
    sections: [],
    categories: []
  });
  
  const [codingConfig, setCodingConfig] = useState<Partial<CodingChallengeConfig>>({
    language: 'javascript',
    difficulty: 'beginner',
    timeLimit: 120,
    testCases: [],
    allowedLibraries: []
  });
  
  const [discussionConfig, setDiscussionConfig] = useState<Partial<DiscussionConfig>>({
    allowAnonymous: false,
    requireModeration: true,
    enableVoting: true,
    enableThreads: true,
    maxPostLength: 1000,
    topics: []
  });

  useEffect(() => {
    loadActivityTypes();
  }, []);

  const loadActivityTypes = async () => {
    try {
      const response = await request('/api/activity-types');
      setActivityTypes(response);
    } catch (error) {
      console.error('Erro ao carregar tipos de atividade:', error);
      toast.error('Erro ao carregar tipos de atividade');
    }
  };

  const handleCreateActivity = async () => {
    if (!basicData.title || !selectedType) {
      toast.error('Título e tipo de atividade são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Criar atividade básica
      const activityData = {
        title: basicData.title,
        description: basicData.description,
        subjectId: basicData.subjectId,
        classId: basicData.classId,
        dueDate: basicData.dueDate?.toISOString(),
        maxScore: basicData.maxScore,
        instructions: basicData.instructions,
        type: 'advanced'
      };

      const activityResponse = await request('/api/activities', {
        method: 'POST',
        body: JSON.stringify(activityData)
      });

      // Configurar tipo específico
      let config = {};
      switch (selectedType) {
        case 'quiz_interactive':
          config = quizConfig;
          break;
        case 'collaborative_project':
          config = projectConfig;
          break;
        case 'virtual_lab':
          config = labConfig;
          break;
        case 'interactive_presentation':
          config = presentationConfig;
          break;
        case 'digital_portfolio':
          config = portfolioConfig;
          break;
        case 'coding_challenge':
          config = codingConfig;
          break;
        case 'discussion_forum':
          config = discussionConfig;
          break;
      }

      await request(`/api/activities/${activityResponse.activityId}/config`, {
        method: 'POST',
        body: JSON.stringify({
          typeId: selectedType,
          configData: config
        })
      });

      toast.success('Atividade criada com sucesso!');
      onActivityCreated?.(activityResponse);
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      toast.error('Erro ao criar atividade');
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSpecificConfig = () => {
    switch (selectedType) {
      case 'quiz_interactive':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Configurações do Quiz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timeLimit">Tempo Limite (minutos)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={quizConfig.timeLimit || ''}
                    onChange={(e) => setQuizConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAttempts">Máximo de Tentativas</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={quizConfig.maxAttempts || ''}
                    onChange={(e) => setQuizConfig(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowMultiple">Permitir Múltiplas Tentativas</Label>
                  <Switch
                    id="allowMultiple"
                    checked={quizConfig.allowMultipleAttempts}
                    onCheckedChange={(checked) => setQuizConfig(prev => ({ ...prev, allowMultipleAttempts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="shuffleQuestions">Embaralhar Questões</Label>
                  <Switch
                    id="shuffleQuestions"
                    checked={quizConfig.shuffleQuestions}
                    onCheckedChange={(checked) => setQuizConfig(prev => ({ ...prev, shuffleQuestions: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="showAnswers">Mostrar Respostas Corretas</Label>
                  <Switch
                    id="showAnswers"
                    checked={quizConfig.showCorrectAnswers}
                    onCheckedChange={(checked) => setQuizConfig(prev => ({ ...prev, showCorrectAnswers: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'collaborative_project':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Configurações do Projeto Colaborativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minTeamSize">Tamanho Mínimo da Equipe</Label>
                  <Input
                    id="minTeamSize"
                    type="number"
                    value={projectConfig.minTeamSize || ''}
                    onChange={(e) => setProjectConfig(prev => ({ ...prev, minTeamSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxTeamSize">Tamanho Máximo da Equipe</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    value={projectConfig.maxTeamSize || ''}
                    onChange={(e) => setProjectConfig(prev => ({ ...prev, maxTeamSize: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowTeamFormation">Permitir Formação de Equipes</Label>
                  <Switch
                    id="allowTeamFormation"
                    checked={projectConfig.allowTeamFormation}
                    onCheckedChange={(checked) => setProjectConfig(prev => ({ ...prev, allowTeamFormation: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="requiresPeerReview">Requer Avaliação por Pares</Label>
                  <Switch
                    id="requiresPeerReview"
                    checked={projectConfig.requiresPeerReview}
                    onCheckedChange={(checked) => setProjectConfig(prev => ({ ...prev, requiresPeerReview: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
        
      case 'coding_challenge':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Configurações do Desafio de Programação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Linguagem de Programação</Label>
                  <Select value={codingConfig.language} onValueChange={(value) => setCodingConfig(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select value={codingConfig.difficulty} onValueChange={(value: any) => setCodingConfig(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="codingTimeLimit">Tempo Limite (minutos)</Label>
                <Input
                  id="codingTimeLimit"
                  type="number"
                  value={codingConfig.timeLimit || ''}
                  onChange={(e) => setCodingConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                />
              </div>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Criar Atividade Avançada</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCreateActivity} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Atividade'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="type">Tipo de Atividade</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Atividade</Label>
                <Input
                  id="title"
                  value={basicData.title}
                  onChange={(e) => setBasicData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título da atividade"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={basicData.description}
                  onChange={(e) => setBasicData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a atividade"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxScore">Pontuação Máxima</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={basicData.maxScore}
                    onChange={(e) => setBasicData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>Data de Entrega</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {basicData.dueDate ? format(basicData.dueDate, 'PPP', { locale: ptBR }) : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={basicData.dueDate}
                        onSelect={(date) => setBasicData(prev => ({ ...prev, dueDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div>
                <Label htmlFor="instructions">Instruções</Label>
                <Textarea
                  id="instructions"
                  value={basicData.instructions}
                  onChange={(e) => setBasicData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instruções detalhadas para os alunos"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="type" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Tipo de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activityTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedType === type.id ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="text-2xl">
                        {activityTypeIcons[type.id] || <Settings className="w-5 h-5" />}
                      </div>
                      <h3 className="font-medium text-sm">{type.name}</h3>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4">
          {selectedType ? (
            renderTypeSpecificConfig()
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um tipo de atividade para configurar</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}