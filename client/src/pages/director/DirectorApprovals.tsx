import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  GraduationCap,
  BookOpen,
  FileText,
  AlertCircle,
  Users,
  RefreshCw
} from 'lucide-react';
import { usePendingApprovals, useApproveRequest, useRejectRequest } from '@/hooks/useDirectorApi';
import { toast } from 'sonner';

const DirectorApprovals = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Hooks para API
  const { data: approvalsData, isLoading: isLoadingApprovals, refetch } = usePendingApprovals();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  
  const pendingApprovals = approvalsData?.data || [];

  const filteredApprovals = pendingApprovals.filter((approval: any) => {
    const matchType =
      filterType === 'all' ||
      (filterType === 'user' && approval.type === 'user') ||
      (filterType === 'subject' && approval.type === 'subject') ||
      (filterType === 'class' && approval.type === 'class');

    const roleValue = approval?.details?.role || approval?.details?.targetRole || approval?.role || '';
    const normalizedRole = String(roleValue).toLowerCase();
    const toKey = (value: string) => {
      if (value.includes('professor') || value.includes('teacher')) return 'teacher';
      if (value.includes('coordenador') || value.includes('coordinator')) return 'coordinator';
      if (value.includes('diretor') || value.includes('director')) return 'director';
      if (value.includes('aluno') || value.includes('student')) return 'student';
      if (value.includes('admin') || value.includes('administrador')) return 'admin';
      return '';
    };
    const roleKey = toKey(normalizedRole);
    const matchRole = filterRole === 'all' || roleKey === filterRole;

    return matchType && matchRole;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'class':
        return <GraduationCap className="h-5 w-5 text-green-600" />;
      case 'subject':
        return <BookOpen className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleApprove = async (approvalId: string, type: string) => {
    setIsLoading(true);
    let errorMessage: string | null = null;
    try {
      await approveMutation.mutateAsync({ id: approvalId, type });
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      errorMessage = typeof error?.message === 'string' ? error.message : 'Erro ao aprovar solicitação';
    } finally {
      const result = await refetch();
      const refreshed = result?.data?.data || [];
      const stillPending = refreshed.some((a: any) => a.id === approvalId);
      if (!stillPending) {
        toast.success('Solicitação aprovada com sucesso!');
      } else if (errorMessage) {
        toast.error(errorMessage);
      }
      setIsLoading(false);
    }
  };

  const handleReject = async (approvalId: string, type: string) => {
    const reason = prompt('Motivo da rejeição (opcional):');
    if (reason !== null) { // Usuário não cancelou
      setIsLoading(true);
      let errorMessage: string | null = null;
      try {
        await rejectMutation.mutateAsync({ id: approvalId, type, reason });
      } catch (error: any) {
        console.error('Erro ao rejeitar:', error);
        errorMessage = typeof error?.message === 'string' ? error.message : 'Erro ao rejeitar solicitação';
      } finally {
        const result = await refetch();
        const refreshed = result?.data?.data || [];
        const stillPending = refreshed.some((a: any) => a.id === approvalId);
        if (!stillPending) {
          toast.success('Solicitação rejeitada');
        } else if (errorMessage) {
          toast.error(errorMessage);
        }
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Aprovações</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoadingApprovals}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingApprovals ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {pendingApprovals.length} pendências
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="space-y-6">
          {/* Description */}
          <div>
            <p className="text-gray-600">Aprove solicitações de usuários, turmas e disciplinas criadas pelo administrador</p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="w-full md:w-64">
              <label className="text-sm font-medium text-gray-600 mb-1 block">Tipo de Solicitação</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="subject">Disciplina</SelectItem>
                  <SelectItem value="class">Turma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <label className="text-sm font-medium text-gray-600 mb-1 block">Cargo do Usuário</label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="coordinator">Coordenador</SelectItem>
                  <SelectItem value="director">Diretor</SelectItem>
                  <SelectItem value="student">Aluno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        {/* Pending Approvals */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Aprovações Pendentes
          </h2>
          
          {filteredApprovals.map((approval) => (
            <Card key={approval.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(approval.type)}
                    <div>
                      {(() => {
                        const roleValue = approval?.details?.role || '';
                        const normalizedRole = String(roleValue).toLowerCase();
                        const isEditOp = approval?.details?.operation === 'edit' || (!!approval?.details?.email && String(approval.details.email).trim() !== '');
                        const roleDisplay = roleValue || 'Usuário';
                        const title = `${isEditOp ? 'Edição de' : 'Novo'} ${roleDisplay} - ${approval.title?.split(' - ').pop() || ''}`;
                        const desc = `${isEditOp ? 'Edição' : 'Criação'} de ${isEditOp ? 'perfil' : 'novo perfil'} de ${normalizedRole || 'usuário'}`;
                        return (
                          <>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <p className="text-gray-600 mt-1">{desc}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <Badge className={getPriorityColor(approval.priority)}>
                    {approval.priority === 'high' ? 'Alta' : 
                     approval.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Detalhes da Solicitação</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Solicitado por:</span> {approval.requestedBy}</p>
                      <p><span className="font-medium">Data:</span> {approval.requestedAt}</p>
                      {approval.type === 'class' && (
                        <>
                          <p><span className="font-medium">Capacidade:</span> {approval.details.capacity} alunos</p>
                          <p><span className="font-medium">Período:</span> {approval.details.schedule}</p>
                        </>
                      )}
                      {approval.type === 'subject' && (
                        <>
                          <p><span className="font-medium">Carga horária:</span> {approval.details.workload}h</p>
                          <p><span className="font-medium">Público-alvo:</span> {approval.details.target}</p>
                        </>
                      )}
                      {approval.type === 'period' && (
                        <>
                          <p><span className="font-medium">Período:</span> {approval.details.period}</p>
                          <p><span className="font-medium">Data de encerramento:</span> {approval.details.endDate}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ações</h4>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(approval.id, approval.type)}
                        disabled={isLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleReject(approval.id, approval.type)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                      
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Loading State */}
          {isLoadingApprovals && (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-500">Carregando aprovações...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingApprovals && pendingApprovals.length === 0 && (
            <Card>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <p className="text-lg font-medium">Nenhuma aprovação pendente</p>
                  <p className="text-sm mt-1">Todas as solicitações foram processadas</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DirectorApprovals;
