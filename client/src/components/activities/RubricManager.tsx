import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Star, Award, Target, CheckCircle } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Rubric, RubricCriterion, RubricLevel } from '@/shared/advanced-types';
import { toast } from 'sonner';

interface RubricManagerProps {
  activityId?: string;
  onRubricSelected?: (rubric: Rubric) => void;
}

export function RubricManager({ activityId, onRubricSelected }: RubricManagerProps) {
  const { request } = useApi();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  
  // Estado para criação/edição de rubrica
  const [rubricData, setRubricData] = useState({
    name: '',
    description: '',
    maxScore: 100,
    weightedScoring: false,
    autoGradingEnabled: false,
    isTemplate: false,
    criteria: [] as RubricCriterion[]
  });

  useEffect(() => {
    loadRubrics();
  }, []);

  const loadRubrics = async () => {
    setLoading(true);
    try {
      const response = await request('/api/rubrics');
      setRubrics(response);
    } catch (error) {
      console.error('Erro ao carregar rubricas:', error);
      toast.error('Erro ao carregar rubricas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRubric = async () => {
    if (!rubricData.name || rubricData.criteria.length === 0) {
      toast.error('Nome e pelo menos um critério são obrigatórios');
      return;
    }

    try {
      const payload = {
        ...rubricData,
        criteria: { criteria: rubricData.criteria }
      };

      if (editingRubric) {
        // Atualizar rubrica existente
        await request(`/api/rubrics/${editingRubric.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        toast.success('Rubrica atualizada com sucesso!');
      } else {
        // Criar nova rubrica
        await request('/api/rubrics', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Rubrica criada com sucesso!');
      }

      setShowCreateDialog(false);
      setEditingRubric(null);
      resetForm();
      loadRubrics();
    } catch (error) {
      console.error('Erro ao salvar rubrica:', error);
      toast.error('Erro ao salvar rubrica');
    }
  };

  const handleEditRubric = (rubric: Rubric) => {
    setEditingRubric(rubric);
    setRubricData({
      name: rubric.name,
      description: rubric.description || '',
      maxScore: rubric.maxScore,
      weightedScoring: rubric.weightedScoring,
      autoGradingEnabled: rubric.autoGradingEnabled,
      isTemplate: rubric.isTemplate,
      criteria: rubric.criteria.criteria
    });
    setShowCreateDialog(true);
  };

  const handleDeleteRubric = async (rubricId: string) => {

    try {
      await request(`/api/rubrics/${rubricId}`, {
        method: 'DELETE'
      });
      toast.success('Rubrica excluída com sucesso!');
      loadRubrics();
    } catch (error) {
      console.error('Erro ao excluir rubrica:', error);
      toast.error('Erro ao excluir rubrica');
    }
  };

  const handleAssociateRubric = async (rubricId: string) => {
    if (!activityId) {
      toast.error('ID da atividade não fornecido');
      return;
    }

    try {
      await request(`/api/activities/${activityId}/rubrics`, {
        method: 'POST',
        body: JSON.stringify({
          rubricId,
          weight: 1.0,
          isPrimary: true
        })
      });
      toast.success('Rubrica associada à atividade!');
      onRubricSelected?.(rubrics.find(r => r.id === rubricId)!);
    } catch (error) {
      console.error('Erro ao associar rubrica:', error);
      toast.error('Erro ao associar rubrica');
    }
  };

  const resetForm = () => {
    setRubricData({
      name: '',
      description: '',
      maxScore: 100,
      weightedScoring: false,
      autoGradingEnabled: false,
      isTemplate: false,
      criteria: []
    });
  };

  const addCriterion = () => {
    const newCriterion: RubricCriterion = {
      id: `criterion_${Date.now()}`,
      name: '',
      description: '',
      weight: 1,
      levels: [
        { score: 4, label: 'Excelente', description: '' },
        { score: 3, label: 'Bom', description: '' },
        { score: 2, label: 'Satisfatório', description: '' },
        { score: 1, label: 'Insuficiente', description: '' }
      ]
    };
    setRubricData(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion]
    }));
  };

  const updateCriterion = (index: number, field: string, value: any) => {
    setRubricData(prev => ({
      ...prev,
      criteria: prev.criteria.map((criterion, i) => 
        i === index ? { ...criterion, [field]: value } : criterion
      )
    }));
  };

  const updateCriterionLevel = (criterionIndex: number, levelIndex: number, field: string, value: any) => {
    setRubricData(prev => ({
      ...prev,
      criteria: prev.criteria.map((criterion, i) => 
        i === criterionIndex ? {
          ...criterion,
          levels: criterion.levels.map((level, j) => 
            j === levelIndex ? { ...level, [field]: value } : level
          )
        } : criterion
      )
    }));
  };

  const removeCriterion = (index: number) => {
    setRubricData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index)
    }));
  };

  const getRarityColor = (isTemplate: boolean) => {
    return isTemplate ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gerenciar Rubricas</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRubric(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Rubrica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRubric ? 'Editar Rubrica' : 'Criar Nova Rubrica'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rubricName">Nome da Rubrica</Label>
                  <Input
                    id="rubricName"
                    value={rubricData.name}
                    onChange={(e) => setRubricData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da rubrica"
                  />
                </div>
                <div>
                  <Label htmlFor="maxScore">Pontuação Máxima</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={rubricData.maxScore}
                    onChange={(e) => setRubricData(prev => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={rubricData.description}
                  onChange={(e) => setRubricData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da rubrica"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="weightedScoring"
                    checked={rubricData.weightedScoring}
                    onCheckedChange={(checked) => setRubricData(prev => ({ ...prev, weightedScoring: checked }))}
                  />
                  <Label htmlFor="weightedScoring">Pontuação Ponderada</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoGrading"
                    checked={rubricData.autoGradingEnabled}
                    onCheckedChange={(checked) => setRubricData(prev => ({ ...prev, autoGradingEnabled: checked }))}
                  />
                  <Label htmlFor="autoGrading">Avaliação Automática</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isTemplate"
                    checked={rubricData.isTemplate}
                    onCheckedChange={(checked) => setRubricData(prev => ({ ...prev, isTemplate: checked }))}
                  />
                  <Label htmlFor="isTemplate">Modelo</Label>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Critérios de Avaliação</h3>
                  <Button onClick={addCriterion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Critério
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {rubricData.criteria.map((criterion, criterionIndex) => (
                    <Card key={criterion.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <Label>Nome do Critério</Label>
                              <Input
                                value={criterion.name}
                                onChange={(e) => updateCriterion(criterionIndex, 'name', e.target.value)}
                                placeholder="Ex: Conteúdo"
                              />
                            </div>
                            <div>
                              <Label>Peso</Label>
                              <Input
                                type="number"
                                value={criterion.weight}
                                onChange={(e) => updateCriterion(criterionIndex, 'weight', parseInt(e.target.value))}
                                min="1"
                                max="10"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeCriterion(criterionIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={criterion.description}
                            onChange={(e) => updateCriterion(criterionIndex, 'description', e.target.value)}
                            placeholder="Descrição do critério"
                            rows={2}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Label>Níveis de Desempenho</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {criterion.levels.map((level, levelIndex) => (
                              <div key={levelIndex} className="grid grid-cols-4 gap-2 p-2 border rounded">
                                <div>
                                  <Input
                                    value={level.score}
                                    onChange={(e) => updateCriterionLevel(criterionIndex, levelIndex, 'score', parseInt(e.target.value))}
                                    type="number"
                                    placeholder="Pontos"
                                    min="1"
                                    max="4"
                                  />
                                </div>
                                <div>
                                  <Input
                                    value={level.label}
                                    onChange={(e) => updateCriterionLevel(criterionIndex, levelIndex, 'label', e.target.value)}
                                    placeholder="Rótulo"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Input
                                    value={level.description}
                                    onChange={(e) => updateCriterionLevel(criterionIndex, levelIndex, 'description', e.target.value)}
                                    placeholder="Descrição do nível"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRubric}>
                  {editingRubric ? 'Atualizar' : 'Criar'} Rubrica
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando rubricas...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rubrics.map((rubric) => (
            <Card key={rubric.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rubric.name}</CardTitle>
                    {rubric.description && (
                      <p className="text-sm text-gray-600 mt-1">{rubric.description}</p>
                    )}
                  </div>
                  <Badge className={getRarityColor(rubric.isTemplate)}>
                    {rubric.isTemplate ? 'Modelo' : 'Personalizada'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {rubric.criteria.criteria.length} critérios
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {rubric.maxScore} pontos
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {rubric.weightedScoring && (
                    <Badge variant="secondary" className="text-xs">
                      Ponderada
                    </Badge>
                  )}
                  {rubric.autoGradingEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      Auto-avaliação
                    </Badge>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRubric(rubric)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  
                  {activityId && (
                    <Button
                      size="sm"
                      onClick={() => handleAssociateRubric(rubric.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Usar
                    </Button>
                  )}
                  
                  {!rubric.isTemplate && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRubric(rubric.id)}
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
      
      {rubrics.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma rubrica encontrada</p>
              <p className="text-sm">Crie sua primeira rubrica para começar a avaliar atividades</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}