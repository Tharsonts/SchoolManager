import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  BookOpen, 
  Users, 
  Trophy, 
  BarChart3, 
  Filter, 
  Search,
  Grid,
  List,
  Star,
  Clock,
  Target,
  Brain,
  Code,
  PenTool,
  MessageSquare,
  Eye,
  FileText,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { toast } from 'sonner';
import { SimpleActivityCreator } from '@/components/activities/SimpleActivityCreator';
import { StudentActivityView } from '@/components/activities/StudentActivityView';
import { TeacherGradingView } from '@/components/activities/TeacherGradingView';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'project' | 'coding' | 'essay' | 'presentation';
  difficulty: number;
  points: number;
  dueDate: string;
  status: 'draft' | 'published' | 'completed' | 'graded';
  submissions: number;
  maxSubmissions: number;
  averageScore?: number;
  tags: string[];
  rubricId?: string;
  teamBased: boolean;
  allowLateSubmission: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  studentsCount: number;
}

export default function AdvancedActivitiesPage() {
  const { user } = useAuth();
  const { request } = useApi();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('activities');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedType, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activitiesRes, classesRes] = await Promise.all([
        request('/api/activities/advanced', {
          method: 'GET',
          params: {
            classId: selectedClass !== 'all' ? selectedClass : undefined,
            type: selectedType !== 'all' ? selectedType : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            search: searchTerm || undefined
          }
        }),
        request('/api/classes')
      ]);
      
      setActivities(activitiesRes);
      setClasses(classesRes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz': return <Brain className="w-5 h-5" />;
      case 'project': return <Target className="w-5 h-5" />;
      case 'coding': return <Code className="w-5 h-5" />;
      case 'essay': return <PenTool className="w-5 h-5" />;
      case 'presentation': return <MessageSquare className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'graded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${
          i < difficulty ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`} 
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const renderActivityCard = (activity: Activity) => (
    <Card key={activity.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getActivityIcon(activity.type)}
            <CardTitle className="text-lg">{activity.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(activity.status)}>
              {activity.status === 'draft' ? 'Rascunho' :
               activity.status === 'published' ? 'Publicada' :
               activity.status === 'completed' ? 'Concluída' : 'Avaliada'}
            </Badge>
            {activity.teamBased && (
              <Badge variant="outline">
                <Users className="w-3 h-3 mr-1" />
                Equipe
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{activity.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {getDifficultyStars(activity.difficulty)}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{activity.points} pts</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Prazo: {formatDate(activity.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{activity.submissions}/{activity.maxSubmissions}</span>
          </div>
        </div>
        
        {activity.averageScore !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span>Nota média:</span>
            <Badge variant="secondary">{activity.averageScore.toFixed(1)}%</Badge>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {activity.tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {activity.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{activity.tags.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          {isTeacher && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setSelectedActivity(activity)}
              >
                Editar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setSelectedActivity(activity);
                  setActiveTab('details');
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Avaliar
              </Button>
            </>
          )}
          {isStudent && (
            <Button 
              size="sm" 
              onClick={() => {
                setSelectedActivity(activity);
                setActiveTab('details');
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              {activity.status === 'completed' ? 'Ver Submissão' : 'Enviar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderActivityList = (activity: Activity) => (
    <Card key={activity.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              {getActivityIcon(activity.type)}
              <div>
                <h3 className="font-medium">{activity.title}</h3>
                <p className="text-sm text-gray-500">{activity.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(activity.status)}>
                {activity.status === 'draft' ? 'Rascunho' :
                 activity.status === 'published' ? 'Publicada' :
                 activity.status === 'completed' ? 'Concluída' : 'Avaliada'}
              </Badge>
              
              <div className="flex items-center gap-1">
                {getDifficultyStars(activity.difficulty)}
              </div>
              
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">{activity.points} pts</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{formatDate(activity.dueDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isTeacher && (
              <>
                <Button size="sm" variant="outline">
                  Editar
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </>
            )}
            {isStudent && (
              <Button size="sm">
                {activity.status === 'completed' ? 'Ver' : 'Enviar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Atividades</h1>
          <p className="text-gray-600 mt-1">
            Gerencie atividades, entregas e avaliações
          </p>
        </div>
        
        {isTeacher && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Atividade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Atividade</DialogTitle>
              </DialogHeader>
              <SimpleActivityCreator 
                onActivityCreated={() => {
                  setShowCreateDialog(false);
                  loadData();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${selectedActivity ? (isTeacher ? 'grid-cols-3' : 'grid-cols-2') : 'grid-cols-1'}`}>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {isTeacher ? 'Minhas Atividades' : 'Atividades'}
          </TabsTrigger>
          {selectedActivity && (
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {isTeacher ? 'Avaliar' : 'Detalhes'}
            </TabsTrigger>
          )}
          {isTeacher && (
            <TabsTrigger value="grading" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Avaliações
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="activities" className="space-y-6">
          {/* Filtros e controles */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar atividades..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border rounded-md w-64"
                  />
                </div>
                
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Selecionar turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo de atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="quiz">Quiz Interativo</SelectItem>
                    <SelectItem value="project">Projeto Colaborativo</SelectItem>
                    <SelectItem value="coding">Desafio de Programação</SelectItem>
                    <SelectItem value="essay">Redação</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="graded">Avaliada</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de atividades */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Carregando atividades...</p>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma atividade encontrada</p>
                  <p className="text-sm">Tente ajustar os filtros ou criar uma nova atividade</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
              'space-y-4'
            }>
              {filteredActivities.map(activity => 
                viewMode === 'grid' ? renderActivityCard(activity) : renderActivityList(activity)
              )}
            </div>
          )}
        </TabsContent>

        {selectedActivity && (
          <TabsContent value="details" className="space-y-6">
            {isTeacher ? (
              <TeacherGradingView 
                activity={selectedActivity}
                onGradingUpdate={loadData}
              />
            ) : (
              <StudentActivityView 
                activity={selectedActivity}
                onSubmissionUpdate={loadData}
              />
            )}
          </TabsContent>
        )}

        {isTeacher && (
          <TabsContent value="grading" className="space-y-6">
            {selectedActivity ? (
              <TeacherGradingView 
                activity={selectedActivity}
                onGradingUpdate={loadData}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Central de Avaliações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Clique em "Avaliar" em qualquer atividade para começar</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}