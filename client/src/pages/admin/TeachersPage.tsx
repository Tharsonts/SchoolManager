import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CreateButton from '@/components/ui/create-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Eye,
  Trash2,
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAdminTeachers, useCreateTeacher, useDeleteTeacher, useAdminTeacherDetails, useUpdateTeacher, useCheckUserDependencies } from '@/hooks/useAdminApi';
import { useAdminSubjectsSimple, useAdminClassesSimple } from '@/hooks/useAdminApiSimple';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  email?: string;
  birthDate?: string;
  status: 'active' | 'inactive' | 'pendente';
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
    classes: Array<{
      id: string;
      name: string;
      grade: string;
      section: string;
    }>;
  }>;
  totalSubjects?: number;
  totalClasses?: number;
}

const TeachersPage: React.FC = () => {
  // Estados existentes
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDependenciesDialogOpen, setIsDependenciesDialogOpen] = useState(false);
  const [dependenciesData, setDependenciesData] = useState<any>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [originalAssignments, setOriginalAssignments] = useState<{ subjects: string[]; classes: string[] }>({ subjects: [], classes: [] });

  // Form data para o sistema avançado
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    email: '',
    birthDate: '',
    status: 'active',
    selectedSubjects: [] as string[],
    selectedClasses: [] as string[]
  });

  // Hooks existentes
  const { data: teachersData, isLoading, error, refetch } = useAdminTeachers();
  const { data: subjectsData, isLoading: subjectsLoading } = useAdminSubjectsSimple();
  const { data: classesData, isLoading: classesLoading } = useAdminClassesSimple();
  
  // Extrair dados corretamente
  const subjects = subjectsData?.data || [];
  const classes = classesData?.data || [];
  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();
  const { data: teacherDetailsData, isLoading: teacherDetailsLoading } = useAdminTeacherDetails(selectedTeacher?.id);

  const groupedSubjects = React.useMemo(() => {
    const groups: Record<string, { subjectName: string; subjectCode: string; classes: Array<{ className: string; classGrade: string; classSection: string }> }> = {};
    const items = teacherDetailsData?.subjects || [];
    items.forEach((item: any) => {
      const key = item.subjectId;
      if (!groups[key]) {
        groups[key] = { subjectName: item.subjectName, subjectCode: item.subjectCode, classes: [] };
      }
      groups[key].classes.push({ className: item.className, classGrade: item.classGrade, classSection: item.classSection });
    });
    return Object.values(groups);
  }, [teacherDetailsData]);

  // Extrair dados dos professores
  const teachers = teachersData?.data || [];

  // Função existente para criar professor (sistema antigo)
  const handleCreateTeacher = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Usar disciplinas e turmas selecionadas pelo usuário
    const selectedSubjects = formData.selectedSubjects || [];
    const selectedClasses = formData.selectedClasses || [];

    createTeacherMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      subjects: selectedSubjects,
      classes: selectedClasses,
    }, {
      onSuccess: () => {
        toast.success('Professor criado com sucesso!');
        setIsCreateDialogOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          email: '',
          birthDate: '',
          selectedSubjects: [],
          selectedClasses: []
        });
        refetch();
        
        // Notificar outras páginas sobre a atualização
        const event = new CustomEvent('teacherCreated', {
          detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        
        // Também usar localStorage para persistir a notificação
        localStorage.setItem('lastTeacherUpdate', Date.now().toString());
      },
      onError: (error: any) => {
        toast.error(error.message || 'Erro ao criar professor');
      }
    });
  };

  // Função para verificar dependências antes de excluir
  const handleDeleteTeacher = async (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    
    try {
      // Verificar dependências
      const response = await fetch(`/api/users/${teacher.id}/dependencies`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.hasDependencies) {
          // Tem vínculos - mostrar modal com dependências
          setDependenciesData(data);
          setIsDependenciesDialogOpen(true);
        } else {
          // Sem vínculos - exclusão simples
          setIsDeleteDialogOpen(true);
        }
      } else {
        // Erro na verificação - usar exclusão simples
        setIsDeleteDialogOpen(true);
      }
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      // Em caso de erro, usar exclusão simples
      setIsDeleteDialogOpen(true);
    }
  };

  // Função para deletar professor com confirmação de senha
  const confirmDeleteTeacher = async (password: string, confirmText?: string) => {
    if (!teacherToDelete) return;

    try {
      await deleteTeacherMutation.mutateAsync({ 
        teacherId: teacherToDelete.id, 
        password,
        confirmText
      });
      setIsDeleteDialogOpen(false);
      setIsDependenciesDialogOpen(false);
      setIsConfirmDeleteDialogOpen(false);
      setTeacherToDelete(null);
      setDependenciesData(null);
      setConfirmText('');
      toast.success('Professor excluído com sucesso!');
      refetch();
    } catch (error) {
      console.error('Erro ao excluir professor:', error);
      toast.error('Erro ao excluir professor. Verifique sua senha.');
    }
  };

  // Função para editar professor
  const handleEditTeacher = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    
    // Buscar vínculos atuais do professor
    try {
      const response = await fetch(`/api/admin/teachers/${teacher.id}/assignments`, {
        credentials: 'include'
      });
      
      let currentSubjects = [];
      let currentClasses = [];
      
      if (response.ok) {
        const assignments = await response.json();
        currentSubjects = assignments.subjects?.map((s: any) => s.id) || [];
        currentClasses = assignments.classes?.map((c: any) => c.id) || [];
      }
      
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone || '',
        address: teacher.address || '',
        email: teacher.email || '',
        birthDate: teacher.birthDate || '',
        status: teacher.status,
        selectedSubjects: currentSubjects,
        selectedClasses: currentClasses
      });
      setOriginalAssignments({ subjects: currentSubjects, classes: currentClasses });
    } catch (error) {
      console.error('Erro ao buscar vínculos:', error);
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone || '',
        address: teacher.address || '',
        email: teacher.email || '',
        birthDate: teacher.birthDate || '',
        status: teacher.status,
        selectedSubjects: [],
        selectedClasses: []
      });
      setOriginalAssignments({ subjects: [], classes: [] });
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Verificar se houve mudanças significativas que requerem nova aprovação
    const arraysEqual = (a: string[], b: string[]) => {
      const sa = [...(a || [])].sort();
      const sb = [...(b || [])].sort();
      if (sa.length !== sb.length) return false;
      for (let i = 0; i < sa.length; i++) { if (sa[i] !== sb[i]) return false; }
      return true;
    };
    const assignmentsChanged = !arraysEqual(formData.selectedSubjects || [], originalAssignments.subjects || []) || !arraysEqual(formData.selectedClasses || [], originalAssignments.classes || []);
    const hasSignificantChanges = 
      formData.firstName !== selectedTeacher.firstName ||
      formData.lastName !== selectedTeacher.lastName ||
      formData.email !== (selectedTeacher.email || '') ||
      selectedTeacher.status !== 'pendente' ||
      assignmentsChanged;

    updateTeacherMutation.mutate({
      teacherId: selectedTeacher.id,
      teacherData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        email: formData.email || undefined,
        birthDate: formData.birthDate || undefined,
        // Marcar como pendente de aprovação se houve mudanças significativas
        status: hasSignificantChanges ? 'pendente' : selectedTeacher.status
      }
    }, {
      onSuccess: async () => {
        if (assignmentsChanged) {
          try {
            await fetch(`/api/admin/teachers/${selectedTeacher.id}/assignments`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                subjects: formData.selectedSubjects,
                classes: formData.selectedClasses
              }),
            });
          } catch (error) {
            console.error('Erro ao atualizar vínculos:', error);
          }
        }
        
        setIsEditDialogOpen(false);
        setSelectedTeacher(null);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          email: '',
          birthDate: '',
          status: 'active',
          selectedSubjects: [],
          selectedClasses: []
        });
        refetch();
        
        const successMessage = hasSignificantChanges 
          ? 'Professor atualizado. Alterações aguardam aprovação do diretor.'
          : 'Professor atualizado com sucesso!';
        toast.success(successMessage);
      }
    });
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  // Filtros
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar professores: {error.message}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Professores</h1>
          <p className="text-gray-600 mt-1">Gerencie os professores da escola</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sistema avançado de criação */}
          <CreateButton 
            onClick={() => setIsCreateDialogOpen(true)}
            loading={createTeacherMutation.isPending}
          >
            Novo Professor
          </CreateButton>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Professor</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo professor e vincule às disciplinas e turmas.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {/* Informações Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Informações Pessoais</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Digite o nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Digite o sobrenome"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Endereço</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Digite o endereço completo"
                      />
                    </div>
                  </div>
                </div>

                {/* Vinculação com Disciplinas e Turmas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Vinculação Acadêmica</h3>
                  
                  {/* Disciplinas */}
                  <div>
                    <Label>Disciplinas que o professor irá ministrar</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {subjectsLoading ? (
                        <p className="text-sm text-gray-500">Carregando disciplinas...</p>
                      ) : Array.isArray(subjects) && subjects.length > 0 ? (
                        subjects.map((subject: any) => (
                          <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={formData.selectedSubjects?.includes(subject.id) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedSubjects: [...(prev.selectedSubjects || []), subject.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedSubjects: prev.selectedSubjects?.filter(id => id !== subject.id) || []
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                              {subject.name} ({subject.code})
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma disciplina disponível</p>
                      )}
                    </div>
                  </div>

                  {/* Turmas */}
                  <div>
                    <Label>Turmas onde o professor irá atuar</Label>
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                      {classesLoading ? (
                        <p className="text-sm text-gray-500">Carregando turmas...</p>
                      ) : Array.isArray(classes) && classes.length > 0 ? (
                        classes.map((classItem: any) => (
                          <div key={classItem.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${classItem.id}`}
                              checked={formData.selectedClasses?.includes(classItem.id) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedClasses: [...(prev.selectedClasses || []), classItem.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedClasses: prev.selectedClasses?.filter(id => id !== classItem.id) || []
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`class-${classItem.id}`} className="text-sm">
                              {classItem.name} - {classItem.grade}º {classItem.section}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nenhuma turma disponível</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateTeacher}
                  disabled={createTeacherMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {createTeacherMutation.isPending ? 'Criando...' : 'Criar Professor'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar professores..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de professores */}
      {filteredTeachers.length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum professor encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando o primeiro professor da escola.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Professor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h3>
                      <p className="text-gray-600">{teacher.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={
                          teacher.status === 'active' ? 'bg-green-100 text-green-800' : 
                          teacher.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }>
                          {teacher.status === 'active' ? 'Ativo' : 
                           teacher.status === 'pendente' ? 'Aprovar' : 
                           'Inativo'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Matrícula: {teacher.registrationNumber}
                        </span>
                      </div>
                      
                      {/* Informações de Turmas e Disciplinas */}
                      <div className="mt-3 space-y-2">
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                {teacher.totalSubjects} disciplina(s) • {teacher.totalClasses} turma(s)
                              </span>
                            </div>
                            <div className="space-y-1">
                              {teacher.subjects.slice(0, 2).map((subject) => (
                                <div key={subject.id} className="text-xs text-blue-700">
                                  <span className="font-medium">{subject.name}</span>
                                  <span className="text-blue-600 ml-1">
                                    ({subject.classes.map(cls => `${cls.grade}º ${cls.section}`).join(', ')})
                                  </span>
                                </div>
                              ))}
                              {teacher.subjects.length > 2 && (
                                <div className="text-xs text-blue-600">
                                  +{teacher.subjects.length - 2} disciplina(s) mais
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Nenhuma disciplina atribuída</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTeacher(teacher)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteTeacher(teacher)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {/* Modal de visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Professor</DialogTitle>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                  <p className="text-lg font-semibold text-gray-900">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Matrícula</Label>
                  <p className="text-gray-900 font-mono">{selectedTeacher.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-gray-900">{selectedTeacher.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-gray-900">{selectedTeacher.phone || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={
                    selectedTeacher.status === 'active' ? 'bg-green-100 text-green-800' : 
                    selectedTeacher.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }>
                    {selectedTeacher.status === 'active' ? 'Ativo' : 
                     selectedTeacher.status === 'pendente' ? 'Aprovar' : 
                     'Inativo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-gray-900">{new Date(selectedTeacher.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {teacherDetailsLoading ? (
                <p className="text-sm text-gray-500">Carregando vínculos...</p>
              ) : (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-500">Vínculos</Label>
                  {groupedSubjects.length > 0 ? (
                    <div className="space-y-2">
                      {groupedSubjects.map((group) => (
                        <div key={`${group.subjectName}-${group.subjectCode}`}>
                          <p className="font-semibold">{group.subjectName} ({group.subjectCode})</p>
                          <p className="text-sm text-gray-600">
                            Turmas: {group.classes.map((cls) => cls.className || `${cls.classGrade}º ${cls.classSection}`).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sem vínculos registrados</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
            <DialogDescription>
              Atualize os dados do professor {selectedTeacher?.firstName} {selectedTeacher?.lastName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Nome *</Label>
                <Input
                  id="edit-firstName"
                  placeholder="Ex: João"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Sobrenome *</Label>
                <Input
                  id="edit-lastName"
                  placeholder="Ex: Silva"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Ex: professor@escola.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    placeholder="Ex: (11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                </div>
              </div>

            <div>
              <Label htmlFor="edit-birthDate">Data de Nascimento</Label>
              <Input
                id="edit-birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente de Aprovação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seção de Vínculos com Disciplinas */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Disciplinas</Label>
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                {subjects.map((subject: any) => (
                  <div key={subject.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={formData.selectedSubjects.includes(subject.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            selectedSubjects: [...prev.selectedSubjects, subject.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            selectedSubjects: prev.selectedSubjects.filter(id => id !== subject.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                      {subject.name} ({subject.code})
                    </Label>
                  </div>
                ))}
                {(!subjects || subjects.length === 0) && (
                  <p className="text-gray-500 text-sm">Nenhuma disciplina disponível</p>
                )}
              </div>
            </div>

            {/* Seção de Vínculos com Turmas */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Turmas Adicionais (Opcional)</Label>
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                {Array.isArray(classes) && classes.map((classItem: any) => (
                  <div key={classItem.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id={`class-${classItem.id}`}
                      checked={formData.selectedClasses.includes(classItem.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            selectedClasses: [...prev.selectedClasses, classItem.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            selectedClasses: prev.selectedClasses.filter(id => id !== classItem.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`class-${classItem.id}`} className="text-sm">
                      {classItem.name} - {classItem.grade}º {classItem.section}
                    </Label>
                  </div>
                ))}
                {(!classes || classes.length === 0) && (
                  <p className="text-gray-500 text-sm">Nenhuma turma disponível</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateTeacher}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateTeacherMutation.isPending}
            >
              {updateTeacherMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão com senha */}
      {/* Modal de Dependências */}
      <Dialog open={isDependenciesDialogOpen} onOpenChange={setIsDependenciesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Exclusão com Vínculos</DialogTitle>
            <DialogDescription>
              Este professor possui vínculos no sistema que serão removidos:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {dependenciesData?.dependencies.classSubjects > 0 && (
              <div className="flex justify-between">
                <span>Vínculos com disciplinas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.classSubjects}</span>
              </div>
            )}
            {dependenciesData?.dependencies.activities > 0 && (
              <div className="flex justify-between">
                <span>Atividades criadas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.activities}</span>
              </div>
            )}
            {dependenciesData?.dependencies.exams > 0 && (
              <div className="flex justify-between">
                <span>Provas criadas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.exams}</span>
              </div>
            )}
            {dependenciesData?.dependencies.materials > 0 && (
              <div className="flex justify-between">
                <span>Materiais criados:</span>
                <span className="font-semibold">{dependenciesData.dependencies.materials}</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setTeacherToDelete(null);
                setDependenciesData(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setIsConfirmDeleteDialogOpen(true);
              }}
            >
              Continuar com Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setTeacherToDelete(null);
        }}
        onConfirm={(password) => {
          // Se tem dependências, precisa do confirmText
          if (dependenciesData?.hasDependencies) {
            // Verificar se o texto de confirmação está correto
            if (confirmText === 'confirmar') {
              confirmDeleteTeacher(password, confirmText);
            } else {
              toast.error('Digite exatamente "confirmar" para prosseguir');
            }
          } else {
            confirmDeleteTeacher(password);
          }
        }}
        title="Excluir Professor"
        description="Para excluir este professor, confirme sua senha de administrador."
        itemName={teacherToDelete ? `${teacherToDelete.firstName} ${teacherToDelete.lastName}` : ''}
        isLoading={deleteTeacherMutation.isPending}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      {/* Modal de confirmação para exclusão com dependências */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Confirmação Necessária</DialogTitle>
            <DialogDescription>
              Este professor possui vínculos no sistema. Para confirmar a exclusão, digite exatamente "confirmar" no campo abaixo:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="confirmText" className="block text-sm font-medium mb-2">
                Digite "confirmar" para prosseguir:
              </label>
              <input
                id="confirmText"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="confirmar"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsConfirmDeleteDialogOpen(false);
                setConfirmText('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirmText === 'confirmar') {
                  setIsConfirmDeleteDialogOpen(false);
                  setIsDeleteDialogOpen(true);
                } else {
                  toast.error('Digite exatamente "confirmar" para prosseguir');
                }
              }}
            >
              Prosseguir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeachersPage;
