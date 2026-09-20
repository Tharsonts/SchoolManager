import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, UserPlus } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAdminUsers, useCreateUser, useAdminCapabilities } from '@/hooks/useAdminApi';
import { useAuth } from '@/hooks/useAuth';

export default function AdministratorsPage() {
  const { data: usersRes, isLoading } = useAdminUsers();
  const { data: capsData } = useAdminCapabilities();
  const caps = capsData?.data;
  const createUser = useCreateUser();
  const { user } = useAuth();

  const admins = useMemo(() => {
    const list = usersRes?.data || [];
    return list.filter((u: any) => u.role === 'admin' && u.id !== (user as any)?.id);
  }, [usersRes, user]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // Email será gerado automaticamente: nome.sobrenome@escola.com
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleCreateAdmin = () => {
    if (!caps?.canManageAdmins) return;
    if (!firstName || !lastName) return;
    createUser.mutate({
      firstName,
      lastName,
      phone: phone || undefined,
      address: address || undefined,
      role: 'admin',
      status: 'active'
    } as any, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setFirstName('');
        setLastName('');
        setPhone('');
        setAddress('');
      }
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ userId, password, confirmText }: { userId: string; password: string; confirmText: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, confirmText })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || 'Erro ao excluir administrador');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Administrador excluído');
      setIsDeleteDialogOpen(false);
      setDeletePassword('');
      setDeleteConfirmText('');
      setDeleteUserId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao excluir administrador');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5" /> Administradores</h1>
        {caps?.canManageAdmins && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Administrador</DialogTitle>
                <DialogDescription>Preencha os dados básicos. O email será gerado automaticamente como nome.sobrenome@escola.com após a aprovação do Diretor.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input placeholder="Ex: Ana" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Sobrenome *</Label>
                    <Input placeholder="Ex: Administradora" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input placeholder="Ex: (11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input placeholder="Ex: Rua das Flores, 123" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Senha padrão: 123. Email final será nome.sobrenome@escola.com.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateAdmin} disabled={createUser.isPending || !firstName || !lastName} className="bg-purple-600 text-white">{createUser.isPending ? 'Criando...' : 'Criar Admin'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Administradores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6">Carregando...</div>
          ) : (
            <div className="space-y-3">
              {admins.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {u.firstName} {u.lastName}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{u.status === 'pendente' ? 'Aguardando aprovação' : 'Ativo'}</span>
                      </div>
                      <div className="text-sm text-gray-500">{u.email || 'sem email'}</div>
                    </div>
                  </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">Registro: {u.registrationNumber}</div>
                  {caps?.canManageAdmins && (
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeleteUserId(u.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Excluir administrador"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                </div>
              ))}
              {admins.length === 0 && (
                <div className="py-6 text-gray-600">Nenhum administrador encontrado</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {caps?.canManageAdmins && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir Administrador</DialogTitle>
              <DialogDescription>Digite sua senha e confirme com "confirmar" para excluir.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Sua senha</Label>
                <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirmação</Label>
                <Input placeholder="Digite confirmar" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => deleteMutation.mutate({ userId: deleteUserId!, password: deletePassword, confirmText: deleteConfirmText })} disabled={!deleteUserId || !deletePassword || deleteConfirmText !== 'confirmar' || deleteMutation.isPending} className="bg-red-600 text-white">
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
