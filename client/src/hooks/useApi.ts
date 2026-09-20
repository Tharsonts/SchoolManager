import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'coordinator' | 'teacher' | 'student';
  status: string;
  phone?: string;
  address?: string;
  registrationNumber?: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  capacity: number;
  currentStudents: number;
  coordinatorId: string;
  status: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  workload: number;
  status: string;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  schedule?: string;
  room?: string;
  semester: string;
  academicYear: string;
  status: string;
}

// API call utility
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {};
  
  // Só definir Content-Type se não for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    const method = (options.method || 'GET').toString().toUpperCase();
    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      const message = error?.message || 'Erro ao processar a solicitação';
      toast.error(message);
    }
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Generic API hook
export const useApi = () => {
  const request = async (endpoint: string, options: RequestInit = {}) => {
    return apiCall(endpoint, options);
  };

  return { request };
};

// Auth API
export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => apiCall('/auth/logout', { method: 'POST' }),
  });
};

export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => apiCall('/auth/user'),
    retry: false,
  });
};

// Activities API
export const useActivities = (filters?: { classId?: string; subjectId?: string; status?: string }) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: ['activities', filters],
    queryFn: () => apiCall(`/activities${queryString ? `?${queryString}` : ''}`),
  });
};

export const useActivity = (id: string) => {
  return useQuery({
    queryKey: ['activity', id],
    queryFn: () => apiCall(`/activities/${id}`),
    enabled: !!id,
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityData: any) => {
      const formData = new FormData();
      
      // Adicionar campos básicos
      formData.append('title', activityData.title);
      formData.append('description', activityData.description);
      formData.append('subjectId', activityData.subjectId);
      formData.append('classId', activityData.classId);
      formData.append('dueDate', activityData.dueDate);
      formData.append('maxGrade', activityData.maxGrade.toString());
      formData.append('instructions', activityData.instructions || '');
      formData.append('requirements', activityData.requirements || '');
      formData.append('allowLateSubmission', activityData.allowLateSubmission.toString());
      formData.append('latePenalty', activityData.latePenalty.toString());
      
      // Adicionar arquivos se existirem
      if (activityData.files && activityData.files.length > 0) {
        activityData.files.forEach((file: File) => {
          formData.append('files', file);
        });
      }
      
      return apiCall('/activities', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-activities'] });
    },
  });
};

export const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiCall(`/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-activities'] });
    },
  });
};

export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiCall(`/activities/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-activities'] });
    },
  });
};

export const useSubmitActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, submission }: { activityId: string; submission: any }) => {
      const formData = new FormData();
      formData.append('content', submission.content);
      
      // Adicionar arquivos se existirem
      if (submission.attachments && submission.attachments.length > 0) {
        submission.attachments.forEach((file: File) => {
          formData.append('files', file);
        });
      }
      
      return apiCall(`/activities/${activityId}/submit`, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type, deixar o browser definir automaticamente para FormData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] });
    },
  });
};

export const useActivitySubmissions = (activityId: string) => {
  return useQuery({
    queryKey: ['activity-submissions', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/submissions`),
    enabled: !!activityId,
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, grade, feedback }: { submissionId: string; grade: number; feedback?: string }) =>
      apiCall(`/submissions/${submissionId}/grade`, {
        method: 'POST',
        body: JSON.stringify({ grade, feedback }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
    },
  });
};

// Users API
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiCall('/users'),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData: any) =>
      apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status }: { status: string }) =>
      apiCall('/users/status', {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};

export const useUsersStatus = (userIds?: string[]) => {
  return useQuery({
    queryKey: ['users-status', userIds],
    queryFn: () => apiCall(`/users/status?ids=${userIds?.join(',')}`),
    enabled: !!userIds && userIds.length > 0,
  });
};

// Classes API
export const useClasses = (filters?: { status?: string; coordinatorId?: string }) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: ['classes', filters],
    queryFn: () => apiCall(`/classes${queryString ? `?${queryString}` : ''}`),
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classData: any) =>
      apiCall('/classes', {
        method: 'POST',
        body: JSON.stringify(classData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};

// Criar turma para professor (com vinculação automática)
export const useTeacherCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (classData: {
      name: string;
      grade: string;
      section: string;
      academicYear: string;
      capacity?: number;
      subjectName: string;
    }) => {
      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(classData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar turma');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a turmas
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-classes-simple'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] });
    },
  });
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => apiCall('/subjects'),
  });
};

// Teacher-specific subjects (only subjects the teacher teaches)
export const useTeacherSubjects = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-subjects', teacherId],
    queryFn: () => apiCall('/subjects', { method: 'GET' }),
    enabled: !!teacherId,
  });
};

// Teacher-specific classes (only classes the teacher teaches)
export const useTeacherClasses = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: () => apiCall(`/teacher/${teacherId}/classes`, { method: 'GET' }),
    enabled: !!teacherId,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectData: any) =>
      apiCall('/subjects', {
        method: 'POST',
        body: JSON.stringify(subjectData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

// Student API
export const useStudentActivities = (studentId?: string) => {
  return useQuery({
    queryKey: ['student-activities', studentId],
    queryFn: () => apiCall('/student/activities'),
    enabled: !!studentId,
  });
};

export const useStudentClassInfo = (studentId?: string) => {
  return useQuery({
    queryKey: ['student-class-info', studentId],
    queryFn: () => apiCall('/student/class-info'),
    enabled: !!studentId,
  });
};

// Teacher API
export const useTeacherActivities = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-activities', teacherId],
    queryFn: () => apiCall(`/activities/teacher/${teacherId}`),
    enabled: !!teacherId,
  });
};

export const useTeacherPendingSubmissions = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-pending-submissions', teacherId],
    queryFn: () => apiCall(`/teacher/${teacherId}/pending-submissions`),
    enabled: !!teacherId,
  });
};

// Grades API
export const useGrades = (filters?: { studentId?: string; subjectId?: string; classId?: string }) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: ['grades', filters],
    queryFn: () => apiCall(`/grades${queryString ? `?${queryString}` : ''}`),
  });
};

export const useCreateGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gradeData: any) =>
      apiCall('/grades', {
        method: 'POST',
        body: JSON.stringify(gradeData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
};

export const useClassGrades = (classId?: string, quarter?: string) => {
  return useQuery({
    queryKey: ['class-grades', classId, quarter],
    queryFn: () => apiCall(`/grades/class/${classId}?quarter=${quarter}`),
    enabled: !!classId,
  });
};

export const useClassAverages = (classId?: string, quarter?: string) => {
  return useQuery({
    queryKey: ['class-averages', classId, quarter],
    queryFn: () => apiCall(`/grades/class/${classId}/averages?quarter=${quarter}`),
    enabled: !!classId,
  });
};

export const useGeneralAverages = (classId?: string, quarter?: string) => {
  return useQuery({
    queryKey: ['general-averages', classId, quarter],
    queryFn: () => apiCall(`/grades/class/${classId}/general-averages?quarter=${quarter}`),
    enabled: !!classId,
  });
};

export const useSaveGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gradeData: any) =>
      apiCall('/grades/save', {
        method: 'POST',
        body: JSON.stringify(gradeData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['class-grades'] });
      queryClient.invalidateQueries({ queryKey: ['class-averages'] });
      queryClient.invalidateQueries({ queryKey: ['general-averages'] });
    },
  });
};

// Notifications API
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiCall('/notifications'),
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiCall(`/notifications/${notificationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Chat API
export const useChatMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: () => apiCall(`/messages/conversation/${conversationId}`),
    enabled: !!conversationId,
  });
};


export const useSearchUsers = (searchTerm?: string) => {
  return useQuery({
    queryKey: ['search-users', searchTerm],
    queryFn: async () => {
      try {
        const q = encodeURIComponent(searchTerm || '');
        const result = await apiCall(`/users/search?query=${q}`);
        return result;
      } catch (e) {
        return { data: [] } as any;
      }
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30000,
    cacheTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// Reports API
export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => apiCall('/reports'),
  });
};

export const useGenerateReport = () => {
  return useMutation({
    mutationFn: (reportData: any) =>
      apiCall('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(reportData),
      }),
  });
};

// Dashboard API
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiCall('/dashboard/stats'),
  });
};

// Dashboard do Diretor
export const useDirectorDashboard = () => {
  return useQuery({
    queryKey: ['director-dashboard'],
    queryFn: () => apiCall('/director/dashboard'),
  });
};

// Settings API
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiCall('/settings'),
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settingsData: any) =>
      apiCall('/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
};

// File API
export const useUploadFile = () => {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiCall('/files/upload', {
        method: 'POST',
        body: formData,
      });
    },
  });
};

export const useDownloadFile = (fileId: string) => {
  return useQuery({
    queryKey: ['file', fileId],
    queryFn: () => apiCall(`/files/${fileId}/download`),
    enabled: !!fileId,
  });
};

// Calendar API
export const useCalendarEvents = (startDate?: string, endDate?: string) => {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  
  return useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: () => apiCall(`/calendar/events?${queryParams.toString()}`),
  });
};

// ==================== COORDENADOR HOOKS ====================

// Dashboard do Coordenador
export const useCoordinatorDashboard = () => {
  return useQuery({
    queryKey: ['coordinator-dashboard'],
    queryFn: () => apiCall('/coordinator/dashboard'),
  });
};

// Listar todos os alunos
export const useCoordinatorStudents = () => {
  return useQuery({
    queryKey: ['coordinator-students'],
    queryFn: () => apiCall('/coordinator/students'),
  });
};

// Listar todos os professores
export const useCoordinatorTeachers = () => {
  return useQuery({
    queryKey: ['coordinator-teachers'],
    queryFn: () => apiCall('/coordinator/teachers'),
  });
};

// Listar todas as turmas
export const useCoordinatorClasses = () => {
  return useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: () => apiCall('/coordinator/classes'),
  });
};

// Listar todas as disciplinas
export const useCoordinatorSubjects = () => {
  return useQuery({
    queryKey: ['coordinator-subjects'],
    queryFn: () => apiCall('/coordinator/subjects'),
  });
};

// Listar todas as atividades
export const useCoordinatorActivities = () => {
  return useQuery({
    queryKey: ['coordinator-activities'],
    queryFn: () => apiCall('/coordinator/activities'),
  });
};

// Listar todas as provas
export const useCoordinatorExams = () => {
  return useQuery({
    queryKey: ['coordinator-exams'],
    queryFn: () => apiCall('/coordinator/exams'),
  });
};

// ==================== RELATÓRIOS COORDENADOR ====================

// Relatórios Acadêmicos
export const useCoordinatorAcademicReports = () => {
  return useQuery({
    queryKey: ['coordinator-academic-reports'],
    queryFn: () => apiCall('/coordinator/reports/academic'),
  });
};

// Relatórios Administrativos
export const useCoordinatorAdministrativeReports = () => {
  return useQuery({
    queryKey: ['coordinator-administrative-reports'],
    queryFn: () => apiCall('/coordinator/reports/administrative'),
  });
};

// Relatório Individual do Aluno
export const useCoordinatorStudentReport = (studentId: string) => {
  return useQuery({
    queryKey: ['coordinator-student-report', studentId],
    queryFn: () => apiCall(`/coordinator/reports/student/${studentId}`),
    enabled: !!studentId,
  });
};

// ==================== CALENDÁRIO COORDENADOR ====================

// Buscar eventos do calendário do coordenador
export const useCoordinatorCalendarEvents = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['coordinator-calendar-events', startDate, endDate],
    queryFn: () => apiCall(`/coordinator/calendar/events?startDate=${startDate}&endDate=${endDate}`),
  });
};

// Criar evento do calendário
export const useCreateCoordinatorEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventData: any) => apiCall('/coordinator/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
    },
  });
};

// Atualizar evento do calendário
export const useUpdateCoordinatorEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...eventData }: any) => apiCall(`/coordinator/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
    },
  });
};

// Deletar evento do calendário
export const useDeleteCoordinatorEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiCall(`/coordinator/calendar/events/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coordinator-calendar-events'] });
    },
  });
};

// ==================== CONTROLE DO SISTEMA ====================

// Obter status do sistema
export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: () => apiCall('/coordinator/system/status'),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};

// Obter limites do sistema
export const useSystemLimits = () => {
  return useQuery({
    queryKey: ['system-limits'],
    queryFn: () => apiCall('/coordinator/system/limits'),
  });
};

// Atualizar limites do sistema
export const useUpdateSystemLimits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (limits: any) => apiCall('/coordinator/system/limits', {
      method: 'PUT',
      body: JSON.stringify(limits),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-limits'] });
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

// Executar limpeza do sistema
export const useSystemCleanup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: string) => apiCall('/coordinator/system/cleanup', {
        method: 'POST',
      body: JSON.stringify({ type }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

// Bloquear/desbloquear criação de usuários
export const useToggleUserCreation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blocked: boolean) => apiCall('/coordinator/system/toggle-user-creation', {
      method: 'POST',
      body: JSON.stringify({ blocked }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

// Ativar/desativar modo de manutenção
export const useMaintenanceMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => apiCall('/coordinator/system/maintenance-mode', {
        method: 'POST',
      body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

// Obter alertas do sistema
export const useSystemAlerts = () => {
  return useQuery({
    queryKey: ['system-alerts'],
    queryFn: () => apiCall('/coordinator/system/alerts'),
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventData: any) =>
      apiCall('/calendar/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// Events API
export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => apiCall('/events'),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventData: any) =>
      apiCall('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Attendance API
export const useAttendance = (classId?: string, date?: string) => {
  return useQuery({
    queryKey: ['attendance', classId, date],
    queryFn: () => apiCall(`/attendance?classId=${classId}&date=${date}`),
    enabled: !!classId && !!date,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attendanceData: any) =>
      apiCall('/attendance', {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Schedule API
export const useSchedule = (filters?: { classId?: string; teacherId?: string; studentId?: string }) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: ['schedule', filters],
    queryFn: () => apiCall(`/schedule${queryString ? `?${queryString}` : ''}`),
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scheduleData: any) =>
      apiCall('/schedule', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

// Library API
export const useLibraryResources = (filters?: { type?: string; subjectId?: string; search?: string }) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: ['library-resources', filters],
    queryFn: () => apiCall(`/library/resources${queryString ? `?${queryString}` : ''}`),
  });
};

export const useCreateLibraryResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resourceData: any) =>
      apiCall('/library/resources', {
        method: 'POST',
        body: JSON.stringify(resourceData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-resources'] });
    },
  });
};

// Advanced Activities API
export const useAdvancedActivities = (filters?: { classId?: string; type?: string; status?: string; search?: string }) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
  return useQuery({
    queryKey: ['advanced-activities', filters],
    queryFn: () => apiCall(`/activities/advanced${queryString ? `?${queryString}` : ''}`),
  });
};

// Team API
export const useTeams = (activityId?: string) => {
  return useQuery({
    queryKey: ['teams', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/teams`),
    enabled: !!activityId,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, teamData }: { activityId: string; teamData: any }) =>
      apiCall(`/activities/${activityId}/teams`, {
        method: 'POST',
        body: JSON.stringify(teamData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

// Peer Review API
export const usePeerReviews = (activityId?: string) => {
  return useQuery({
    queryKey: ['peer-reviews', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/peer-reviews`),
    enabled: !!activityId,
  });
};

export const useSubmitPeerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, reviewData }: { activityId: string; reviewData: any }) =>
      apiCall(`/activities/${activityId}/peer-reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-reviews'] });
    },
  });
};

// Comments API
export const useActivityComments = (activityId?: string) => {
  return useQuery({
    queryKey: ['activity-comments', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/comments`),
    enabled: !!activityId,
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, commentData }: { activityId: string; commentData: any }) =>
      apiCall(`/activities/${activityId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-comments'] });
    },
  });
};

// Configuration API
export const useActivityConfig = (activityId?: string) => {
  return useQuery({
    queryKey: ['activity-config', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/config`),
    enabled: !!activityId,
  });
};

export const useUpdateActivityConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, configData }: { activityId: string; configData: any }) =>
      apiCall(`/activities/${activityId}/config`, {
        method: 'PUT',
        body: JSON.stringify(configData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-config'] });
    },
  });
};

// Export API
export const useExportGrades = (activityId?: string) => {
  return useQuery({
    queryKey: ['export-grades', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/submissions/export-grades`),
    enabled: !!activityId,
  });
};

export const useDownloadAllSubmissions = (activityId?: string) => {
  return useQuery({
    queryKey: ['download-all-submissions', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/submissions/download-all`),
    enabled: !!activityId,
  });
};

// Batch Operations API
export const useBatchGradeSubmissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, grades }: { activityId: string; grades: any[] }) =>
      apiCall(`/activities/${activityId}/submissions/batch-grade`, {
        method: 'POST',
        body: JSON.stringify({ grades }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
    },
  });
};

// Filter API
export const useFilteredSubmissions = (activityId?: string, filters?: any) => {
  return useQuery({
    queryKey: ['filtered-submissions', activityId, filters],
    queryFn: () => apiCall(`/activities/${activityId}/submissions/filtered`, {
      method: 'POST',
      body: JSON.stringify(filters),
    }),
    enabled: !!activityId,
  });
};

// Undo Submit API
export const useUndoSubmit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiCall(`/activities/${activityId}/undo-submit`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activity-submissions'] });
    },
  });
};

// File View API
export const useFileView = (fileId?: string) => {
  return useQuery({
    queryKey: ['file-view', fileId],
    queryFn: () => apiCall(`/activities/files/${fileId}/view`),
    enabled: !!fileId,
  });
};

export const useFileDownload = (fileId?: string) => {
  return useQuery({
    queryKey: ['file-download', fileId],
    queryFn: () => apiCall(`/activities/files/${fileId}/download`),
    enabled: !!fileId,
  });
};

// My Submission API
export const useMySubmission = (activityId?: string) => {
  return useQuery({
    queryKey: ['my-submission', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/my-submission`),
    enabled: !!activityId,
  });
};

// Activity Files API
export const useActivityFiles = (activityId?: string) => {
  return useQuery({
    queryKey: ['activity-files', activityId],
    queryFn: () => apiCall(`/activities/${activityId}/files`),
    enabled: !!activityId,
  });
};

// Submission Files API
export const useSubmissionFiles = (fileId?: string) => {
  return useQuery({
    queryKey: ['submission-files', fileId],
    queryFn: () => apiCall(`/submissions/files/${fileId}/view`),
    enabled: !!fileId,
  });
};

// === MATERIALS API ===

// Listar materiais do professor
export const useTeacherMaterials = (teacherId?: string, folder?: string | null) => {
  return useQuery({
    queryKey: ['teacher-materials', teacherId, folder],
    queryFn: () => {
      const url = folder 
        ? `/materials/teacher/${teacherId}?folder=${encodeURIComponent(folder)}`
        : `/materials/teacher/${teacherId}`;
      return apiCall(url);
    },
    enabled: !!teacherId,
  });
};

// Listar pastas do professor
export const useTeacherFolders = (teacherId?: string) => {
  return useQuery({
    queryKey: ['teacher-folders', teacherId],
    queryFn: () => apiCall(`/materials/teacher/${teacherId}/folders`),
    enabled: !!teacherId,
  });
};

// Listar materiais para aluno
export const useStudentMaterials = (subjectId?: string) => {
      return useQuery({
    queryKey: ['student-materials', subjectId],
    queryFn: () => apiCall(`/materials/student${subjectId ? `?subjectId=${subjectId}` : ''}`),
  });
};

// === EXAMS API ===

// Listar provas do professor
export const useTeacherExams = (teacherId?: string, range?: { startDate: string; endDate: string }) => {
  return useQuery({
    queryKey: ['teacher-exams', teacherId, range?.startDate, range?.endDate],
    queryFn: () => {
      const qs = range ? `?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}` : '';
      return apiCall(`/exams/teacher/${teacherId}${qs}`);
    },
    enabled: !!teacherId,
  });
};

// Buscar detalhes de uma prova
export const useExamDetails = (examId?: string) => {
  return useQuery({
    queryKey: ['exam-details', examId],
    queryFn: () => apiCall(`/exams/${examId}`),
    enabled: !!examId,
  });
};

// Criar prova
export const useCreateExam = () => {
  const queryClient = useQueryClient();
  
      return useMutation({
    mutationFn: (examData: any) => apiCall('/exams', {
          method: 'POST',
      body: JSON.stringify(examData),
        }),
        onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-exams'] });
        },
      });
};

// Atualizar notas de uma prova
export const useUpdateExamGrades = () => {
  const queryClient = useQueryClient();
  
      return useMutation({
    mutationFn: ({ examId, grades }: { examId: string; grades: any[] }) => 
      apiCall(`/exams/${examId}/grades`, {
          method: 'PUT',
        body: JSON.stringify({ grades }),
      }),
    onSuccess: (_, { examId }) => {
      queryClient.invalidateQueries({ queryKey: ['exam-details', examId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-exams'] });
        },
      });
};

// Deletar prova
export const useDeleteExam = () => {
  const queryClient = useQueryClient();
  
      return useMutation({
    mutationFn: (examId: string) => apiCall(`/exams/${examId}`, {
          method: 'DELETE',
        }),
        onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-exams'] });
        },
      });
};

// Buscar alunos de uma turma
export const useClassStudents = (classId?: string) => {
  return useQuery({
    queryKey: ['class-students', classId],
    queryFn: () => apiCall(`/classes/${classId}/students`),
    enabled: !!classId,
  });
};


// Buscar disciplinas da turma do aluno
export const useStudentSubjects = () => {
  return useQuery({
    queryKey: ['student-subjects'],
    queryFn: async () => {
      const response = await apiCall('/student/subjects', { method: 'GET' });
      return response.data || response; // Extrair data se existir, senão retornar response
    },
  });
};

// Buscar provas do aluno
export const useStudentExams = (range?: { startDate: string; endDate: string }) => {
  return useQuery({
    queryKey: ['student-exams', range?.startDate, range?.endDate],
    queryFn: () => {
      const qs = range ? `?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}` : '';
      return apiCall(`/student/exams${qs}`);
    },
  });
};


// Buscar material específico
export const useMaterial = (materialId?: string) => {
  return useQuery({
    queryKey: ['material', materialId],
    queryFn: () => apiCall(`/materials/${materialId}`),
    enabled: !!materialId,
  });
};

// Criar material
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/materials', {
        method: 'POST',
        credentials: 'include',
        body: data,
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar material');
      }
      
      return response.json();
    },
        onSuccess: () => {
      // Invalidar e forçar refetch de todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['teacher-materials'] });
      queryClient.invalidateQueries({ queryKey: ['student-materials'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-folders'] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['teacher-materials'] });
      queryClient.refetchQueries({ queryKey: ['student-materials'] });
        },
      });
};

// Deletar material
export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (materialId: string) => {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao deletar material');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-materials'] });
      queryClient.invalidateQueries({ queryKey: ['student-materials'] });
    },
  });
};

// Chat API
export const useConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiCall('/chat/conversations'),
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => apiCall(`/chat/messages/${conversationId}`),
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipientEmail, content, type = 'text' }: { recipientEmail: string; content: string; type?: string }) =>
      apiCall('/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientEmail, content, type }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.recipientEmail] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      apiCall(`/chat/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      apiCall(`/chat/messages/${messageId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
