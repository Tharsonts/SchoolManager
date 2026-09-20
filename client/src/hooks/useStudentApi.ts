import { useQuery } from '@tanstack/react-query';

// Hook para buscar informações da turma do aluno
export const useStudentClassInfo = () => {
  return useQuery({
    queryKey: ['student-class-info'],
    queryFn: async () => {
      const response = await fetch('/api/student/class-info', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar informações da turma');
      }
      
      return response.json();
    }
  });
};

// Hook para buscar atividades do aluno
export const useStudentActivities = () => {
  return useQuery({
    queryKey: ['student-activities'],
    queryFn: async () => {
      const response = await fetch('/api/student/activities', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao carregar atividades do aluno');
      }
      
      return response.json();
    }
  });
};
