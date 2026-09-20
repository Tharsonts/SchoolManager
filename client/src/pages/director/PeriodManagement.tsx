import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Edit, Trash2, Play, Square, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AcademicPeriod {
  id: string;
  name: string;
  description: string;
  period: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  isCurrent: boolean;
  totalDays: number;
  remainingDays: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const PeriodManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod | null>(null);
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    description: '',
    period: '',
    periodType: 'bimestre', // 'bimestre' ou 'semestre'
    periodNumber: '',
    academicYear: '',
    startDate: '',
    endDate: ''
  });

  const queryClient = useQueryClient();

  // Buscar períodos
  const { data: periods = [], isLoading } = useQuery<AcademicPeriod[]>({
    queryKey: ['periods'],
    queryFn: async () => {
      const response = await fetch('/api/periods', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar períodos');
      const data = await response.json();
      return data.data || [];
    }
  });

  // Criar período
  const createPeriodMutation = useMutation({
    mutationFn: async (periodData: any) => {
      const response = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(periodData)
      });
      if (!response.ok) throw new Error('Erro ao criar período');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      setShowCreateModal(false);
      setNewPeriod({ name: '', description: '', period: '', periodType: 'bimestre', periodNumber: '', academicYear: '', startDate: '', endDate: '' });
      toast.success('Período criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar período');
    }
  });

  // Atualizar período
  const updatePeriodMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erro ao atualizar período');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      setShowEditModal(false);
      setSelectedPeriod(null);
      toast.success('Período atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar período');
    }
  });

  // Iniciar período
  const startPeriodMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/periods/${id}/start`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao iniciar período');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      toast.success('Período iniciado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao iniciar período');
    }
  });

  // Encerrar período
  const endPeriodMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/periods/${id}/end`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao encerrar período');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      toast.success('Período encerrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao encerrar período');
    }
  });

  // Excluir período
  const deletePeriodMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/periods/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao excluir período');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periods'] });
      toast.success('Período excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir período');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleCreatePeriod = () => {
    // Gerar nome automaticamente baseado no número e tipo
    const periodName = `${newPeriod.periodNumber}º ${newPeriod.periodType === 'bimestre' ? 'Bimestre' : 'Semestre'} ${newPeriod.academicYear}`;
    
    const periodData = {
      ...newPeriod,
      name: periodName,
      period: newPeriod.periodNumber
    };
    
    createPeriodMutation.mutate(periodData);
  };

  const handleEditPeriod = () => {
    if (selectedPeriod) {
      // Gerar nome automaticamente baseado no número e tipo
      const periodName = `${newPeriod.periodNumber}º ${newPeriod.periodType === 'bimestre' ? 'Bimestre' : 'Semestre'} ${newPeriod.academicYear}`;
      
      const periodData = {
        ...newPeriod,
        name: periodName,
        period: newPeriod.periodNumber
      };
      
      updatePeriodMutation.mutate({
        id: selectedPeriod.id,
        data: periodData
      });
    }
  };

  const handleStartPeriod = (id: string) => {
    startPeriodMutation.mutate(id);
  };

  const handleEndPeriod = (id: string) => {
    endPeriodMutation.mutate(id);
  };

  const handleDeletePeriod = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este período?')) {
      deletePeriodMutation.mutate(id);
    }
  };

  const openEditModal = (period: AcademicPeriod) => {
    setSelectedPeriod(period);
    setNewPeriod({
      name: period.name,
      description: period.description,
      period: period.period,
      periodType: period.period <= '4' ? 'bimestre' : 'semestre',
      periodNumber: period.period,
      academicYear: period.academicYear,
      startDate: period.startDate,
      endDate: period.endDate
    });
    setShowEditModal(true);
  };

  const currentPeriod = periods.find(p => p.status === 'active');
  const pendingPeriods = periods.filter(p => p.status === 'pending');
  const completedPeriods = periods.filter(p => p.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Períodos Letivos</h1>
            </div>
            <p className="text-gray-600 ml-11">
              Controle e administre os períodos acadêmicos da instituição
            </p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-4 h-4" />
                Novo Período
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                Criar Novo Período
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="periodNumber">Número</Label>
                  <Input
                    id="periodNumber"
                    type="number"
                    min="1"
                    max="12"
                    value={newPeriod.periodNumber}
                    onChange={(e) => setNewPeriod({ ...newPeriod, periodNumber: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="periodType">Tipo</Label>
                  <Select value={newPeriod.periodType} onValueChange={(value) => setNewPeriod({ ...newPeriod, periodType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bimestre">Bimestre</SelectItem>
                      <SelectItem value="semestre">Semestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="academicYear">Ano Letivo</Label>
                  <Input
                    id="academicYear"
                    value={newPeriod.academicYear}
                    onChange={(e) => setNewPeriod({ ...newPeriod, academicYear: e.target.value })}
                    placeholder="2025"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={newPeriod.description}
                  onChange={(e) => setNewPeriod({ ...newPeriod, description: e.target.value })}
                  placeholder="Descrição do período"
                />
              </div>
              
              {/* Prévia do nome gerado */}
              {newPeriod.periodNumber && newPeriod.periodType && newPeriod.academicYear && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <Label className="text-sm font-semibold text-blue-800">Prévia do Nome:</Label>
                  </div>
                  <p className="text-blue-900 font-bold text-lg">
                    {newPeriod.periodNumber}º {newPeriod.periodType === 'bimestre' ? 'Bimestre' : 'Semestre'} {newPeriod.academicYear}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newPeriod.startDate}
                    onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newPeriod.endDate}
                    onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreatePeriod} 
                  disabled={createPeriodMutation.isPending}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {createPeriodMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Período
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Período Atual */}
      {currentPeriod && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-green-800">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-lg">Período Letivo Ativo</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-600">Em andamento</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-green-900 mb-2">{currentPeriod.name}</h3>
                  <p className="text-green-700 mb-4">{currentPeriod.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-green-600 font-medium">Início</div>
                      <div className="text-green-900 font-semibold">
                        {format(parseISO(currentPeriod.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-green-600 font-medium">Término</div>
                      <div className="text-green-900 font-semibold">
                        {format(parseISO(currentPeriod.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-green-600 font-medium">Total de dias</div>
                      <div className="text-green-900 font-semibold">{currentPeriod.totalDays}</div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="text-green-600 font-medium">Dias restantes</div>
                      <div className="text-green-900 font-semibold text-lg">{currentPeriod.remainingDays}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3 ml-6">
                  <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">
                    Período Ativo
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleEndPeriod(currentPeriod.id)}
                    disabled={endPeriodMutation.isPending}
                    className="shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Encerrar Período
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Todos os Períodos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Todos os Períodos</h2>
          </div>
          <div className="text-sm text-gray-500">
            {periods.length} período{periods.length !== 1 ? 's' : ''} cadastrado{periods.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <span className="text-gray-600">Carregando períodos...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {periods.map((period) => (
              <Card key={period.id} className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900">{period.name}</CardTitle>
                    <Badge className={`${getStatusColor(period.status)} px-3 py-1 text-xs font-medium`}>
                      {getStatusLabel(period.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{period.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Início:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {format(parseISO(period.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Término:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {format(parseISO(period.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 font-medium">Total de dias:</span>
                      <span className="text-sm font-semibold text-gray-900">{period.totalDays}</span>
                    </div>
                    {period.status === 'active' && (
                      <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
                        <span className="text-sm text-orange-700 font-medium">Dias restantes:</span>
                        <span className="text-sm font-bold text-orange-900">{period.remainingDays}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {period.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartPeriod(period.id)}
                        disabled={startPeriodMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                    {period.status === 'active' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEndPeriod(period.id)}
                        disabled={endPeriodMutation.isPending}
                        className="flex-1 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Encerrar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(period)}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {period.status !== 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePeriod(period.id)}
                        disabled={deletePeriodMutation.isPending}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Edit className="w-5 h-5 text-orange-600" />
              </div>
              Editar Período
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-periodNumber">Número</Label>
                <Input
                  id="edit-periodNumber"
                  type="number"
                  min="1"
                  max="12"
                  value={newPeriod.periodNumber}
                  onChange={(e) => setNewPeriod({ ...newPeriod, periodNumber: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="edit-periodType">Tipo</Label>
                <Select value={newPeriod.periodType} onValueChange={(value) => setNewPeriod({ ...newPeriod, periodType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bimestre">Bimestre</SelectItem>
                    <SelectItem value="semestre">Semestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-academicYear">Ano Letivo</Label>
                <Input
                  id="edit-academicYear"
                  value={newPeriod.academicYear}
                  onChange={(e) => setNewPeriod({ ...newPeriod, academicYear: e.target.value })}
                  placeholder="2025"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição (Opcional)</Label>
              <Textarea
                id="edit-description"
                value={newPeriod.description}
                onChange={(e) => setNewPeriod({ ...newPeriod, description: e.target.value })}
                placeholder="Descrição do período"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Data de Início</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">Data de Término</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={newPeriod.endDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="px-6"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEditPeriod} 
                disabled={updatePeriodMutation.isPending}
                className="px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {updatePeriodMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeriodManagement;