import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  Star,
  BarChart3,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { TeacherSubmissionInterface } from '@/components/activities/TeacherSubmissionInterface';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  maxGrade: number;
  status: string;
  allowLateSubmission: boolean;
  latePenalty: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
}

export function TeacherActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submissions');

  useEffect(() => {
    if (id) {
      fetchActivity();
    }
  }, [id]);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/activities/${id}`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data);
      } else {
        throw new Error('Atividade não encontrada');
      }
    } catch (error) {
      toast.error('Erro ao carregar atividade');
      console.error('Erro:', error);
      navigate('/teacher/activities');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Ativa</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Rascunho</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-red-600 border-red-600">Arquivada</Badge>;
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

  const isOverdue = activity ? new Date() > new Date(activity.dueDate) : false;

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
            <p className="text-gray-600 mb-4">A atividade solicitada não foi encontrada.</p>
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
      <div className="space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
              <p className="text-gray-600">{getTypeLabel(activity.type)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(activity.status)}
            <Button
              variant="outline"
              onClick={() => navigate(`/teacher/activities/${activity.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Informações da Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informações da Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Descrição</h3>
                <p className="text-gray-700">{activity.description}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <div>
                    <p className="text-sm">Prazo de Entrega</p>
                    <p className="font-medium">
                      {format(new Date(activity.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <div>
                    <p className="text-sm">Horário</p>
                    <p className="font-medium">
                      {format(new Date(activity.dueDate), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                {isOverdue && (
                  <div className="flex items-center text-red-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <div>
                      <p className="text-sm font-medium">Prazo Expirado</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pontuação Máxima</p>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{activity.maxGrade} pontos</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Submissões em Atraso</p>
                  <p className="font-medium">
                    {activity.allowLateSubmission ? (
                      <>Permitidas (penalidade: -{activity.latePenalty} pontos)</>
                    ) : (
                      'Não permitidas'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {activity.instructions && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instruções Especiais:</h4>
                <p className="text-blue-800">{activity.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs de Conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submissions" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Submissões
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <TeacherSubmissionInterface activity={activity} />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Análises e Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Análises em Desenvolvimento
                  </h3>
                  <p className="text-gray-600">
                    Em breve você poderá visualizar estatísticas detalhadas sobre o desempenho dos alunos.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações da Atividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <p className="mt-1">{getStatusBadge(activity.status)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Criada em</label>
                      <p className="mt-1 text-gray-900">
                        {format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Última atualização</label>
                      <p className="mt-1 text-gray-900">
                        {format(new Date(activity.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/teacher/activities/${activity.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Atividade
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Implementar arquivamento
                          toast.info('Funcionalidade em desenvolvimento');
                        }}
                      >
                        Arquivar Atividade
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

