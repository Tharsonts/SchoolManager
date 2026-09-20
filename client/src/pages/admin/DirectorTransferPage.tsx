import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { UserCheck } from 'lucide-react';
import { useAdminUsers, useAdminCapabilities } from '@/hooks/useAdminApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function DirectorTransferPage() {
  const { data: usersRes, isLoading } = useAdminUsers();
  const { data: capsData } = useAdminCapabilities();
  const caps = capsData?.data;
  const isMaster = !!caps?.canTransferDirector;

  const users = usersRes?.data || [];
  const currentDirector = users.find((u: any) => u.role === 'director');
  const candidates = useMemo(() => users.filter((u: any) => u.status === 'active' && u.role !== 'student'), [users]);

  const [newDirectorId, setNewDirectorId] = useState('');
  const [demoteRole, setDemoteRole] = useState('coordinator');
  const [promotionRole, setPromotionRole] = useState('coordinator');
  const [promotionDemoteRole, setPromotionDemoteRole] = useState('coordinator');
  const [confirmText, setConfirmText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userQuery, setUserQuery] = useState('');
  const MAX_RESULTS = 5;
  const queryClient = useQueryClient();
  const handleUserSelect = (id: string) => {
    setNewDirectorId(id);
    setUserQuery('');
  };

  const roleLabel = (r: string) => {
    if (r === 'teacher') return 'Professor';
    if (r === 'coordinator') return 'Coordenador';
    if (r === 'admin') return 'Administrador';
    if (r === 'director') return 'Diretor';
    return r;
  };

  const displayNameById = (id: string) => {
    const u = users.find((x: any) => x.id === id);
    const full = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
    return full || u?.email || id;
  };

  const filteredCandidates = useMemo(() => {
    let list = candidates;
    if (roleFilter !== 'all') list = list.filter((u: any) => u.role === roleFilter);
    list = [...list].sort((a: any, b: any) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    return list;
  }, [candidates, roleFilter]);

  const normalize = (str: string | undefined) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[º°•()\-_,.;:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const userMatches = useMemo(() => {
    const q = normalize(userQuery);
    if (!q) return [] as any[];
    const tokens = q.split(' ').filter(Boolean);
    return filteredCandidates.filter((u: any) => {
      if (promotionRole === 'director' && u.role === 'director') return false;
      const hay = normalize(`${u.firstName} ${u.lastName} ${u.email || ''} ${roleLabel(u.role)}`);
      return tokens.every(t => hay.includes(t));
    });
  }, [filteredCandidates, userQuery]);

  const userMatchesLimited = useMemo(() => userMatches.slice(0, MAX_RESULTS), [userMatches]);

  

  const transferMutation = useMutation({
    mutationFn: async ({ newDirectorId, demoteRole, confirmText }: { newDirectorId: string; demoteRole: string; confirmText: string }) => {
      const res = await fetch('/api/admin/director/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newDirectorId, demoteRole, confirmText })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || 'Erro ao transferir diretoria');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Diretoria transferida com sucesso');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao transferir diretoria');
    }
  });

  const handleTransfer = () => {
    if (!caps?.canTransferDirector) return;
    transferMutation.mutate({ newDirectorId, demoteRole, confirmText });
  };

  // Aprovação por admin comum
  const { data: pendingTransferData } = useQuery({
    queryKey: ['pending-director-transfer'],
    queryFn: async () => {
      const res = await fetch('/api/admin/director/transfer/pending', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar solicitação');
      return res.json();
    },
    enabled: true,
    refetchInterval: 5000
  } as any);

  React.useEffect(() => {
    const autoCancelBugged = async () => {
      if (!isMaster) return;
      const pending = (pendingTransferData as any)?.data;
      if (!pending) return;
      const target = users.find((u: any) => u.id === pending.newDirectorId);
      const hay = normalize(`${target?.firstName || ''} ${target?.lastName || ''} ${target?.email || ''}`);
      if (hay.includes('admin32')) {
        try {
          const res = await fetch('/api/admin/director/transfer/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
          });
          if (res.ok) {
            queryClient.invalidateQueries({ queryKey: ['pending-director-transfer'] });
            toast.success('Solicitação bugada removida');
          }
        } catch {}
      }
    };
    autoCancelBugged();
  }, [isMaster, pendingTransferData, users]);

  const approveMutation = useMutation({
    mutationFn: async ({ confirmText }: { confirmText: string }) => {
      const res = await fetch('/api/admin/director/transfer/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmText })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || 'Erro ao aprovar transferência');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Aprovação registrada');
      queryClient.invalidateQueries({ queryKey: ['pending-director-transfer'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao aprovar transferência');
    }
  });

  const { data: pendingPromotionData } = useQuery({
    queryKey: ['pending-user-promotion'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user/promotion/pending', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar solicitação');
      return res.json();
    },
    enabled: true,
    refetchInterval: 5000
  } as any);

  const pendingPromotion = (pendingPromotionData as any)?.data;
  const pendingTransfer = (pendingTransferData as any)?.data;

  const approvePromotionMutation = useMutation({
    mutationFn: async ({ confirmText }: { confirmText: string }) => {
      const res = await fetch('/api/admin/user/promotion/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmText })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || 'Erro ao aprovar promoção');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Promoção aprovada e aplicada');
      queryClient.invalidateQueries({ queryKey: ['pending-user-promotion'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao aprovar promoção');
    }
  });

  

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UserCheck className="w-5 h-5" /> Solicitação de Cargo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Cargos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={isMaster ? 'promote' : 'approve'}>
            <TabsList className="mb-4">
              {isMaster && <TabsTrigger value="promote">Solicitar</TabsTrigger>}
              <TabsTrigger value="approve">Aprovar</TabsTrigger>
            </TabsList>

            {isMaster && (
            <TabsContent value="promote">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="text-sm text-gray-600">Filtro por Cargo</label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="teacher">Professor</SelectItem>
                          <SelectItem value="coordinator">Coordenador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="director">Diretor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="relative">
                      <label className="text-sm text-gray-600">Usuário</label>
                      <Input placeholder="Digite para pesquisar" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
                      {userQuery && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50">
                          <Command className="border rounded-md bg-white shadow-lg">
                            <CommandList>
                              <CommandEmpty>Digite para pesquisar</CommandEmpty>
                              <CommandGroup>
                                {userMatchesLimited.map((u: any) => {
                                  const label = `${u.firstName} ${u.lastName} (${roleLabel(u.role)}) ${u.email || ''}`;
                                  return (
                                <CommandItem key={u.id} onMouseDown={() => handleUserSelect(u.id)}>
                                  <span>{label}</span>
                                </CommandItem>
                              );
                            })}
                              </CommandGroup>
                              {userQuery && userMatches.length > MAX_RESULTS && (
                                <div className="px-2 py-2 text-xs text-gray-500">Mostrando {MAX_RESULTS} de {userMatches.length}. Refine a busca.</div>
                              )}
                            </CommandList>
                          </Command>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Novo Papel</label>
                      <Select value={promotionRole} onValueChange={setPromotionRole}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coordinator">Coordenador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="teacher">Professor</SelectItem>
                          <SelectItem value="director">Diretor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {promotionRole === 'director' && (
                      <div>
                        <label className="text-sm text-gray-600">Rebaixar Diretor Atual para</label>
                        <Select value={promotionDemoteRole} onValueChange={setPromotionDemoteRole}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="coordinator">Coordenador</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="teacher">Professor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-600">Confirmação</label>
                      <Input placeholder="Digite transferir" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2">
                      {newDirectorId && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>Selecionado:</span>
                          <Badge variant="secondary">
                            {`${users.find((u: any) => u.id === newDirectorId)?.firstName || ''} ${users.find((u: any) => u.id === newDirectorId)?.lastName || ''}`.trim() || 'Usuário'}
                          </Badge>
                          <Badge variant="secondary">{roleLabel(users.find((u: any) => u.id === newDirectorId)?.role || '')}</Badge>
                          <span className="opacity-60">→</span>
                          <Badge>{roleLabel(promotionRole)}</Badge>
                          <Button variant="secondary" size="sm" onClick={() => setNewDirectorId('')}>Limpar</Button>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-1 text-right">
                      <Button onClick={() => {
                        if (!newDirectorId || confirmText.trim().toLowerCase() !== 'transferir') return;
                        if (promotionRole === 'director') {
                          fetch('/api/admin/director/transfer/request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ newDirectorId, demoteRole: promotionDemoteRole, confirmText })
                          }).then(async (res) => {
                            if (!res.ok) {
                              const e = await res.json();
                              toast.error(e.message || 'Erro ao transferir diretoria');
                              return;
                            }
                            const data = await res.json();
                            toast.success(data?.message || 'Solicitação criada. Aguarde aprovações.');
                            queryClient.invalidateQueries({ queryKey: ['pending-director-transfer'] });
                          }).catch(() => toast.error('Erro ao transferir diretoria'));
                        } else {
                          fetch('/api/admin/user/promotion/request', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ userId: newDirectorId, newRole: promotionRole, confirmText })
                          }).then(async (res) => {
                            if (!res.ok) {
                              const e = await res.json();
                              toast.error(e.message || 'Erro ao solicitar promoção');
                              return;
                            }
                            const data = await res.json();
                            toast.success(data?.message || 'Solicitação criada. Aguarde aprovação.');
                            queryClient.invalidateQueries({ queryKey: ['pending-user-promotion'] });
                          }).catch(() => toast.error('Erro ao solicitar promoção'));
                        }
                      }} disabled={!newDirectorId || confirmText.trim().toLowerCase() !== 'transferir'} className="bg-purple-600 text-white">
                        {promotionRole === 'director' ? 'Transferir Diretoria' : 'Solicitar Promoção'}
                      </Button>
                    </div>
                  </div>
                </div>
            </TabsContent>
            )}
            <TabsContent value="approve">
              <div className="space-y-8">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div className="col-span-2">
                    <Input placeholder="Digite transferir" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-2">Promoção de Usuário</div>
                  {!pendingPromotion ? (
                    <div className="text-gray-600">Nenhuma solicitação pendente</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-800">
                        Promover {users.find((u: any) => u.id === pendingPromotion.userId)?.firstName} {users.find((u: any) => u.id === pendingPromotion.userId)?.lastName} para {pendingPromotion.newRole}.
                      </div>
                      {(() => {
                        const approvalsCount = (pendingPromotion.approvalsCount ?? (Array.isArray(pendingPromotion.approvals) ? pendingPromotion.approvals.length : 0)) || 0;
                        const requiredCount = (pendingPromotion.requiredCount ?? (Array.isArray(pendingPromotion.requiredAdminIds) ? pendingPromotion.requiredAdminIds.length : 0)) || 0;
                        const total = Math.max(1, requiredCount || 1);
                        const pct = Math.min(100, Math.round((approvalsCount / total) * 100));
                        return (
                          <>
                            <div className="text-sm text-gray-600">Aprovações: {approvalsCount}/{requiredCount || total}</div>
                            <div className="h-2 bg-gray-200 rounded">
                              <div className="h-2 bg-purple-500 rounded" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        );
                      })()}
                      {!!pendingPromotion.approvals?.length && (
                        <div className="text-xs text-gray-500">Aprovado por: {pendingPromotion.approvals.map((id: string) => displayNameById(id)).join(', ')}</div>
                      )}
                      <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="col-span-2" />
                        <Button onClick={() => approvePromotionMutation.mutate({ confirmText })} disabled={confirmText.trim().toLowerCase() !== 'transferir' || approvePromotionMutation.isPending} className="bg-purple-600 text-white">
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold mb-2">Transferência de Diretoria</div>
                  {!pendingTransfer ? (
                    <div className="text-gray-600">Nenhuma transferência pendente</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-800">
                        Transferir diretoria para {users.find((u: any) => u.id === pendingTransfer.newDirectorId)?.firstName} {users.find((u: any) => u.id === pendingTransfer.newDirectorId)?.lastName}. Rebaixar atual para {pendingTransfer.demoteRole}.
                      </div>
                      {(() => {
                        const approvalsCount = (pendingTransfer.approvalsCount ?? (Array.isArray(pendingTransfer.approvals) ? pendingTransfer.approvals.length : 0)) || 0;
                        const requiredCount = (pendingTransfer.requiredCount ?? (Array.isArray(pendingTransfer.requiredAdminIds) ? pendingTransfer.requiredAdminIds.length : 0)) || 0;
                        const total = Math.max(1, requiredCount || 1);
                        const pct = Math.min(100, Math.round((approvalsCount / total) * 100));
                        return (
                          <>
                            <div className="text-sm text-gray-600">Aprovações: {approvalsCount}/{requiredCount || total}</div>
                            <div className="h-2 bg-gray-200 rounded">
                              <div className="h-2 bg-purple-500 rounded" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        );
                      })()}
                      {!!pendingTransfer.approvals?.length && (
                        <div className="text-xs text-gray-500">Aprovado por: {pendingTransfer.approvals.map((id: string) => displayNameById(id)).join(', ')}</div>
                      )}
                      <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="col-span-2" />
                        <Button onClick={() => approveMutation.mutate({ confirmText })} disabled={confirmText.trim().toLowerCase() !== 'transferir' || approveMutation.isPending} className="bg-purple-600 text-white">
                          Aprovar
                        </Button>
                        {isMaster && (
                          <Button onClick={() => {
                            fetch('/api/admin/director/transfer/cancel', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include'
                            }).then(async (res) => {
                              if (!res.ok) {
                                const e = await res.json();
                                toast.error(e.message || 'Erro ao cancelar transferência');
                                return;
                              }
                              const data = await res.json();
                              toast.success(data?.message || 'Transferência cancelada');
                              queryClient.invalidateQueries({ queryKey: ['pending-director-transfer'] });
                            }).catch(() => toast.error('Erro ao cancelar transferência'));
                          }} className="bg-red-600 text-white">
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
