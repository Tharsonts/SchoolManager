import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const API_BASE_URL = 'http://localhost:3001';

// Hook para buscar aprovações pendentes
export const usePendingApprovals = () => {
  return useQuery({
    queryKey: [`${API_BASE_URL}/api/director/approvals/pending`],
    queryFn: async () => {
      const response = await apiRequest('GET', `${API_BASE_URL}/api/director/approvals/pending`);
      return await response.json();
    },
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });
};

// Hook para aprovar solicitação
export const useApproveRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      await apiRequest('POST', `${API_BASE_URL}/api/director/approvals/approve`, { id, type });
      return { success: true };
    },
    onSuccess: () => {
      // Invalidar cache para recarregar dados
      queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/api/director/approvals/pending`] });
    },
  });
};

// Hook para rejeitar solicitação
export const useRejectRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, type, reason }: { id: string; type: string; reason?: string }) => {
      await apiRequest('POST', `${API_BASE_URL}/api/director/approvals/reject`, { id, type, reason });
      return { success: true };
    },
    onSuccess: () => {
      // Invalidar cache para recarregar dados
      queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/api/director/approvals/pending`] });
    },
  });
};

// Listar todos os usuários para o diretor
export const useDirectorUsers = () => {
  return useQuery({
    queryKey: [`${API_BASE_URL}/api/director/users`],
    queryFn: async () => {
      const response = await apiRequest('GET', `${API_BASE_URL}/api/director/users`);
      return await response.json();
    }
  });
};
