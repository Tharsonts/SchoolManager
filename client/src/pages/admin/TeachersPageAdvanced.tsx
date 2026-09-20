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
import { useAdminTeachers, useCreateTeacher, useDeleteTeacher, useAdminTeacherDetails } from '@/hooks/useAdminApi';
import { useAdminSubjectsSimple, useAdminClassesSimple } from '@/hooks/useAdminApiSimple';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// Importar o sistema avançado
import AdvancedTeacherIntegration from '@/components/admin/AdvancedTeacherIntegration';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
}

const TeachersPageAdvanced: React.FC = () => {
  // Estados existentes
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Form data para o sistema antigo (mantido para compatibilidade)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  });

  // Hooks existentes
  const { data: teachers, isLoading, error, refetch } = useAdminTeachers();
  const { data: subjects, isLoading: subjectsLoading } = useAdminSubjectsSimple();
  const { data: classes, isLoading: classesLoading } = useAdminClassesSimple();
  const createTeacherMutation = useCreateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();
  const { data: teacherDetailsData, isLoading: teacherDetailsLoading } = useAdminTeacherDetails(selectedTeacher?.id);

  // Função para recarregar dados após criação
  const handleTeacherCreated = () => {
    refetch();
    toast.success('Professor criado com sucesso!');
  };

  // Função existente para criar professor (sistema antigo)
  const handleCreateTeacher = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const autoSubjects = subjects && subjects.length > 0 ? [subjects[0].id] : [];
    const autoClasses = classes && classes.length > 0 ? [classes[0].id] : [];

    createTeacherMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      subjects: autoSubjects,
      classes: autoClasses,
    }, {
      onSuccess: () => {
        toast.success('Professor criado com sucesso!');
        setIsCreateDialogOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: ''
        });
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Erro ao criar professor');
      }
    });
  };

  // Função para deletar professor
  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    deleteTeacherMutation.mutate(teacherToDelete.id, {
      onSuccess: () => {
        toast.success('Professor excluído com sucesso!');
        setIsDeleteDialogOpen(false);
        setTeacherToDelete(null);
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || 'Erro ao excluir professor');
      }
    });
  };

  // Filtros
  const filteredTeachers = teachers?.filter(teacher => {
    const matchesSearch = 
      teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) || [];

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
      {/* Header com sistema avançado integrado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Professores</h1>
          <p className="text-gray-600 mt-1">Gerencie os professores da escola</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sistema antigo (mantido) */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <CreateButton loading={createTeacherMutation.isPending}>
                Novo Professor
              </CreateButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Professor</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo professor. Campos marcados com * são obrigatórios.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
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
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Digite o email"
                  />
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <CreateButton 
                  onClick={handleCreateTeacher}
                  loading={createTeacherMutation.isPending}
                  size="md"
                >
                  {createTeacherMutation.isPending ? 'Criando...' : 'Criar Professor'}
                </CreateButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Sistema avançado (novo) */}
          <AdvancedTeacherIntegration onTeacherCreated={handleTeacherCreated} />
        </div>
      </div>

      {/* Resto do componente permanece igual */}
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
                      <Badge className={teacher.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {teacher.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Matrícula: {teacher.registrationNumber}
                      </span>
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
                    Ver
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTeacherToDelete(teacher);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {filteredTeachers.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum professor encontrado
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro professor.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de visualização (mantido) */}
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
                  <Badge className={selectedTeacher.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {selectedTeacher.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-gray-900">{new Date(selectedTeacher.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
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

      {/* Modal de confirmação de exclusão */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setTeacherToDelete(null);
        }}
        onConfirm={confirmDeleteTeacher}
        title="Excluir Professor"
        description="Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita."
        itemName={teacherToDelete ? `${teacherToDelete.firstName} ${teacherToDelete.lastName}` : undefined}
        isLoading={deleteTeacherMutation.isPending}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
};

export default TeachersPageAdvanced;




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

