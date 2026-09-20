import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ===== DASHBOARD ADMINISTRATIVO =====
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dashboard administrativo');
      }
      
      return response.json();
    }
  });
};

// ===== USUÁRIOS =====
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      
      return response.json();
    }
  });
};

export const useAdminCapabilities = () => {
  return useQuery({
    queryKey: ['admin-capabilities'],
    queryFn: async () => {
      const response = await fetch('/api/admin/capabilities', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar capacidades do admin');
      }
      return response.json();
    }
  });
};

export const useCheckEmailExists = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/admin/users/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao verificar email');
      }
      
      return response.json();
    }
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: {
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      phone?: string;
      address?: string;
      registrationNumber?: string;
      status: string;
      password?: string;
    }) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar usuário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar usuário');
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, userData }: {
      userId: string;
      userData: {
        firstName: string;
        lastName: string;
        email: string;
        role: string;
        phone?: string;
        address?: string;
        registrationNumber?: string;
        status: string;
        password?: string;
      };
    }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar usuário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, userId, password, confirmText }: { id?: string; userId?: string; password: string; confirmText?: string }) => {
      const targetId = id ?? userId;
      if (!targetId) {
        throw new Error('ID do usuário não informado');
      }
      const response = await fetch(`/api/admin/users/${targetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password, confirmText })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir usuário');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a usuários
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      
      // Forçar refetch das queries principais
      queryClient.refetchQueries({ queryKey: ['admin-users'] });
      
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// ===== DISCIPLINAS =====
export const useAdminSubjects = () => {
  return useQuery({
    queryKey: ['admin-subjects'],
    queryFn: async () => {
      const response = await fetch('/api/admin/subjects', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar disciplinas');
      }
      
      return response.json();
    }
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      subjectData: {
        name: string;
        code: string;
        workload: number;
        description?: string;
        status: 'active' | 'inactive';
        selectedClasses?: string[];
      }
    }) => {
      // Enviar apenas os dados que a API espera
      const { subjectData } = data;
      const apiData = {
        name: subjectData.name,
        code: subjectData.code,
        workload: subjectData.workload,
        description: subjectData.description,
        credits: 1, // Valor padrão
        teacherId: null // Será definido depois
      };

      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar disciplina');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Disciplina criada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar disciplina');
    }
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subjectId, subjectData }: {
      subjectId: string;
      subjectData: {
        name: string;
        code: string;
        workload: number;
        description?: string;
        status: 'active' | 'inactive';
      };
    }) => {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(subjectData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar disciplina');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-subjects-simple'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      toast.success('Solicitação enviada. Aguarde aprovação do diretor.');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar disciplina');
    }
  });
};

export const useCheckSubjectDependencies = () => {
  return useQuery({
    queryKey: ['subject-dependencies'],
    queryFn: async (subjectId: string) => {
      const response = await fetch(`/api/subjects/${subjectId}/dependencies`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao verificar dependências');
      }
      return response.json();
    },
    enabled: false
  });
};

export const useCheckUserDependencies = () => {
  return useQuery({
    queryKey: ['user-dependencies'],
    queryFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/dependencies`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao verificar dependências');
      }
      return response.json();
    },
    enabled: false
  });
};

export const useCheckClassDependencies = () => {
  return useQuery({
    queryKey: ['class-dependencies'],
    queryFn: async (classId: string) => {
      const response = await fetch(`/api/classes/${classId}/dependencies`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao verificar dependências');
      }
      return response.json();
    },
    enabled: false
  });
};

export const useStudentDetails = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-details', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await fetch(`/api/admin/students/${studentId}/details`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes do aluno');
      }
      return response.json();
    },
    enabled: !!studentId
  });
};

export const useClassDetails = (classId: string | null) => {
  return useQuery({
    queryKey: ['class-details', classId],
    queryFn: async () => {
      if (!classId) return null;
      const response = await fetch(`/api/admin/classes/${classId}/details`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes da turma');
      }
      return response.json();
    },
    enabled: !!classId
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, password, confirmText }: { id: string; password: string; confirmText?: string }) => {
      const response = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password, confirmText })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir disciplina');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a disciplinas
      queryClient.invalidateQueries({ queryKey: ['admin-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      
      // Forçar refetch das queries principais
      queryClient.refetchQueries({ queryKey: ['admin-subjects'] });
      
      toast.success('Disciplina excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// ===== TURMAS =====
export const useAdminClasses = () => {
  return useQuery({
    queryKey: ['admin-classes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/classes', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar turmas');
      }
      
      return response.json();
    }
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classData: {
      name: string;
      grade: string;
      section: string;
      academicYear: string;
      capacity: number;
    }) => {
      const response = await fetch('/api/admin/classes', {
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
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Turma criada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar turma');
    }
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, classData }: {
      classId: string;
      classData: {
        name: string;
        grade: string;
        section: string;
        academicYear: string;
        capacity: number;
        status: 'active' | 'inactive';
      };
    }) => {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(classData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar turma');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Solicitação enviada. Aguarde aprovação do diretor.');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar turma');
    }
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, password, confirmText }: { id: string; password: string; confirmText?: string }) => {
      const response = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password, confirmText })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir turma');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a turmas
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      
      // Forçar refetch das queries principais
      queryClient.refetchQueries({ queryKey: ['admin-classes'] });
      
      toast.success('Turma excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// ===== PROFESSORES =====
export const useAdminTeachers = () => {
  return useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/teachers', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar professores');
      }
      
      return response.json();
    }
  });
};

export const useAdminTeacherDetails = (teacherId?: string) => {
  return useQuery({
    queryKey: ['admin-teacher-details', teacherId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/teachers/${teacherId}/details`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar detalhes do professor');
      }
      
      return response.json();
    },
    enabled: !!teacherId
  });
};

export const useCreateTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacherData: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      address?: string;
      subjects?: string[];
      classes?: string[];
    }) => {
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(teacherData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar professor');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Professor criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar professor');
    }
  });
};

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teacherId, teacherData }: {
      teacherId: string;
      teacherData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        address?: string;
        status: 'active' | 'inactive' | 'pendente';
      };
    }) => {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(teacherData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar professor');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Professor atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar professor');
    }
  });
};

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teacherId, password, confirmText }: { teacherId: string; password: string; confirmText?: string }) => {
      const response = await fetch(`/api/admin/users/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ password, confirmText })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir professor');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a professores
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      
      // Forçar refetch das queries principais
      queryClient.refetchQueries({ queryKey: ['admin-teachers'] });
      
      toast.success('Professor excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// ===== COORDENADORES =====
export const useDeleteCoordinator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ coordinatorId, password, confirmText }: { coordinatorId: string; password: string; confirmText?: string }) => {
      const response = await fetch(`/api/admin/users/${coordinatorId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ password, confirmText })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir coordenador');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a coordenadores
      queryClient.invalidateQueries({ queryKey: ['admin-coordinators'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      
      // Forçar refetch das queries principais
      queryClient.refetchQueries({ queryKey: ['admin-coordinators'] });
      
      toast.success('Coordenador excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

// ===== ESTUDANTES =====
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, studentData }: {
      studentId: string;
      studentData: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        address?: string;
        classId?: string;
        status?: string;
      }
    }) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar estudante');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Garantir que a lista usada em StudentsPage seja atualizada
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Estudante atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, password }: { studentId: string; password: string }) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir estudante');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas a estudantes
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      
      // Forçar refetch das queries principais
      queryClient.refetchQueries({ queryKey: ['admin-students'] });
      
      toast.success('Estudante excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
};
