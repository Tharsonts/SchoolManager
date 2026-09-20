import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateButton from '@/components/ui/create-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  BookOpen,
  Users,
  GraduationCap,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminSubjectsSimple, useAdminClassesSimple } from '@/hooks/useAdminApiSimple';
import { useCheckSubjectDependencies } from '@/hooks/useAdminApi';
import { useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useAdminApi';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';

interface Subject {
  id: string;
  name: string;
  code: string;
  workload: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  linkedClasses?: Array<{
    classId: string;
    className: string;
    classGrade: string;
    classSection: string;
  }>;
}

const SubjectsPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useAdminSubjectsSimple(refreshTrigger);
  const { data: classesData, isLoading: classesLoading, error: classesError } = useAdminClassesSimple();
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const subjects = subjectsData?.data || [];
  const classes = classesData?.data || [];

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDependenciesDialogOpen, setIsDependenciesDialogOpen] = useState(false);
  const [dependenciesData, setDependenciesData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    workload: 60,
    description: '',
    status: 'active' as Subject['status'],
    selectedClasses: [] as string[]
  });

  const formatClassName = (className: string) => {
    return className.replace(/(\d+)º\s*([A-Z])/g, '$1º Ano $2');
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Ativa' : 'Inativa';
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || subject.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateSubject = async () => {
    if (!formData.name || !formData.code || !formData.workload || formData.workload <= 0) {
      toast.error('Preencha todos os campos obrigatórios (nome, código e carga horária)');
      return;
    }
    
    if (!formData.selectedClasses || formData.selectedClasses.length === 0) {
      toast.error('Selecione pelo menos uma turma');
      return;
    }

    createSubjectMutation.mutate({
      subjectData: {
        name: formData.name,
        code: formData.code.toUpperCase(),
        workload: formData.workload,
        description: formData.description || undefined,
        status: formData.status,
        selectedClasses: formData.selectedClasses
      }
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFormData({
          name: '',
          code: '',
          workload: 60,
          description: '',
          status: 'active',
          selectedClasses: []
        });
        setRefreshTrigger(prev => prev + 1);
        toast.success('Disciplina criada com sucesso!');
      },
      onError: (error: any) => {
        console.error('Erro ao criar disciplina:', error);
        toast.error(error.message || 'Erro ao criar disciplina');
      }
    });
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    const linkedClassIds = subject.linkedClasses?.map(cls => cls.classId) || [];
    setFormData({
      name: subject.name,
      code: subject.code,
      workload: subject.workload,
      description: subject.description || '',
      status: subject.status,
      selectedClasses: linkedClassIds
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubject = async () => {
    if (!selectedSubject) return;

    if (!formData.name || !formData.code || !formData.selectedClasses || formData.selectedClasses.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    updateSubjectMutation.mutate({
      subjectId: selectedSubject.id,
      subjectData: {
        name: formData.name,
        code: formData.code.toUpperCase(),
        workload: formData.workload,
        description: formData.description || undefined,
        status: formData.status,
        selectedClasses: formData.selectedClasses
      }
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setSelectedSubject(null);
        setRefreshTrigger(prev => prev + 1);
        toast.success('Disciplina atualizada com sucesso!');
      },
      onError: (error: any) => {
        console.error('Erro ao atualizar disciplina:', error);
        toast.error(error.message || 'Erro ao atualizar disciplina');
      }
    });
  };

  const handleDeleteSubject = async (subject: Subject) => {
    setSubjectToDelete(subject);
    
    try {
      const response = await fetch(`/api/subjects/${subject.id}/dependencies`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.hasDependencies) {
          setDependenciesData(data);
          setIsDependenciesDialogOpen(true);
        } else {
          setIsPasswordDialogOpen(true);
        }
      } else {
        setIsPasswordDialogOpen(true);
      }
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      setIsPasswordDialogOpen(true);
    }
  };

  const confirmDeleteSubject = async (password: string) => {
    if (!subjectToDelete) return;

    try {
      await deleteSubjectMutation.mutateAsync({ 
        id: subjectToDelete.id, 
        password: password
      });
      setIsPasswordDialogOpen(false);
      setIsDependenciesDialogOpen(false);
      setSubjectToDelete(null);
      setDependenciesData(null);
      setRefreshTrigger(prev => prev + 1);
      toast.success('Disciplina excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
      toast.error('Erro ao excluir disciplina. Verifique sua senha.');
    }
  };

  if (subjectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (subjectsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar disciplinas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Disciplinas</h1>
          <p className="text-gray-600 mt-1">Configure as disciplinas da escola</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSubjects();
              setRefreshTrigger(prev => prev + 1);
              toast.success('Lista atualizada!');
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <CreateButton 
                loading={createSubjectMutation.isPending}
                onClick={() => {
                  setFormData({
                    name: '',
                    code: '',
                    workload: 60,
                    description: '',
                    status: 'active',
                    selectedClasses: []
                  });
                }}
              >
                Nova Disciplina
              </CreateButton>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Disciplina</DialogTitle>
                <DialogDescription>
                  Preencha os dados da nova disciplina.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Disciplina *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Matemática"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Código *</Label>
                    <Input
                      id="code"
                      placeholder="Ex: MAT"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workload">Carga Horária (horas) *</Label>
                    <Input
                      id="workload"
                      type="number"
                      placeholder="Ex: 60"
                      value={formData.workload}
                      onChange={(e) => setFormData(prev => ({ ...prev, workload: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      placeholder="Ex: Álgebra, geometria e estatística"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="classes">Turmas *</Label>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Selecione as turmas onde esta disciplina será ministrada:
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                      {classes.map(cls => (
                        <label key={cls.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.selectedClasses?.includes(cls.id) || false}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedClasses: [...prev.selectedClasses, cls.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedClasses: prev.selectedClasses.filter(id => id !== cls.id)
                                }));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{formatClassName(cls.name)}</span>
                        </label>
                      ))}
                    </div>
                    {(!formData.selectedClasses || formData.selectedClasses.length === 0) && (
                      <p className="text-sm text-red-600">Selecione pelo menos uma turma</p>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <CreateButton 
                  onClick={handleCreateSubject} 
                  loading={createSubjectMutation.isPending}
                  size="md"
                >
                  {createSubjectMutation.isPending ? 'Criando...' : 'Criar Disciplina'}
                </CreateButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar disciplinas..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                </div>
                <Badge className={getStatusColor(subject.status)}>
                  {getStatusText(subject.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              {/* Informações do Professor */}
              {subject.teacher ? (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Professor:</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    {subject.teacher.name}
                  </p>
                  {subject.teacher.email && (
                    <p className="text-xs text-purple-600">{subject.teacher.email}</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Nenhum professor atribuído</span>
                  </div>
                </div>
              )}

              {/* Turmas Vinculadas */}
              {subject.linkedClasses && subject.linkedClasses.length > 0 ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Turmas:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {subject.linkedClasses.map((cls, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {formatClassName(cls.className)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Nenhuma turma vinculada</span>
                  </div>
                </div>
              )}

              {subject.description && (
                <div className="text-sm text-gray-600">
                  <strong>Descrição:</strong> {subject.description}
                </div>
              )}

              <div className="text-sm text-gray-500">
                <strong>Criada em:</strong> {subject.createdAt ? new Date(subject.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
              </div>
            </CardContent>
            
            {/* Botões sempre na parte inferior */}
            <div className="p-4 pt-0 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditSubject(subject)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteSubject(subject)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma disciplina encontrada</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira disciplina'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Disciplina
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Disciplina</DialogTitle>
            <DialogDescription>
              Atualize os dados da disciplina {selectedSubject?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome da Disciplina *</Label>
                <Input
                  id="edit-name"
                  placeholder="Ex: Matemática"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  placeholder="Ex: MAT"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-classes">Turmas *</Label>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  Selecione as turmas onde esta disciplina será ministrada:
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {classesLoading ? (
                    <div className="col-span-2 text-center text-sm text-gray-500">Carregando turmas...</div>
                  ) : classesError ? (
                    <div className="col-span-2 text-center text-sm text-red-500">Erro ao carregar turmas</div>
                  ) : classes.length === 0 ? (
                    <div className="col-span-2 text-center text-sm text-gray-500">Nenhuma turma disponível</div>
                  ) : (
                    classes.map(cls => (
                      <label key={cls.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedClasses?.includes(cls.id) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedClasses: [...prev.selectedClasses, cls.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedClasses: prev.selectedClasses.filter(id => id !== cls.id)
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">{formatClassName(cls.name)}</span>
                      </label>
                    ))
                  )}
                </div>
                {(!formData.selectedClasses || formData.selectedClasses.length === 0) && (
                  <p className="text-sm text-red-600">Selecione pelo menos uma turma</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                placeholder="Ex: Álgebra, geometria e estatística"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateSubject} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateSubjectMutation.isPending}
            >
              {updateSubjectMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Dependências */}
      <Dialog open={isDependenciesDialogOpen} onOpenChange={setIsDependenciesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Excluir Disciplina com Vínculos
            </DialogTitle>
            <DialogDescription>
              Esta disciplina possui vínculos que serão removidos junto com ela.
            </DialogDescription>
          </DialogHeader>
          
          {dependenciesData && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Vínculos encontrados:</h4>
                <div className="space-y-1 text-sm text-red-700">
                  {dependenciesData.dependencies.classSubjects > 0 && (
                    <p>• {dependenciesData.dependencies.classSubjects} vínculo(s) com turmas</p>
                  )}
                  {dependenciesData.dependencies.activities > 0 && (
                    <p>• {dependenciesData.dependencies.activities} atividade(s)</p>
                  )}
                  {dependenciesData.dependencies.exams > 0 && (
                    <p>• {dependenciesData.dependencies.exams} prova(s)</p>
                  )}
                  {dependenciesData.dependencies.materials > 0 && (
                    <p>• {dependenciesData.dependencies.materials} material(is)</p>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Atenção:</strong> Todos os vínculos acima serão removidos permanentemente.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setSubjectToDelete(null);
                setDependenciesData(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setIsPasswordDialogOpen(true);
              }}
            >
              Continuar com Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordConfirmationDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setSubjectToDelete(null);
        }}
        onConfirm={(password) => {
          confirmDeleteSubject(password);
        }}
        title="Excluir Disciplina"
        description="Para excluir esta disciplina, confirme sua senha de administrador."
        itemName={subjectToDelete?.name}
        isLoading={deleteSubjectMutation.isPending}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default SubjectsPage;

