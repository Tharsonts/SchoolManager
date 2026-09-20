import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Users } from 'lucide-react';
import { useDirectorUsers } from '@/hooks/useDirectorApi';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function UsersDirectory() {
  const { data, isLoading } = useDirectorUsers();
  const allUsers = (data?.data || []) as any[];

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const roles = ['all', 'admin', 'director', 'coordinator', 'teacher', 'student'];

  const roleLabel = (role: string) => {
    const m: Record<string, string> = {
      admin: 'Admin',
      director: 'Diretor',
      coordinator: 'Coordenador',
      teacher: 'Professor',
      student: 'Aluno',
    };
    return m[role] || role;
  };

  const roleStyles = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          badge: 'bg-purple-100 text-purple-700',
          circle: 'bg-purple-100 text-purple-700',
        };
      case 'director':
        return {
          badge: 'bg-indigo-100 text-indigo-700',
          circle: 'bg-indigo-100 text-indigo-700',
        };
      case 'coordinator':
        return {
          badge: 'bg-teal-100 text-teal-700',
          circle: 'bg-teal-100 text-teal-700',
        };
      case 'teacher':
        return {
          badge: 'bg-blue-100 text-blue-700',
          circle: 'bg-blue-100 text-blue-700',
        };
      case 'student':
        return {
          badge: 'bg-emerald-100 text-emerald-700',
          circle: 'bg-emerald-100 text-emerald-700',
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-700',
          circle: 'bg-gray-100 text-gray-700',
        };
    }
  };

  const filtered = useMemo(() => {
    return allUsers
      .filter(u => (roleFilter === 'all' ? true : u.role === roleFilter))
      .filter(u => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
          (u.firstName + ' ' + u.lastName).toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term) ||
          (u.registrationNumber || '').toLowerCase().includes(term)
        );
      });
  }, [allUsers, roleFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5" /> Usuários</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Diretório de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <Input placeholder="Buscar por nome, email, registro" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            <select className="w-56 border rounded-md h-10 px-3" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {roles.map(r => (<option key={r} value={r}>{r === 'all' ? 'Todos os cargos' : r}</option>))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-6">Carregando...</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((u: any) => {
                const styles = roleStyles(u.role);
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${styles.circle} rounded-full flex items-center justify-center font-semibold`}>
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{u.firstName} {u.lastName}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${styles.badge}`}>{roleLabel(u.role)}</span>
                        </div>
                        <div className="text-sm text-gray-500">{u.email || 'sem email'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500">Registro: {u.registrationNumber || '—'}</div>
                      <Button variant="outline" onClick={() => setSelectedUser(u)}>
                        <Eye className="w-4 h-4 mr-2" /> Ver detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="py-6 text-gray-600">Nenhum usuário encontrado</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações de contato e perfil</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {(() => {
                const styles = roleStyles(selectedUser.role);
                return (
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${styles.circle} rounded-full flex items-center justify-center text-lg font-semibold`}>
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${styles.badge}`}>{roleLabel(selectedUser.role)}</span>
                      </div>
                      <div className="text-sm text-gray-500">Registro: {selectedUser.registrationNumber || '—'}</div>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm">{selectedUser.email || 'sem email'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Telefone</div>
                  <div className="text-sm">{selectedUser.phone || '—'}</div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-gray-500">Endereço</div>
                  <div className="text-sm">{selectedUser.address || '—'}</div>
                </div>
              </div>
              <div className="space-y-2">
                {selectedUser.classInfo && (
                  <div>
                    <div className="text-xs text-gray-500">Turma</div>
                    <div className="text-sm">{selectedUser.classInfo.className || selectedUser.classInfo.name} • {selectedUser.classInfo.classGrade || selectedUser.classInfo.grade}{selectedUser.classInfo.classSection ? ` • ${selectedUser.classInfo.classSection}` : ''}</div>
                  </div>
                )}
                {selectedUser.teacherSubjects && selectedUser.teacherSubjects.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500">Disciplinas</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.teacherSubjects.map((s: any) => (
                        <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{s.name}{s.className ? ` • ${s.className}` : ''}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
