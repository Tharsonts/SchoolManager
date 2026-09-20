import { useMemo } from 'react';
import { useAttendance } from './useApi';
import { useAuth } from './useAuth';

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  justification?: string;
}

export interface SubjectAttendance {
  id: string;
  subjectName: string;
  teacher: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  excusedClasses: number;
  attendanceRate: number;
  records: AttendanceRecord[];
}

export interface AttendanceStats {
  totalClasses: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  overallRate: number;
}

// Dados mock para demonstração - em produção, estes viriam da API
const MOCK_ATTENDANCE_DATA: SubjectAttendance[] = [
  {
    id: "1",
    subjectName: "Matemática",
    teacher: "Prof. João Silva",
    totalClasses: 24,
    presentClasses: 22,
    absentClasses: 1,
    lateClasses: 1,
    excusedClasses: 0,
    attendanceRate: 92,
    records: [
      { id: "1", date: "2024-01-15", status: "present" },
      { id: "2", date: "2024-01-17", status: "present" },
      { id: "3", date: "2024-01-19", status: "absent" },
      { id: "4", date: "2024-01-22", status: "late" },
      { id: "5", date: "2024-01-24", status: "present" },
      { id: "6", date: "2024-01-26", status: "present" },
      { id: "7", date: "2024-01-29", status: "present" },
      { id: "8", date: "2024-01-31", status: "present" },
    ]
  },
  {
    id: "2",
    subjectName: "Português",
    teacher: "Prof. Maria Santos",
    totalClasses: 20,
    presentClasses: 19,
    absentClasses: 1,
    lateClasses: 0,
    excusedClasses: 0,
    attendanceRate: 95,
    records: [
      { id: "9", date: "2024-01-16", status: "present" },
      { id: "10", date: "2024-01-18", status: "present" },
      { id: "11", date: "2024-01-20", status: "present" },
      { id: "12", date: "2024-01-23", status: "absent" },
      { id: "13", date: "2024-01-25", status: "present" },
      { id: "14", date: "2024-01-27", status: "present" },
      { id: "15", date: "2024-01-30", status: "present" },
    ]
  },
  {
    id: "3",
    subjectName: "História",
    teacher: "Prof. Carlos Lima",
    totalClasses: 16,
    presentClasses: 14,
    absentClasses: 2,
    lateClasses: 0,
    excusedClasses: 0,
    attendanceRate: 88,
    records: [
      { id: "16", date: "2024-01-17", status: "present" },
      { id: "17", date: "2024-01-19", status: "absent" },
      { id: "18", date: "2024-01-24", status: "absent" },
      { id: "19", date: "2024-01-26", status: "present" },
      { id: "20", date: "2024-01-31", status: "present" },
    ]
  },
  {
    id: "4",
    subjectName: "Ciências",
    teacher: "Prof. Ana Costa",
    totalClasses: 18,
    presentClasses: 17,
    absentClasses: 0,
    lateClasses: 1,
    excusedClasses: 0,
    attendanceRate: 94,
    records: [
      { id: "21", date: "2024-01-16", status: "present" },
      { id: "22", date: "2024-01-18", status: "late" },
      { id: "23", date: "2024-01-23", status: "present" },
      { id: "24", date: "2024-01-25", status: "present" },
      { id: "25", date: "2024-01-30", status: "present" },
    ]
  },
  {
    id: "5",
    subjectName: "Educação Física",
    teacher: "Prof. Roberto Oliveira",
    totalClasses: 12,
    presentClasses: 10,
    absentClasses: 1,
    lateClasses: 0,
    excusedClasses: 1,
    attendanceRate: 83,
    records: [
      { id: "26", date: "2024-01-15", status: "present" },
      { id: "27", date: "2024-01-22", status: "excused", justification: "Atestado médico" },
      { id: "28", date: "2024-01-29", status: "absent" },
    ]
  },
  {
    id: "6",
    subjectName: "Geografia",
    teacher: "Prof. Fernanda Rocha",
    totalClasses: 14,
    presentClasses: 13,
    absentClasses: 1,
    lateClasses: 0,
    excusedClasses: 0,
    attendanceRate: 93,
    records: [
      { id: "29", date: "2024-01-17", status: "present" },
      { id: "30", date: "2024-01-24", status: "present" },
      { id: "31", date: "2024-01-31", status: "absent" },
    ]
  }
];

export function useStudentAttendance() {
  const { user } = useAuth();
  
  // Hook da API - por enquanto retornará undefined, então usaremos dados mock
  const { data: apiData, isLoading, error } = useAttendance({
    studentId: user?.id
  });

  // Processar dados da API ou usar dados mock
  const attendanceData = useMemo(() => {
    // Se a API retornar dados, processar aqui
    if (apiData?.data) {
      // TODO: Processar dados reais da API
      return apiData.data;
    }
    
    // Por enquanto, usar dados mock
    return MOCK_ATTENDANCE_DATA;
  }, [apiData]);

  // Calcular estatísticas gerais
  const stats = useMemo((): AttendanceStats => {
    const totalClasses = attendanceData.reduce((sum, subject) => sum + subject.totalClasses, 0);
    const totalPresent = attendanceData.reduce((sum, subject) => sum + subject.presentClasses, 0);
    const totalAbsent = attendanceData.reduce((sum, subject) => sum + subject.absentClasses, 0);
    const totalLate = attendanceData.reduce((sum, subject) => sum + subject.lateClasses, 0);
    const totalExcused = attendanceData.reduce((sum, subject) => sum + subject.excusedClasses, 0);
    
    const overallRate = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    
    return {
      totalClasses,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      overallRate
    };
  }, [attendanceData]);

  // Obter registros de frequência por período
  const getRecordsByDateRange = (startDate: Date, endDate: Date) => {
    const records: Array<AttendanceRecord & { subjectName: string; teacher: string }> = [];
    
    attendanceData.forEach(subject => {
      subject.records.forEach(record => {
        const recordDate = new Date(record.date);
        if (recordDate >= startDate && recordDate <= endDate) {
          records.push({
            ...record,
            subjectName: subject.subjectName,
            teacher: subject.teacher
          });
        }
      });
    });
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Obter frequência por disciplina
  const getSubjectAttendance = (subjectId?: string) => {
    if (subjectId) {
      return attendanceData.find(subject => subject.id === subjectId);
    }
    return attendanceData;
  };

  // Obter disciplinas com baixa frequência (< 75%)
  const getLowAttendanceSubjects = () => {
    return attendanceData.filter(subject => subject.attendanceRate < 75);
  };

  // Obter tendência de frequência (últimos 30 dias vs 30 dias anteriores)
  const getAttendanceTrend = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentRecords = getRecordsByDateRange(thirtyDaysAgo, now);
    const previousRecords = getRecordsByDateRange(sixtyDaysAgo, thirtyDaysAgo);
    
    const recentRate = recentRecords.length > 0 
      ? (recentRecords.filter(r => r.status === 'present').length / recentRecords.length) * 100
      : 0;
      
    const previousRate = previousRecords.length > 0
      ? (previousRecords.filter(r => r.status === 'present').length / previousRecords.length) * 100
      : 0;
    
    return {
      current: Math.round(recentRate),
      previous: Math.round(previousRate),
      trend: recentRate > previousRate ? 'up' : recentRate < previousRate ? 'down' : 'stable'
    };
  };

  return {
    // Dados
    attendanceData,
    stats,
    
    // Estados
    isLoading,
    error,
    
    // Funções utilitárias
    getRecordsByDateRange,
    getSubjectAttendance,
    getLowAttendanceSubjects,
    getAttendanceTrend
  };
}