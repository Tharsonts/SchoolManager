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
  Eye,
  Trash2,
  UserCheck,
  Users,
  MapPin,
  Calendar
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAdminUsers, useCreateUser, useDeleteUser, useUpdateUser } from '@/hooks/useAdminApi';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { PasswordConfirmationDialog } from '@/components/ui/PasswordConfirmationDialog';

interface Coordinator {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  email?: string;
  cpf?: string;
  birthDate?: string;
  status: 'active' | 'inactive' | 'pendente';
  registrationNumber: string;
  createdAt: string;
  updatedAt: string;
}

const CoordinatorsPage = () => {
  const { data: usersData, isLoading } = useAdminUsers();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Filtrar apenas coordenadores
  const coordinators = usersData?.data?.filter((user: any) => user.role === 'coordinator') || [];

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [coordinatorToDelete, setCoordinatorToDelete] = useState<Coordinator | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    email: '',
    cpf: '',
    birthDate: '',
    status: 'active' as 'active' | 'inactive'
  });

  const handlePhoneChange = (value: string) => {
    // Formatar telefone
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 0) {
      if (cleaned.length <= 2) {
        formatted = `(${cleaned}`;
      } else if (cleaned.length <= 7) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
      } else if (cleaned.length <= 11) {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
      } else {
        formatted = `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
      }
    }
    
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handleCreateCoordinator = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createUserMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: 'coordinator',
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      status: formData.status
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          email: '',
          cpf: '',
          birthDate: '',
          status: 'active'
        });
      }
    });
  };

  const handleEditCoordinator = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    setFormData({
      firstName: coordinator.firstName,
      lastName: coordinator.lastName,
      phone: coordinator.phone || '',
      address: coordinator.address || '',
      email: coordinator.email || '',
      cpf: coordinator.cpf || '',
      birthDate: coordinator.birthDate || '',
      status: coordinator.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCoordinator = async () => {
    if (!selectedCoordinator) return;

    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Verificar se houve mudanças significativas que requerem nova aprovação
    const hasSignificantChanges = 
      formData.firstName !== selectedCoordinator.firstName ||
      formData.lastName !== selectedCoordinator.lastName ||
      formData.email !== (selectedCoordinator.email || '') ||
      formData.cpf !== (selectedCoordinator.cpf || '') ||
      formData.status !== selectedCoordinator.status;

    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: 'coordinator',
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      email: formData.email || undefined,
      cpf: formData.cpf || undefined,
      birthDate: formData.birthDate || undefined,
      status: hasSignificantChanges ? 'pendente' : formData.status // Requer nova aprovação se houve mudanças significativas
    };

    updateUserMutation.mutate({
      userId: selectedCoordinator.id,
      userData: updateData
    }, {
      onSuccess: () => {
        if (hasSignificantChanges) {
          toast.success('Coordenador atualizado! As alterações foram enviadas para aprovação do diretor.');
        } else {
          toast.success('Coordenador atualizado com sucesso!');
        }
        setIsEditDialogOpen(false);
        setSelectedCoordinator(null);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          email: '',
          cpf: '',
          birthDate: '',
          status: 'active'
        });
      }
    });
  };

  const handleViewCoordinator = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    setIsViewDialogOpen(true);
  };

  const handleDeleteCoordinator = (coordinator: Coordinator) => {
    setCoordinatorToDelete(coordinator);
    setIsPasswordDialogOpen(true);
  };

  const handleConfirmDeleteCoordinator = (password: string) => {
    if (!coordinatorToDelete) return;
    
    deleteUserMutation.mutate({
      userId: coordinatorToDelete.id,
      password
    }, {
      onSuccess: () => {
        setIsPasswordDialogOpen(false);
        setCoordinatorToDelete(null);
      }
    });
  };

  // Filtros
  const filteredCoordinators = coordinators.filter(coordinator => {
    const matchesSearch = 
      coordinator.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coordinator.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || coordinator.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Coordenadores</h1>
          <p className="text-gray-600 mt-1">Gerencie todos os coordenadores da escola</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <CreateButton loading={createUserMutation.isPending}>
              Novo Coordenador
            </CreateButton>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Coordenador</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo coordenador. Todos os campos marcados com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    placeholder="Ex: Maria"
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
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateCoordinator}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? 'Criando...' : 'Criar Coordenador'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Buscar coordenadores..." 
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

      {/* Lista de coordenadores */}
      {filteredCoordinators.length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum coordenador encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando o primeiro coordenador da escola.'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Coordenador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCoordinators.map((coordinator) => (
            <Card key={coordinator.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {coordinator.firstName[0]}{coordinator.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {coordinator.firstName} {coordinator.lastName}
                      </h3>
                      <p className="text-gray-600">{coordinator.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={
                          coordinator.status === 'active' ? 'bg-green-100 text-green-800' : 
                          coordinator.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }>
                          {coordinator.status === 'active' ? 'Ativo' : 
                           coordinator.status === 'pendente' ? 'Aprovar' : 
                           'Inativo'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Matrícula: {coordinator.registrationNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCoordinator(coordinator)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCoordinator(coordinator)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoordinator(coordinator)}
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
      )}

      {/* Modal de visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-purple-600" />
              Detalhes do Coordenador
            </DialogTitle>
          </DialogHeader>
          
          {selectedCoordinator && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                    {selectedCoordinator.firstName[0]}{selectedCoordinator.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCoordinator.firstName} {selectedCoordinator.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedCoordinator.email}</p>
                  <Badge className={selectedCoordinator.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {selectedCoordinator.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Matrícula</Label>
                  <p className="text-gray-900">{selectedCoordinator.registrationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-gray-900">{selectedCoordinator.phone || 'Não informado'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  <p className="text-gray-900">{selectedCoordinator.address || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-gray-900">
                    {new Date(selectedCoordinator.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p className="text-gray-900">
                    {new Date(selectedCoordinator.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
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

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Coordenador</DialogTitle>
            <DialogDescription>
              Atualize os dados do coordenador {selectedCoordinator?.firstName} {selectedCoordinator?.lastName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Nome *</Label>
                <Input
                  id="edit-firstName"
                  placeholder="Ex: Maria"
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
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Ex: coordenador@escola.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  placeholder="Ex: 123.456.789-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                />
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
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateCoordinator}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PasswordConfirmationDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setCoordinatorToDelete(null);
        }}
        onConfirm={handleConfirmDeleteCoordinator}
        title="Excluir Coordenador"
        description="Para excluir este coordenador, confirme sua senha de administrador."
        itemName={coordinatorToDelete ? `${coordinatorToDelete.firstName} ${coordinatorToDelete.lastName}` : ''}
        isLoading={deleteUserMutation.isPending}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

    </div>
  );
};

export default CoordinatorsPage;






