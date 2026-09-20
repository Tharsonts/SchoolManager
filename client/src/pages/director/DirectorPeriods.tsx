import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Plus, 
  Play, 
  Pause, 
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarDays
} from 'lucide-react';

const DirectorPeriods = () => {
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: ''
  });

  // Carregar períodos do localStorage ou API
  useEffect(() => {
    const savedPeriods = localStorage.getItem('schoolPeriods');
    if (savedPeriods) {
      setPeriods(JSON.parse(savedPeriods));
    } else {
      // Períodos padrão
      const defaultPeriods = [
        {
          id: 1,
          name: '1º Bimestre 2025',
          startDate: '2025-02-01',
          endDate: '2025-04-15',
          status: 'active',
          description: 'Primeiro bimestre do ano letivo 2025',
          createdAt: '2025-01-15',
          totalDays: 73,
          remainingDays: 25
        },
        {
          id: 2,
          name: '2º Bimestre 2025',
          startDate: '2025-04-16',
          endDate: '2025-06-30',
          status: 'pending',
          description: 'Segundo bimestre do ano letivo 2025',
          createdAt: '2025-01-15',
          totalDays: 75,
          remainingDays: 75
        },
        {
          id: 3,
          name: '3º Bimestre 2025',
          startDate: '2025-07-01',
          endDate: '2025-09-15',
          status: 'pending',
          description: 'Terceiro bimestre do ano letivo 2025',
          createdAt: '2025-01-15',
          totalDays: 76,
          remainingDays: 76
        },
        {
          id: 4,
          name: '4º Bimestre 2025',
          startDate: '2025-09-16',
          endDate: '2025-12-20',
          status: 'pending',
          description: 'Quarto bimestre do ano letivo 2025',
          createdAt: '2025-01-15',
          totalDays: 95,
          remainingDays: 95
        }
      ];
      setPeriods(defaultPeriods);
      localStorage.setItem('schoolPeriods', JSON.stringify(defaultPeriods));
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleCreatePeriod = () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    
    const startDate = new Date(newPeriod.startDate);
    const endDate = new Date(newPeriod.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const newPeriodData = {
      id: Date.now(),
      name: newPeriod.name,
      startDate: newPeriod.startDate,
      endDate: newPeriod.endDate,
      status: 'pending',
      description: newPeriod.description,
      createdAt: new Date().toISOString(),
      totalDays: totalDays,
      remainingDays: totalDays
    };
    
    const updatedPeriods = [...periods, newPeriodData];
    setPeriods(updatedPeriods);
    localStorage.setItem('schoolPeriods', JSON.stringify(updatedPeriods));
    
    setIsCreatingPeriod(false);
    setNewPeriod({ name: '', startDate: '', endDate: '', description: '' });
    alert('Período criado com sucesso!');
  };

  const handleStartPeriod = (periodId: number) => {
    const updatedPeriods = periods.map(period => {
      if (period.id === periodId) {
        return { ...period, status: 'active' };
      } else if (period.status === 'active') {
        return { ...period, status: 'completed' };
      }
      return period;
    });
    
    setPeriods(updatedPeriods);
    localStorage.setItem('schoolPeriods', JSON.stringify(updatedPeriods));
    alert('Período iniciado com sucesso!');
  };

  const handleEndPeriod = (periodId: number) => {
    const updatedPeriods = periods.map(period => {
      if (period.id === periodId) {
        return { ...period, status: 'completed' };
      }
      return period;
    });
    
    setPeriods(updatedPeriods);
    localStorage.setItem('schoolPeriods', JSON.stringify(updatedPeriods));
    alert('Período encerrado com sucesso!');
  };

  const handleDeletePeriod = (periodId: number) => {
    if (confirm('Tem certeza que deseja excluir este período?')) {
      const updatedPeriods = periods.filter(period => period.id !== periodId);
      setPeriods(updatedPeriods);
      localStorage.setItem('schoolPeriods', JSON.stringify(updatedPeriods));
      alert('Período excluído com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Períodos Letivos</h1>
            <p className="text-gray-600 mt-1">Gerencie o início e término dos períodos letivos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="bg-gray-800 hover:bg-gray-900"
              onClick={() => setIsCreatingPeriod(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Período
            </Button>
            <Badge variant="outline" className="px-3 py-1">
              <Calendar className="h-4 w-4 mr-2" />
              {periods.length} períodos
            </Badge>
          </div>
        </div>

        {/* Current Period Status */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
              Período Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">1º Bimestre 2025</h3>
                <p className="text-gray-600">01/02/2025 - 15/04/2025</p>
                <p className="text-sm text-gray-500 mt-1">25 dias restantes</p>
              </div>
              <div className="text-right">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Play className="h-4 w-4 mr-1" />
                  Ativo
                </Badge>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleEndPeriod(1)}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Encerrar Período
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Periods List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Todos os Períodos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map((period) => (
              <Card key={period.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{period.name}</CardTitle>
                      <p className="text-gray-600 text-sm mt-1">{period.description}</p>
                    </div>
                    <Badge className={getStatusColor(period.status)}>
                      {getStatusIcon(period.status)}
                      <span className="ml-1">
                        {period.status === 'active' ? 'Ativo' : 
                         period.status === 'pending' ? 'Pendente' : 'Concluído'}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Início:</span>
                        <p className="text-gray-600">{new Date(period.startDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Término:</span>
                        <p className="text-gray-600">{new Date(period.endDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Total de dias:</span>
                        <p className="text-gray-600">{period.totalDays}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Dias restantes:</span>
                        <p className="text-gray-600">{period.remainingDays}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {period.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStartPeriod(period.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar
                        </Button>
                      )}
                      {period.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleEndPeriod(period.id)}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Encerrar
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeletePeriod(period.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Create Period Modal */}
        {isCreatingPeriod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Criar Novo Período</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Período *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: 1º Bimestre 2025"
                    value={newPeriod.name}
                    onChange={(e) => setNewPeriod(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Término *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newPeriod.endDate}
                      onChange={(e) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Descrição do período"
                    value={newPeriod.description}
                    onChange={(e) => setNewPeriod(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingPeriod(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreatePeriod}
                    className="flex-1 bg-gray-800 hover:bg-gray-900"
                  >
                    Criar Período
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
};

export default DirectorPeriods;