import { useEffect, useState } from 'react';
import { useRealtime } from './useRealtime';
import { useStudentActivities } from './useStudentApi';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Activity {
  id: string;
  title: string;
  description: string;
  subjectName?: string;
  subjectCode?: string;
  className?: string;
  dueDate: string;
  maxGrade: number;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  isLate?: boolean;
  finalGrade?: number;
  allowLateSubmission?: boolean;
  instructions?: string;
  requirements?: string;
  submissionStatus?: string;
  submissionGrade?: number;
  submissionFeedback?: string;
  submissionDate?: string;
}

export function useRealtimeActivities() {
  const { isConnected, onNewActivity, onActivityUpdate, onActivityRemoved, onActivityGraded } = useRealtime();
  const { data: activitiesData, refetch } = useStudentActivities();
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState<Activity[]>([]);

  // Processar atividades para determinar status
  const processActivities = (rawActivities: any[]): Activity[] => {
    return rawActivities.map(activity => {
      const now = new Date();
      const dueDate = new Date(activity.dueDate);
      const isOverdue = now > dueDate;
      
      let status: 'pending' | 'submitted' | 'graded' | 'late' = 'pending';
      
      if (activity.submissionStatus === 'graded') {
        status = 'graded';
      } else if (activity.submissionStatus === 'submitted') {
        status = isOverdue ? 'late' : 'submitted';
      } else if (isOverdue) {
        status = 'late';
      }
      
      return {
        ...activity,
        status,
        grade: activity.submissionGrade,
        feedback: activity.submissionFeedback,
        submittedAt: activity.submissionDate,
        isLate: isOverdue && activity.submissionStatus !== 'submitted' && activity.submissionStatus !== 'graded'
      };
    });
  };

  // Atualizar atividades quando os dados mudarem
  useEffect(() => {
    if (activitiesData?.data) {
      setActivities(processActivities(activitiesData.data));
    }
  }, [activitiesData]);

  // Configurar listeners de tempo real
  useEffect(() => {
    if (!isConnected) return;

    // Nova atividade criada
    onNewActivity((event) => {
      console.log('📚 Nova atividade recebida:', event);
      
      // Adicionar nova atividade à lista
      const newActivity = processActivities([event.activity])[0];
      setActivities(prev => {
        // Verificar se a atividade já existe (evitar duplicatas)
        const exists = prev.some(activity => activity.id === newActivity.id);
        if (exists) return prev;
        
        return [newActivity, ...prev];
      });

      // Mostrar notificação
      toast.success(`Nova atividade: ${event.activity.title}`, {
        description: `Disciplina: ${event.activity.subjectName || 'Não especificada'}`,
        duration: 5000,
      });

      // Invalidar cache do React Query
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
    });

    // Atividade atualizada
    onActivityUpdate((event) => {
      console.log('📝 Atividade atualizada:', event);
      
      const updatedActivity = processActivities([event.activity])[0];
      setActivities(prev => 
        prev.map(activity => 
          activity.id === updatedActivity.id ? updatedActivity : activity
        )
      );

      // Mostrar notificação
      toast.info(`Atividade atualizada: ${event.activity.title}`, {
        description: 'Verifique as alterações',
        duration: 4000,
      });

      // Invalidar cache do React Query
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
    });

    // Atividade removida
    onActivityRemoved((event) => {
      console.log('🗑️ Atividade removida:', event);
      
      setActivities(prev => 
        prev.filter(activity => activity.id !== event.activityId)
      );

      // Mostrar notificação
      toast.warning('Uma atividade foi removida', {
        description: 'A atividade não está mais disponível',
        duration: 4000,
      });

      // Invalidar cache do React Query
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
    });

    // Atividade avaliada
    onActivityGraded((event) => {
      console.log('⭐ Atividade avaliada:', event);
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === event.activityId 
            ? { ...activity, status: 'graded', grade: event.grade.grade, feedback: event.grade.feedback }
            : activity
        )
      );

      // Mostrar notificação
      toast.success('Atividade avaliada!', {
        description: `Nota: ${event.grade.grade}/${event.grade.maxGrade}`,
        duration: 5000,
      });

      // Invalidar cache do React Query
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
    });

  }, [isConnected, onNewActivity, onActivityUpdate, onActivityRemoved, onActivityGraded, queryClient]);

  // Estatísticas das atividades
  const stats = {
    total: activities.length,
    pending: activities.filter(a => a.status === 'pending').length,
    submitted: activities.filter(a => a.status === 'submitted').length,
    graded: activities.filter(a => a.status === 'graded').length,
    late: activities.filter(a => a.status === 'late').length,
  };

  return {
    activities,
    stats,
    isConnected,
    refetch
  };
}






