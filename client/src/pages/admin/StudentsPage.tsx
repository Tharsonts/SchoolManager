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
  Trash2,
  User,
  Eye,
  Users,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAdminUsers, useCreateUser, useDeleteUser, useUpdateStudent, useDeleteStudent, useCheckUserDependencies, useStudentDetails } from '@/hooks/useAdminApi';
import { useAdminClassesSimple, useAdminSubjectsSimple } from '@/hooks/useAdminApiSimple';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  registrationNumber: string;
  class?: string;
  grade?: string;
  status: 'active' | 'inactive' | 'suspended' | 'transferred' | 'pendente';
  createdAt: string;
  updatedAt?: string;
  avatar?: string;
  classInfo?: {
    id: string;
    name: string;
    grade: string;
    section: string;
  };
}

const StudentsPage = () => {
  const { data: usersData, isLoading } = useAdminUsers();
  const { data: classesData, isLoading: classesLoading, error: classesError } = useAdminClassesSimple();
  const { data: subjectsData, isLoading: subjectsLoading, error: subjectsError } = useAdminSubjectsSimple();
  const createUserMutation = useCreateUser();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const deleteUserMutation = useDeleteUser();

  // Filtrar apenas alunos
  const students = usersData?.data?.filter((user: any) => user.role === 'student') || [];
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];

  // Debug logs
  console.log('🔍 StudentsPage - classesData:', classesData);
  console.log('🔍 StudentsPage - classes:', classes);
  console.log('🔍 StudentsPage - classesLoading:', classesLoading);
  console.log('🔍 StudentsPage - classesError:', classesError);
  console.log('🔍 StudentsPage - subjectsData:', subjectsData);
  console.log('🔍 StudentsPage - subjects:', subjects);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Hook para buscar detalhes do aluno selecionado
  const { data: studentDetailsData, isLoading: detailsLoading } = useStudentDetails(selectedStudent?.id);
  const studentDetails = studentDetailsData;
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDependenciesDialogOpen, setIsDependenciesDialogOpen] = useState(false);
  const [dependenciesData, setDependenciesData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    classId: '',
    selectedSubjects: []
  });

  // Estados para busca de disciplinas
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState([]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'transferred': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pendente': return 'Aprovar';
      case 'inactive': return 'Inativo';
      case 'suspended': return 'Suspenso';
      case 'transferred': return 'Transferido';
      default: return 'Desconhecido';
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara (XX) XXXXX-XXXX
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

  // Função para filtrar disciplinas baseado na busca
  const handleSubjectSearch = (searchValue: string) => {
    setSubjectSearchTerm(searchValue);
    if (searchValue.trim() === '') {
      setFilteredSubjects([]);
    } else {
      const filtered = subjects.filter((subject: any) =>
        subject.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredSubjects(filtered);
    }
  };

  const filteredStudents = students.filter((student: any) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateStudent = async () => {
    if (!formData.firstName || !formData.lastName || !formData.classId) {
      toast.error('Preencha todos os campos obrigatórios (Nome, Sobrenome e Turma)');
      return;
    }

    createUserMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      role: 'student',
      classId: formData.classId
    }, {
      onSuccess: () => {
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          classId: ''
        });
        setIsCreateDialogOpen(false);
      }
    });
  };


  const handleEditStudent = async (student: any) => {
    setSelectedStudent(student);
    
    // Buscar vínculos atuais do estudante
    try {
      const response = await fetch(`/api/admin/students/${student.id}/enrollments`, {
        credentials: 'include'
      });
      
      let currentClasses = [];
      let currentSubjects = [];
      
      if (response.ok) {
        const enrollments = await response.json();
        currentClasses = enrollments.classes?.map((c: any) => c.classId) || [];
        currentSubjects = enrollments.subjects?.map((s: any) => s.id) || [];
      }
      
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone || '',
        address: student.address || '',
        email: student.email || '',
        status: student.status || 'active',
        classId: student.classId || student.class?.id || '',
        selectedClasses: currentClasses,
        selectedSubjects: currentSubjects
      });
    } catch (error) {
      console.error('Erro ao buscar vínculos:', error);
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone || '',
        address: student.address || '',
        email: student.email || '',
        status: student.status || 'active',
        classId: student.classId || student.class?.id || '',
        selectedClasses: [],
        selectedSubjects: []
      });
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    updateStudentMutation.mutate({
      studentId: selectedStudent.id,
      studentData: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        classId: formData.classId || undefined,
        // Marcar como pendente de aprovação se houve mudanças significativas
        status: 'pendente'
      }
    }, {
      onSuccess: async () => {
        // Atualizar vínculos se foram alterados
        if (formData.selectedClasses && formData.selectedClasses.length > 0) {
          try {
            await fetch(`/api/admin/students/${selectedStudent.id}/enrollments`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                classes: formData.selectedClasses,
                subjects: formData.selectedSubjects
              }),
            });
          } catch (error) {
            console.error('Erro ao atualizar vínculos:', error);
          }
        }
        
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
        toast.success('Estudante atualizado com sucesso! Aguardando nova aprovação do diretor.');
      }
    });
  };

  const handleDeleteStudent = async (student: any) => {
    setStudentToDelete(student);
    
    try {
      // Verificar dependências
      const response = await fetch(`/api/users/${student.id}/dependencies`, {
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
          setIsPasswordDialogOpen(true);
        }
      } else {
        // Erro na verificação - usar exclusão simples
        setIsPasswordDialogOpen(true);
      }
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      // Em caso de erro, usar exclusão simples
    setIsPasswordDialogOpen(true);
    }
  };

  const handleConfirmDeleteStudent = (password: string, confirmText?: string) => {
    if (!studentToDelete) return;
    
    // Ignorar confirmText no payload; o endpoint de estudantes só requer senha
    deleteStudentMutation.mutate({
      studentId: studentToDelete.id,
      password
    }, {
      onSuccess: () => {
        setIsPasswordDialogOpen(false);
        setIsDependenciesDialogOpen(false);
        setStudentToDelete(null);
        setDependenciesData(null);
      }
    });
  };

  const confirmDeleteStudent = async (password: string) => {
    if (!studentToDelete) return;

    try {
      await deleteUserMutation.mutateAsync({ 
        id: studentToDelete.id, 
        password: password 
      });
      setIsPasswordDialogOpen(false);
      setStudentToDelete(null);
      toast.success('Aluno excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
      toast.error('Erro ao excluir aluno. Verifique sua senha.');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Alunos</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os alunos da escola</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
              <CreateButton loading={createUserMutation.isPending}>
              Novo Aluno
            </CreateButton>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Aluno</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo aluno. Todos os campos marcados com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    placeholder="Ex: Ana"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    placeholder="Ex: Costa"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>


              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="Ex: (11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  maxLength={15}
                />
              </div>

            <div>
              <Label htmlFor="class">Turma *</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((classItem: any) => (
                      <SelectItem key={classItem.id} value={classItem.id}>{classItem.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>
                      Nenhuma turma disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {classes.length === 0 && !classesLoading && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ Nenhuma turma encontrada. Crie turmas primeiro em "Turmas".
                </p>
              )}
              {classesError && (
                <p className="text-xs text-red-500 mt-1">
                  ❌ Erro ao carregar turmas: {classesError}
                </p>
              )}
              {classesLoading && (
                <p className="text-xs text-blue-500 mt-1">
                  🔄 Carregando turmas...
                </p>
              )}
            </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Ex: Rua das Flores, 123"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800">Informações de Acesso</span>
                </div>
                <p className="text-sm text-blue-700">
                  <strong>Senha padrão:</strong> 123<br/>
                  <strong>Email:</strong> Sempre termina com @escola.com<br/>
                  <strong>Matrícula:</strong> Gerada automaticamente (6 dígitos aleatórios únicos)
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <CreateButton 
                onClick={handleCreateStudent}
                loading={createUserMutation.isPending}
                size="md"
              >
                {createUserMutation.isPending ? 'Criando...' : 'Criar Aluno'}
              </CreateButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar alunos..." 
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
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="transferred">Transferidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {classes.map((classItem: any) => (
                  <SelectItem key={classItem.id} value={classItem.id}>{classItem.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alunos */}
      {filteredStudents.length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum aluno encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' || filterClass !== 'all'
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando o primeiro aluno da escola.'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterClass === 'all' && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStudents.map((student: any) => (
            <Card key={student.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback className="bg-green-100 text-green-600">
                        {getUserInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-gray-600">{student.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={getStatusColor(student.status)}>
                          {getStatusText(student.status)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Matrícula: {student.registrationNumber}
                        </span>
                      </div>
                      
                      {/* Informações da Turma */}
                      <div className="mt-3">
                        {student.classInfo ? (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                {student.classInfo.classGrade}º {student.classInfo.classSection}
                              </span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Matriculado em: {new Date(student.classInfo.enrollmentDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Nenhuma turma atribuída</span>
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
                        setSelectedStudent(student);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteStudent(student)}
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



      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Nome *</Label>
                <Input
                  id="edit-firstName"
                  placeholder="Ex: Ana"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Sobrenome *</Label>
                <Input
                  id="edit-lastName"
                  placeholder="Ex: Costa"
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
                placeholder="Ex: aluno@escola.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                placeholder="Ex: (11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={15}
              />
            </div>

            <div>
              <Label htmlFor="edit-class">Turma Principal *</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma">
                    {formData.classId ? classes.find((c: any) => c.id === formData.classId)?.name : "Selecione a turma"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.length > 0 ? (
                    classes.map((classItem: any) => (
                      <SelectItem key={classItem.id} value={classItem.id}>{classItem.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>
                      Nenhuma turma disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                  <SelectItem value="suspended">Suspenso</SelectItem>
                  <SelectItem value="transferred">Transferido</SelectItem>
                  <SelectItem value="pendente">Pendente de Aprovação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seção de Disciplinas com Busca */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Disciplinas (Opcional)</Label>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar disciplinas..."
                    value={subjectSearchTerm}
                    onChange={(e) => handleSubjectSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {subjectSearchTerm && (
                  <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map((subject: any) => (
                        <div key={subject.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`subject-${subject.id}`}
                            checked={formData.selectedSubjects?.includes(subject.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSubjects: [...(prev.selectedSubjects || []), subject.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSubjects: (prev.selectedSubjects || []).filter(id => id !== subject.id)
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
                      <p className="text-gray-500 text-sm">Nenhuma disciplina encontrada</p>
                    )}
                  </div>
                )}

                {/* Disciplinas Selecionadas */}
                {formData.selectedSubjects && formData.selectedSubjects.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Disciplinas Selecionadas:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.selectedSubjects.map((subjectId: string) => {
                        const subject = subjects.find((s: any) => s.id === subjectId);
                        return subject ? (
                          <Badge key={subjectId} variant="secondary" className="flex items-center gap-1">
                            {subject.name}
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedSubjects: (prev.selectedSubjects || []).filter(id => id !== subjectId)
                                }));
                              }}
                              className="ml-1 hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateStudent}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateStudentMutation.isPending}
            >
              {updateStudentMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Detalhes do Aluno
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.avatar} />
                  <AvatarFallback className="bg-green-100 text-green-600 text-lg">
                    {getUserInitials(selectedStudent.firstName, selectedStudent.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                  <Badge className={getStatusColor(selectedStudent.status)}>
                    {getStatusText(selectedStudent.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Matrícula</Label>
                  <p className="text-gray-900">{selectedStudent.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-gray-900">{selectedStudent.phone || 'Não informado'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  <p className="text-gray-900">{selectedStudent.address || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-gray-900">
                    {new Date(selectedStudent.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p className="text-gray-900">
                    {selectedStudent.updatedAt ? new Date(selectedStudent.updatedAt).toLocaleDateString('pt-BR') : 'Não disponível'}
                  </p>
                </div>
                
                {/* Informações da Turma */}
                {studentDetails?.class && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Turma</Label>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          {studentDetails.class.classGrade}º {studentDetails.class.classSection}
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Matriculado em: {new Date(studentDetails.class.enrollmentDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {!studentDetails?.class && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Turma</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Nenhuma turma atribuída</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Dependências */}
      <Dialog open={isDependenciesDialogOpen} onOpenChange={setIsDependenciesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Exclusão com Vínculos</DialogTitle>
            <DialogDescription>
              Este aluno possui vínculos no sistema que serão removidos:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {dependenciesData?.dependencies.enrollments > 0 && (
              <div className="flex justify-between">
                <span>Matrículas em turmas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.enrollments}</span>
              </div>
            )}
            {dependenciesData?.dependencies.grades > 0 && (
              <div className="flex justify-between">
                <span>Notas:</span>
                <span className="font-semibold">{dependenciesData.dependencies.grades}</span>
              </div>
            )}
            {dependenciesData?.dependencies.attendance > 0 && (
              <div className="flex justify-between">
                <span>Registros de frequência:</span>
                <span className="font-semibold">{dependenciesData.dependencies.attendance}</span>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDependenciesDialogOpen(false);
                setStudentToDelete(null);
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
          setStudentToDelete(null);
        }}
        onConfirm={(password) => {
          handleConfirmDeleteStudent(password);
        }}
        onConfirmWithText={(password, confirmText) => {
          handleConfirmDeleteStudent(password, confirmText);
        }}
        requireConfirmText={!!dependenciesData?.hasDependencies}
        title="Excluir Aluno"
        description="Para excluir este aluno, confirme sua senha de administrador."
        itemName={studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : ''}
        isLoading={deleteStudentMutation.isPending}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

    </div>
  );
};

export default StudentsPage;
