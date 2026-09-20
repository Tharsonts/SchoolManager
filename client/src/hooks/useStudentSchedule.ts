import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';

export interface ScheduleClass {
  id: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  subjectId?: string;
  teacherId?: string;
}

export interface DaySchedule {
  day: string;
  dayNumber: number;
  classes: ScheduleClass[];
}

export interface WeeklyStats {
  totalClasses: number;
  totalHours: number;
  subjectsCount: number;
  averageClassesPerDay: number;
}

export interface ScheduleData {
  weeklySchedule: DaySchedule[];
  todaySchedule: ScheduleClass[];
  currentClass: ScheduleClass | null;
  nextClass: ScheduleClass | null;
  stats: WeeklyStats;
}

const useStudentSchedule = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - em produção viria da API
  const mockScheduleData: DaySchedule[] = [
    {
      day: 'Segunda-feira',
      dayNumber: 1,
      classes: [
        { id: '1', time: '13:00', subject: 'História', teacher: 'Prof. Carlos Lima', room: 'Sala 203', subjectId: 'hist_001', teacherId: 'teacher_001' },
        { id: '2', time: '14:00', subject: 'Matemática', teacher: 'Prof. Maria Silva', room: 'Sala 201', subjectId: 'math_001', teacherId: 'teacher_002' },
        { id: '3', time: '15:30', subject: 'Português', teacher: 'Prof. João Santos', room: 'Sala 105', subjectId: 'port_001', teacherId: 'teacher_003' }
      ]
    },
    {
      day: 'Terça-feira',
      dayNumber: 2,
      classes: [
        { id: '4', time: '14:00', subject: 'Ciências', teacher: 'Prof. Ana Costa', room: 'Laboratório 1', subjectId: 'sci_001', teacherId: 'teacher_004' },
        { id: '5', time: '15:30', subject: 'Português', teacher: 'Prof. João Santos', room: 'Sala 105', subjectId: 'port_001', teacherId: 'teacher_003' },
        { id: '6', time: '16:00', subject: 'Educação Física', teacher: 'Prof. Pedro Santos', room: 'Quadra', subjectId: 'pe_001', teacherId: 'teacher_005' }
      ]
    },
    {
      day: 'Quarta-feira',
      dayNumber: 3,
      classes: [
        { id: '7', time: '13:00', subject: 'Geografia', teacher: 'Prof. Lucia Mendes', room: 'Sala 204', subjectId: 'geo_001', teacherId: 'teacher_006' },
        { id: '8', time: '14:00', subject: 'Matemática', teacher: 'Prof. Maria Silva', room: 'Sala 201', subjectId: 'math_001', teacherId: 'teacher_002' },
        { id: '9', time: '16:00', subject: 'Ciências', teacher: 'Prof. Ana Costa', room: 'Laboratório 1', subjectId: 'sci_001', teacherId: 'teacher_004' }
      ]
    },
    {
      day: 'Quinta-feira',
      dayNumber: 4,
      classes: [
        { id: '10', time: '13:00', subject: 'História', teacher: 'Prof. Carlos Lima', room: 'Sala 203', subjectId: 'hist_001', teacherId: 'teacher_001' },
        { id: '11', time: '15:30', subject: 'Português', teacher: 'Prof. João Santos', room: 'Sala 105', subjectId: 'port_001', teacherId: 'teacher_003' },
        { id: '12', time: '16:30', subject: 'Inglês', teacher: 'Prof. Sarah Johnson', room: 'Sala 102', subjectId: 'eng_001', teacherId: 'teacher_007' }
      ]
    },
    {
      day: 'Sexta-feira',
      dayNumber: 5,
      classes: [
        { id: '13', time: '14:00', subject: 'Artes', teacher: 'Prof. Roberto Silva', room: 'Ateliê', subjectId: 'art_001', teacherId: 'teacher_008' },
        { id: '14', time: '15:00', subject: 'Educação Física', teacher: 'Prof. Pedro Santos', room: 'Quadra', subjectId: 'pe_001', teacherId: 'teacher_005' }
      ]
    }
  ];

  const [scheduleData, setScheduleData] = useState<DaySchedule[]>(mockScheduleData);

  // Função para buscar dados da API (simulada)
  const fetchScheduleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simular chamada da API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Em produção, fazer a chamada real:
      // const response = await fetch(`/api/students/${user?.id}/schedule`);
      // const data = await response.json();
      // setScheduleData(data);

      setScheduleData(mockScheduleData);
    } catch (err) {
      setError('Erro ao carregar horários');
      console.error('Erro ao buscar horários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchScheduleData();
    }
  }, [user?.id]);

  // Funções utilitárias
  const getCurrentDay = (): string => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[new Date().getDay()];
  };

  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTodaySchedule = (): ScheduleClass[] => {
    const currentDay = getCurrentDay();
    const todayData = scheduleData.find(day => day.day === currentDay);
    return todayData?.classes || [];
  };

  const getCurrentClass = (): ScheduleClass | null => {
    const todayClasses = getTodaySchedule();
    const currentTime = getCurrentTime();
    
    // Encontrar aula atual (considerando duração de 50 minutos por aula)
    return todayClasses.find(cls => {
      const classTime = cls.time;
      const [hour, minute] = classTime.split(':').map(Number);
      const classStart = hour * 60 + minute;
      const classEnd = classStart + 50; // 50 minutos por aula
      
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      const currentMinutes = currentHour * 60 + currentMinute;
      
      return currentMinutes >= classStart && currentMinutes <= classEnd;
    }) || null;
  };

  const getNextClass = (): ScheduleClass | null => {
    const todayClasses = getTodaySchedule();
    const currentTime = getCurrentTime();
    
    return todayClasses.find(cls => cls.time > currentTime) || null;
  };

  const getClassesBySubject = (subjectId: string): ScheduleClass[] => {
    return scheduleData
      .flatMap(day => day.classes)
      .filter(cls => cls.subjectId === subjectId);
  };

  const getClassesByTeacher = (teacherId: string): ScheduleClass[] => {
    return scheduleData
      .flatMap(day => day.classes)
      .filter(cls => cls.teacherId === teacherId);
  };

  // Calcular estatísticas
  const stats: WeeklyStats = useMemo(() => {
    const allClasses = scheduleData.flatMap(day => day.classes);
    const uniqueSubjects = new Set(allClasses.map(cls => cls.subject));
    
    return {
      totalClasses: allClasses.length,
      totalHours: Math.round((allClasses.length * 50) / 60 * 10) / 10, // 50 min por aula
      subjectsCount: uniqueSubjects.size,
      averageClassesPerDay: Math.round((allClasses.length / 5) * 10) / 10 // 5 dias úteis
    };
  }, [scheduleData]);

  // Dados processados para retorno
  const processedData: ScheduleData = useMemo(() => ({
    weeklySchedule: scheduleData,
    todaySchedule: getTodaySchedule(),
    currentClass: getCurrentClass(),
    nextClass: getNextClass(),
    stats
  }), [scheduleData, stats]);

  return {
    scheduleData: processedData,
    isLoading,
    error,
    refetch: fetchScheduleData,
    
    // Funções utilitárias
    getCurrentDay,
    getCurrentTime,
    getTodaySchedule,
    getCurrentClass,
    getNextClass,
    getClassesBySubject,
    getClassesByTeacher
  };
};

export default useStudentSchedule;