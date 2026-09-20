import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Crown,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ApprovalRequest {
  id: string;
  type: 'user' | 'class' | 'subject';
  title: string;
  description: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  details: any;
}

const DirectorAccess = () => {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const queryClient = useQueryClient();

  // Buscar solicitações pendentes
  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['director-approvals'],
    queryFn: async () => {
      const response = await fetch('/api/director/approvals', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar solicitações');
      }
      return response.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Aprovar solicitação
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/director/approve/${requestId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao aprovar solicitação');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Solicitação aprovada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['director-approvals'] });
      setShowDetails(false);
    },
    onError: (error) => {
      toast.error('Erro ao aprovar solicitação');
      console.error(error);
    }
  });

  // Rejeitar solicitação
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/director/reject/${requestId}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao rejeitar solicitação');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Solicitação rejeitada');
      queryClient.invalidateQueries({ queryKey: ['director-approvals'] });
      setShowDetails(false);
    },
    onError: (error) => {
      toast.error('Erro ao rejeitar solicitação');
      console.error(error);
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-5 w-5" />;
      case 'class': return <Calendar className="h-5 w-5" />;
      case 'subject': return <FileText className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'class': return 'bg-green-100 text-green-800';
      case 'subject': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'Usuário';
      case 'class': return 'Turma';
      case 'subject': return 'Disciplina';
      default: return 'Solicitação';
    }
  };

  const handleViewDetails = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate(selectedRequest.id);
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate(selectedRequest.id);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando solicitações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Erro ao carregar solicitações</p>
        </div>
      </MainLayout>
    );
  }

  const pendingRequests = requests?.data?.filter((req: ApprovalRequest) => req.status === 'pending') || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Crown className="h-8 w-8 text-orange-600" />
              Aprovações do Diretor
            </h1>
            <p className="text-gray-600 mt-1">Gerencie solicitações de criação e modificações</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Sistema Ativo</span>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {pendingRequests.length}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aprovadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {requests?.data?.filter((req: ApprovalRequest) => req.status === 'approved').length || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejeitadas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {requests?.data?.filter((req: ApprovalRequest) => req.status === 'rejected').length || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Solicitações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Solicitações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma solicitação pendente</p>
                <p className="text-sm text-gray-500">Todas as solicitações foram processadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request: ApprovalRequest) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${getTypeColor(request.type)}`}>
                        {getTypeIcon(request.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-600">{request.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getTypeColor(request.type)}>
                            {getTypeLabel(request.type)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Solicitado por: {request.requestedBy}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        {showDetails && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Detalhes da Solicitação</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedRequest.title}</h4>
                  <p className="text-gray-600">{selectedRequest.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <Badge className={getTypeColor(selectedRequest.type)}>
                      {getTypeLabel(selectedRequest.type)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Solicitado por</p>
                    <p className="font-medium">{selectedRequest.requestedBy}</p>
                  </div>
                </div>

                {selectedRequest.details && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Detalhes</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedRequest.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DirectorAccess;



