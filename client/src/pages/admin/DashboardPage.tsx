import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Activity,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  UserCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminDashboard, useDeleteUser, useCreateUser, useCheckUserDependencies } from '@/hooks/useAdminApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import CreateButton from '@/components/ui/create-button';

const DashboardPage = () => {
  const { data: dashboardData, isLoading, error } = useAdminDashboard();
  const deleteUserMutation = useDeleteUser();
  const createUserMutation = useCreateUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [userDependencies, setUserDependencies] = useState<any>(null);
  const [isCheckingDependencies, setIsCheckingDependencies] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'student' as 'admin' | 'coordinator' | 'teacher' | 'student',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
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
        <p className="text-red-600">Erro ao carregar dashboard</p>
      </div>
    );
  }

  const stats = dashboardData?.data || {
    totalUsers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    usersByRole: {}
  };

  const recentUsers = dashboardData?.data?.recentUsers || [];
  
  // Debug: verificar dados dos usuários
  console.log('📊 Dashboard data:', dashboardData?.data);
  console.log('👥 Recent users:', recentUsers);
  if (recentUsers.length > 0) {
    console.log('🔍 Primeiro usuário:', recentUsers[0]);
    console.log('📱 Telefone do primeiro:', recentUsers[0].phone);
    console.log('🏠 Endereço do primeiro:', recentUsers[0].address);
    console.log('🎓 Matrícula do primeiro:', recentUsers[0].registrationNumber);
  }
  
  // Filtrar usuários baseado na busca
  const filteredUsers = recentUsers.filter((user: any) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search);
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador': return 'bg-red-100 text-red-800 border-red-200';
      case 'Coordenador': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Professor': return 'bg-green-100 text-green-800 border-green-200';
      case 'Aluno': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Ativo' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  // Funções auxiliares
  const availableRoles = [
    { value: 'student', label: 'Aluno' },
    { value: 'teacher', label: 'Professor' },
    { value: 'coordinator', label: 'Coordenador' },
    { value: 'admin', label: 'Administrador' }
  ];

  const availableStatuses = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'suspended', label: 'Suspenso' }
  ];

  const handlePhoneChange = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Aplica a máscara (11) 99999-9999
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
    
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleCreateUser = () => {
    setIsCreateUserDialogOpen(true);
  };

  const handleCloseCreateUserDialog = () => {
    setIsCreateUserDialogOpen(false);
    setFormData({
      firstName: '',
      lastName: '',
      role: 'student',
      phone: '',
      address: '',
      status: 'active'
    });
    setEmailExists(false);
    setEmailCheckResult(null);
  };

  const handleCloseEditUserDialog = () => {
    setIsEditUserDialogOpen(false);
    setUserToEdit(null);
    setFormData({
      firstName: '',
      lastName: '',
      role: 'student',
      phone: '',
      address: '',
      status: 'active'
    });
    setEmailExists(false);
    setEmailCheckResult(null);
  };

  const handleUpdateUser = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Nome e sobrenome são obrigatórios');
      return;
    }


    console.log('🚀 Atualizando usuário:', userToEdit.id);
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      status: formData.status
    };
    console.log('📤 Dados sendo enviados:', userData);
    
    try {
      const response = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar usuário');
      }

      const result = await response.json();
      console.log('✅ Usuário atualizado:', result);
      toast.success('Usuário atualizado com sucesso!');
      handleCloseEditUserDialog();
      
      // Invalidar cache e recarregar dados
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      // Recarregar dados do dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Erro ao atualizar usuário:', error);
      toast.error(error.message || 'Erro ao atualizar usuário');
    }
  };


  const handleCreateUserSubmit = () => {
    console.log('🔍 handleCreateUserSubmit chamado');
    console.log('📝 formData:', formData);
    
    if (!formData.firstName || !formData.lastName) {
      console.log('❌ Nome ou sobrenome vazio');
      toast.error('Nome e sobrenome são obrigatórios');
      return;
    }


    console.log('🚀 Chamando createUserMutation.mutate');
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      status: formData.status
    };
    console.log('📤 Dados sendo enviados:', userData);
    
    createUserMutation.mutate(userData, {
      onSuccess: () => {
        setIsCreateUserDialogOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'student',
          phone: '',
          address: '',
          status: 'active'
        });
        setEmailExists(false);
        setEmailCheckResult(null);
        toast.success('Usuário criado com sucesso!');
      },
      onError: (error: any) => {
        console.error('Erro ao criar usuário:', error);
        toast.error(error.message || 'Erro ao criar usuário');
      }
    });
  };

  const handleCreateClass = () => {
    setLocation('/admin/classes');
    toast.info('Redirecionando para criação de turma...');
  };

  const handleCreateSubject = () => {
    setLocation('/admin/subjects');
    toast.info('Redirecionando para criação de disciplina...');
  };

  const goTeachers = () => {
    setLocation('/admin/teachers');
    toast.info('Indo para Professores...');
  };

  const goStudents = () => {
    setLocation('/admin/students');
    toast.info('Indo para Alunos...');
  };

  const goCoordinators = () => {
    setLocation('/admin/coordinators');
    toast.info('Indo para Coordenadores...');
  };

  const handleViewUser = (user: any) => {
    console.log('👁️ Visualizando usuário:', user);
    console.log('📱 Telefone:', user.phone);
    console.log('🏠 Endereço:', user.address);
    console.log('🎓 Matrícula:', user.registrationNumber);
    setUserDetails(user);
    setIsViewDetailsOpen(true);
  };

  const handleEditUser = (user: any) => {
    setUserToEdit(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'student',
      phone: user.phone || '',
      address: user.address || '',
      status: user.status || 'active'
    });
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = async (user: any) => {
    setUserToDelete(user);
    setIsCheckingDependencies(true);
    
    try {
      const response = await fetch(`/api/users/${user.id}/dependencies`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao verificar dependências');
      }
      
      const dependencies = await response.json();
      setUserDependencies(dependencies);
    setIsDeleteDialogOpen(true);
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      toast.error('Erro ao verificar dependências do usuário');
    } finally {
      setIsCheckingDependencies(false);
    }
  };


  const confirmDeleteUser = (password: string, confirmText?: string) => {
    if (userToDelete) {
      const deleteData: any = { 
        userId: userToDelete.id, 
        password: password
      };
      
      // Se o usuário tem dependências ou é coordenador, incluir confirmText
      if (userDependencies?.hasDependencies || userDependencies?.dependencies?.isCoordinator) {
        deleteData.confirmText = confirmText;
      }
      
      deleteUserMutation.mutate(deleteData, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
          setUserDependencies(null);
          toast.success('Usuário excluído com sucesso!');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Erro ao excluir usuário');
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">Gerencie usuários, turmas e disciplinas</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleCreateClass}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Turma
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-green-600 mt-1">+12% este mês</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Turmas</CardTitle>
            <GraduationCap className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalClasses}</div>
            <p className="text-xs text-red-600 mt-1">-5% este mês</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Disciplinas</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</div>
            <p className="text-xs text-green-600 mt-1">+8% este mês</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sistema Ativo</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.systemStatus}</div>
            <p className="text-xs text-green-600 mt-1">Online</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Section */}
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Usuários Recentes</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar usuários..." 
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Função</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email || 'Pendente'}</td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateClass}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              + Nova Turma
            </Button>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateSubject}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              + Nova Disciplina
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={goTeachers}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Professores
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={goStudents}
            >
              <Users className="h-4 w-4 mr-2" />
              Alunos
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={goCoordinators}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Coordenadores
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação para Excluir Usuário */}
      <PasswordConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setUserDependencies(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Excluir Usuário"
        description={
          userDependencies?.hasDependencies 
            ? `Este usuário possui vínculos no sistema. Confirme sua senha e digite "confirmar" para prosseguir com a exclusão.`
            : "Para excluir este usuário, confirme sua senha de administrador. Esta ação não pode ser desfeita."
        }
        itemName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}
        isLoading={deleteUserMutation.isPending || isCheckingDependencies}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        showConfirmText={userDependencies?.hasDependencies || userDependencies?.dependencies?.isCoordinator}
        dependencies={userDependencies?.dependencies}
        userRole={userDependencies?.userRole}
      />

      {/* Modal de Criação de Usuário */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={handleCloseCreateUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário. Todos os campos marcados com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome *</Label>
                <Input
                  id="firstName"
                  placeholder="Ex: João"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Sobrenome *</Label>
                <Input
                  id="lastName"
                  placeholder="Ex: Silva"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Função *</Label>
                <Select value={formData.role} onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, role: value }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-800">Informações de Acesso</span>
              </div>
              <p className="text-sm text-blue-700">
                <strong>Senha padrão:</strong> 123<br/>
                <strong>Email:</strong> Sempre termina com @escola.com<br/>
                <strong>Matrícula:</strong> Gerada automaticamente (6 dígitos aleatórios)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateUserDialog}>
              Cancelar
            </Button>
            <CreateButton 
              onClick={handleCreateUserSubmit} 
              loading={createUserMutation.isPending}
              size="md"
              disabled={!formData.firstName || !formData.lastName}
            >
              {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </CreateButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Usuário */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          
          {userDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nome Completo</Label>
                  <p className="text-sm text-gray-900">{userDetails.firstName} {userDetails.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm text-gray-900">{userDetails.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Função</Label>
                  <p className="text-sm text-gray-900 capitalize">{userDetails.role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge className={getStatusColor(userDetails.status)}>
                    {userDetails.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                  <p className="text-sm text-gray-900">{userDetails.phone || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Endereço</Label>
                  <p className="text-sm text-gray-900">{userDetails.address || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Matrícula</Label>
                  <p className="text-sm text-gray-900">{userDetails.registrationNumber || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Criação</Label>
                  <p className="text-sm text-gray-900">
                    {userDetails.createdAt ? new Date(userDetails.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Usuário */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário. Todos os campos marcados com * são obrigatórios.
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


            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-role">Função *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                    <SelectItem value="coordinator">Coordenador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="suspended">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                placeholder="Ex: Rua das Flores, 123"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditUserDialog}>
              Cancelar
            </Button>
            <CreateButton 
              onClick={handleUpdateUser} 
              size="md"
              disabled={!formData.firstName || !formData.lastName}
            >
              Atualizar Usuário
            </CreateButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
