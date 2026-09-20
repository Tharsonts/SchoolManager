import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Period {
  id: string;
  name: string;
  description?: string;
  period: number;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  totalDays: number;
  remainingDays: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PeriodsResponse {
  success: boolean;
  data: Period[];
  message?: string;
}

export const usePeriods = () => {
  return useQuery<PeriodsResponse>({
    queryKey: ['periods'],
    queryFn: async () => {
      const response = await axios.get('/api/periods');
      return response.data;
    },
    refetchInterval: 30000, // Refetch a cada 30 segundos
    staleTime: 10000, // Considera stale após 10 segundos
  });
};



