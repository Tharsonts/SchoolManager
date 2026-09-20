import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  BookOpen,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

export default function CoordinatorActivities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('todas');
  const [classFilter, setClassFilter] = useState('todas');
  
  // Estados para modais
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Buscar atividades reais da API
  const { data: activitiesData, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['coordinator-activities'],
    queryFn: async () => {
      console.log('🔄 Fazendo chamada para API de atividades do coordenador...');
      const response = await fetch('/api/coordinator/activities', {
        credentials: 'include'
      });
      console.log('📡 Resposta da API:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na API:', errorText);
        throw new Error('Erro ao buscar atividades');
      }
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      return data;
    }
  });

  const activities = activitiesData?.data || [];

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await fetch('/api/subjects');
      if (!response.ok) throw new Error('Erro ao buscar disciplinas');
      return response.json();
    }
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      return response.json();
    }
  });

  // Buscar arquivos da atividade selecionada
  const { data: activityFiles = [] } = useQuery({
    queryKey: ['activity-files', selectedActivity?.id],
    queryFn: async () => {
      if (!selectedActivity?.id) return [];
      const response = await fetch(`/api/activities/${selectedActivity.id}/files`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedActivity?.id
  });

  // Funções para lidar com botões
  const handleViewDetails = (activity: any) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };




  const filteredActivities = activities.filter((activity: any) => {
    const matchesSearch = activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.teacherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = subjectFilter === 'todas' || activity.subjectName === subjectFilter;
    const matchesClass = classFilter === 'todas' || activity.className === classFilter;

    return matchesSearch && matchesSubject && matchesClass;
  });

  if (activitiesLoading) {
    return (
      <MainLayout pageTitle="Atividades da Escola">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando atividades...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (activitiesError) {
    return (
      <MainLayout pageTitle="Atividades da Escola">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Erro ao carregar atividades</h2>
            <p className="text-gray-600 mb-4">Não foi possível buscar as atividades da escola.</p>
            <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Atividades da Escola">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Atividades da Escola</h1>
            <p className="text-gray-600 mt-2">
              Gerencie e monitore todas as atividades pedagógicas desenvolvidas pelos professores
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Atividades</p>
                <p className="text-2xl font-bold">{activities.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atividades Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {activities.filter((a: any) => a.isActive !== false).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar atividades, professores OU matérias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>


            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {subjects.map((subject: any) => (
                  <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {classes.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Mais Filtros
            </Button>
          </div>
        </Card>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity: any) => (
              <Card key={activity.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{activity.title || 'Atividade sem título'}</h3>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{activity.description || 'Sem descrição'}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Professor:</span>
                        <span className={activity.teacherName ? 'text-gray-900' : 'text-red-500'}>
                          {activity.teacherName || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Matéria:</span>
                        <span className={activity.subjectName ? 'text-gray-900' : 'text-red-500'}>
                          {activity.subjectName || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Turma:</span>
                        <span className={activity.className ? 'text-gray-900' : 'text-red-500'}>
                          {activity.className || 'Não informado'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Criada em:</span>
                        <p className="text-gray-600">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Prazo:</span>
                        <p className="text-gray-600">
                          {activity.dueDate ? new Date(activity.dueDate).toLocaleDateString('pt-BR') : 'Não definido'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(activity)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-600">
                {activities.length === 0 
                  ? 'Não há atividades cadastradas no sistema ainda.'
                  : 'Não há atividades que correspondam aos filtros selecionados.'
                }
              </p>
            </Card>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Exibindo {filteredActivities.length} de {activities.length} atividades
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              Próximo
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Ver Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedActivity?.title}</DialogTitle>
            <DialogDescription>
              Detalhes completos da atividade educacional
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-6">
              {/* Data de criação */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Criada em {new Date(selectedActivity.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Descrição */}
              <div>
                <Label className="text-base font-semibold">Descrição</Label>
                <p className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {selectedActivity.description || 'Descrição não disponível'}
                </p>
              </div>

              {/* Informações da atividade */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold">Professor Responsável</Label>
                  <p className={`text-lg ${selectedActivity.teacherName ? 'text-gray-900' : 'text-red-500'}`}>
                    {selectedActivity.teacherName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Disciplina</Label>
                  <p className={`text-lg ${selectedActivity.subjectName ? 'text-gray-900' : 'text-red-500'}`}>
                    {selectedActivity.subjectName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Turma</Label>
                  <p className={`text-lg ${selectedActivity.className ? 'text-gray-900' : 'text-red-500'}`}>
                    {selectedActivity.className || 'Não informado'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Data de Entrega</Label>
                  <p className={`text-lg font-semibold ${selectedActivity.dueDate ? 'text-red-600' : 'text-orange-500'}`}>
                    {selectedActivity.dueDate ? new Date(selectedActivity.dueDate).toLocaleDateString('pt-BR') : 'Não definida'}
                  </p>
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold">Status</Label>
                  <Badge 
                    variant={selectedActivity.status === 'active' ? 'default' : 'secondary'}
                    className={selectedActivity.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {selectedActivity.status === 'active' ? 'Ativa' : selectedActivity.status || 'Indefinido'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Status da Atividade</Label>
                  <p className="text-lg font-semibold text-blue-600">
                    {selectedActivity.status === 'active' ? 'Ativa' : selectedActivity.status || 'Indefinido'}
                  </p>
                </div>
              </div>

              {/* Arquivos anexados */}
              <div>
                <Label className="text-base font-semibold">Arquivos Anexados</Label>
                <div className="mt-2">
                  {activityFiles.length > 0 ? (
                    <div className="space-y-2">
                      {activityFiles.map((file: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              📎
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{file.originalFileName || file.fileName}</p>
                              <p className="text-sm text-gray-500">
                                {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Tamanho não disponível'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/api/activities/files/${file.id}/download`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-500">Nenhum arquivo anexado a esta atividade</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}