import { useState, useEffect } from 'react';

// Hook simples para carregar turmas
export const useAdminClassesSimple = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        console.log('🔍 [Simple] Carregando turmas...');
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/classes', {
          credentials: 'include'
        });

        console.log('📡 [Simple] Resposta das turmas:', response.status, response.ok);

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📊 [Simple] Dados das turmas recebidos:', result);
        
        setData(result);
      } catch (err) {
        console.error('❌ [Simple] Erro ao carregar turmas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return { data, isLoading, error };
};

// Hook simples para carregar disciplinas
export const useAdminSubjectsSimple = (refreshTrigger?: number) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        console.log('🔍 [Simple] Carregando disciplinas...');
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/subjects', {
          credentials: 'include'
        });

        console.log('📡 [Simple] Resposta das disciplinas:', response.status, response.ok);

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📊 [Simple] Dados das disciplinas recebidos:', result);
        
        setData(result);
      } catch (err) {
        console.error('❌ [Simple] Erro ao carregar disciplinas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [refreshTrigger]);

  return { data, isLoading, error };
};

// Hook para buscar detalhes de uma turma
export const useClassDetails = (classId?: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setData(null);
      return;
    }

    const fetchClassDetails = async () => {
      try {
        console.log('🔍 [ClassDetails] Carregando detalhes da turma:', classId);
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/admin/classes/${classId}/details`, {
          credentials: 'include'
        });

        console.log('📡 [ClassDetails] Resposta:', response.status, response.ok);

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('📊 [ClassDetails] Dados recebidos:', result);
        
        setData(result);
      } catch (err) {
        console.error('❌ [ClassDetails] Erro ao carregar detalhes:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId]);

  return { data, isLoading, error };
};

