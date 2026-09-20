import { useState, useEffect } from 'react';

// Interfaces para os dados do perfil
export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  profileImageUrl?: string;
  class: {
    name: string;
    grade: string;
    section: string;
    academicYear: string;
  };
}

export interface AcademicInfo {
  totalSubjects: number;
  totalCredits: number;
  weeklyHours: number;
  averageGrade: number;
  attendanceRate: number;
  completedActivities: number;
  pendingActivities: number;
}

export interface RecentGrade {
  subject: string;
  grade: number;
  date: string;
  type: 'exam' | 'assignment' | 'quiz';
}

export interface ProfileData {
  student: StudentProfile;
  academicInfo: AcademicInfo;
  recentGrades: RecentGrade[];
}

// Hook para gerenciar dados do perfil do aluno
export const useStudentProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados mockados para demonstração
  const mockProfileData: ProfileData = {
    student: {
      id: 'aluno_001',
      firstName: 'Ana',
      lastName: 'Silva',
      email: 'ana.silva@escola.com',
      phone: '(11) 98765-4321',
      address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
      registrationNumber: '2024001',
      role: 'student',
      status: 'active',
      createdAt: '2024-02-01',
      profileImageUrl: undefined,
      class: {
        name: '9º Ano A',
        grade: '9º Ano',
        section: 'A',
        academicYear: '2024'
      }
    },
    academicInfo: {
      totalSubjects: 8,
      totalCredits: 24,
      weeklyHours: 40,
      averageGrade: 8.7,
      attendanceRate: 96,
      completedActivities: 28,
      pendingActivities: 4
    },
    recentGrades: [
      { subject: 'Matemática', grade: 9.2, date: '2024-01-15', type: 'exam' },
      { subject: 'Português', grade: 8.8, date: '2024-01-12', type: 'assignment' },
      { subject: 'Ciências', grade: 9.0, date: '2024-01-10', type: 'quiz' },
      { subject: 'História', grade: 8.5, date: '2024-01-08', type: 'exam' },
      { subject: 'Geografia', grade: 8.3, date: '2024-01-05', type: 'assignment' }
    ]
  };

  // Simular carregamento de dados
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Em produção, aqui seria uma chamada real para a API
        // const response = await api.get('/student/profile');
        // setProfileData(response.data);
        
        setProfileData(mockProfileData);
      } catch (err) {
        setError('Erro ao carregar dados do perfil');
        console.error('Erro ao buscar perfil:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Função para atualizar perfil
  const updateProfile = async (updatedData: Partial<StudentProfile>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Em produção, aqui seria uma chamada real para a API
      // const response = await api.put('/student/profile', updatedData);
      
      if (profileData) {
        setProfileData({
          ...profileData,
          student: { ...profileData.student, ...updatedData }
        });
      }

      return { success: true };
    } catch (err) {
      setError('Erro ao atualizar perfil');
      console.error('Erro ao atualizar perfil:', err);
      return { success: false, error: 'Erro ao atualizar perfil' };
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter cor da nota
  const getGradeColor = (grade: number) => {
    if (grade >= 9) return 'text-green-600';
    if (grade >= 8) return 'text-blue-600';
    if (grade >= 7) return 'text-yellow-600';
    if (grade >= 6) return 'text-orange-600';
    return 'text-red-600';
  };

  // Função para obter texto do status em português
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'suspended': return 'Suspenso';
      default: return 'Desconhecido';
    }
  };

  // Função para obter tipo da avaliação em português
  const getGradeTypeText = (type: string) => {
    switch (type) {
      case 'exam': return 'Prova';
      case 'assignment': return 'Trabalho';
      case 'quiz': return 'Quiz';
      default: return 'Avaliação';
    }
  };

  // Função para calcular performance acadêmica
  const getAcademicPerformance = () => {
    if (!profileData) return null;

    const { averageGrade, attendanceRate } = profileData.academicInfo;
    
    let performance = 'Excelente';
    let color = 'text-green-600';
    
    if (averageGrade < 6 || attendanceRate < 75) {
      performance = 'Precisa Melhorar';
      color = 'text-red-600';
    } else if (averageGrade < 7 || attendanceRate < 85) {
      performance = 'Regular';
      color = 'text-orange-600';
    } else if (averageGrade < 8.5 || attendanceRate < 95) {
      performance = 'Bom';
      color = 'text-blue-600';
    }

    return { performance, color };
  };

  return {
    profileData,
    isLoading,
    error,
    updateProfile,
    getStatusColor,
    getGradeColor,
    getStatusText,
    getGradeTypeText,
    getAcademicPerformance
  };
};