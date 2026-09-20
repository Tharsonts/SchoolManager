import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Save,
  BarChart3,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  status: string;
}

interface AttendanceHistory {
  date: string;
  status: string;
  subjectName: string;
  className: string;
}

interface AttendanceStats {
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
}

interface AttendanceRecord {
  id?: string;
  studentId: string;
  status: 'present' | 'absent' | 'pending';
  studentName: string;
  registrationNumber: string;
}

interface Class {
  classId: string;
  subjectId: string;
  className: string;
  subjectName: string;
  studentsCount: number;
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  
  // Estados
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentHistory, setStudentHistory] = useState<Record<string, AttendanceStats>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar data atual
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setSelectedDate(todayStr);
  }, []);

  // Buscar turmas do professor
  const { data: classesResponse } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes`);
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const classes = classesResponse?.data || [];

  // Buscar alunos quando turma for selecionada
  const fetchStudents = async (classId: string) => {
    try {
      const response = await fetch(`/api/attendance/class/${classId}/students`);
      if (!response.ok) throw new Error('Erro ao buscar alunos');
      const data = await response.json();
      setStudents(data);
      
      // Inicializar registros de frequência
      const initialRecords: AttendanceRecord[] = data.map((student: Student) => ({
        studentId: student.id,
        status: 'pending' as const,
        studentName: `${student.firstName} ${student.lastName}`,
        registrationNumber: student.registrationNumber
      }));
      setAttendanceRecords(initialRecords);
      
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast.error('Erro ao buscar alunos');
    }
  };

  // Buscar frequência existente
  const fetchExistingAttendance = async (classId: string, subjectId: string, date: string) => {
    try {
      const response = await fetch(`/api/attendance/class/${classId}/subject/${subjectId}/date/${date}`);
      if (!response.ok) throw new Error('Erro ao buscar frequência');
      const existingRecords = await response.json();
      
      // Atualizar registros com dados existentes
      setAttendanceRecords(prev => prev.map(record => {
        const existing = existingRecords.find((r: any) => r.studentId === record.studentId);
        return existing ? {
          ...record,
          id: existing.id,
          status: existing.status
        } : record;
      }));
      
    } catch (error) {
      console.error('Erro ao buscar frequência existente:', error);
    }
  };

  // Buscar histórico de cada aluno
  const fetchStudentHistory = async (studentId: string) => {
    try {
      const response = await fetch(`/api/attendance/student/${studentId}/history`);
      if (!response.ok) throw new Error('Erro ao buscar histórico');
      const data = await response.json();
      setStudentHistory(prev => ({
        ...prev,
        [studentId]: data.stats
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  // Efeito para buscar dados quando turma ou data mudarem
  useEffect(() => {
    if (selectedClass && selectedDate) {
      const classData = classes.find((c: Class) => c.classId === selectedClass);
      if (classData) {
        fetchStudents(selectedClass);
        fetchExistingAttendance(selectedClass, classData.subjectId, selectedDate);
      }
    }
  }, [selectedClass, selectedDate, classes]);

  // Efeito para buscar histórico quando alunos mudarem
  useEffect(() => {
    students.forEach(student => {
      fetchStudentHistory(student.id);
    });
  }, [students]);

  // Alterar status de um aluno
  const handleStatusChange = (studentId: string, newStatus: 'present' | 'absent') => {
    setAttendanceRecords(prev => prev.map(record => 
      record.studentId === studentId 
        ? { ...record, status: newStatus }
        : record
    ));
  };

  // Salvar frequência
  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error('Selecione turma e data');
      return;
    }

    const classData = classes.find((c: Class) => c.classId === selectedClass);
    if (!classData) {
      toast.error('Dados da turma não encontrados');
      return;
    }

    // Filtrar apenas registros que não estão pendentes
    const recordsToSave = attendanceRecords.filter(record => record.status !== 'pending');
    
    if (recordsToSave.length === 0) {
      toast.error('Marque pelo menos um aluno como presente ou ausente');
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClass,
          subjectId: classData.subjectId,
          date: selectedDate,
          attendanceRecords: recordsToSave.map(record => ({
            studentId: record.studentId,
            status: record.status
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar frequência');
      }

      const result = await response.json();
      toast.success(`Frequência salva com sucesso! ${result.recordsCount} alunos registrados.`);
      
      // Atualizar dados automaticamente
      await fetchExistingAttendance(selectedClass, classData.subjectId, selectedDate);
      
      // Atualizar histórico de cada aluno
      students.forEach(student => {
        fetchStudentHistory(student.id);
      });
      
    } catch (error) {
      console.error('Erro ao salvar frequência:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar frequência');
    } finally {
      setIsSaving(false);
    }
  };

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Calcular estatísticas do dia
  const getDayStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const pending = attendanceRecords.filter(r => r.status === 'pending').length;
    
    return { total, present, absent, pending };
  };

  const dayStats = getDayStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Controle de Frequência
                </h1>
                <p className="text-slate-600 mt-1 text-lg">Sistema inteligente de gestão de presença</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-slate-100 rounded-xl px-4 py-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              <span className="font-semibold text-slate-700">{formatDate(selectedDate)}</span>
            </div>
          </div>
        </div>

        {/* Configurações da Aula */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <span>Configurações da Aula</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Turma e Disciplina</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem: Class) => (
                      <SelectItem key={classItem.classId} value={classItem.classId}>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>{classItem.className} - {classItem.subjectName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Data da Aula</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-12 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas do Dia */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total de Alunos</p>
                  <p className="text-3xl font-bold">{dayStats.total}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Presentes</p>
                  <p className="text-3xl font-bold">{dayStats.present}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Faltas</p>
                  <p className="text-3xl font-bold">{dayStats.absent}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserX className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Frequência</p>
                  <p className="text-3xl font-bold">
                    {dayStats.total > 0 ? Math.round((dayStats.present / dayStats.total) * 100) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Chamada */}
        {selectedClass && students.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Lista de Chamada</h2>
                    <p className="text-slate-600">{formatDate(selectedDate)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>Última atualização: agora</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceRecords.map((record, index) => {
                const history = studentHistory[record.studentId];
                return (
                  <div key={record.studentId} className="group">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800">{record.studentName}</h3>
                            <p className="text-slate-600">Matrícula: {record.registrationNumber}</p>
                            {history && (
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  {history.presentCount} presentes
                                </Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <UserX className="w-3 h-3 mr-1" />
                                  {history.absentCount} faltas
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  <BarChart3 className="w-3 h-3 mr-1" />
                                  {history.attendanceRate}% frequência
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Button
                            variant={record.status === 'present' ? 'default' : 'outline'}
                            size="lg"
                            onClick={() => handleStatusChange(record.studentId, 'present')}
                            className={`transition-all duration-200 ${
                              record.status === 'present' 
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                                : 'border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400'
                            }`}
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Presente
                          </Button>
                          <Button
                            variant={record.status === 'absent' ? 'default' : 'outline'}
                            size="lg"
                            onClick={() => handleStatusChange(record.studentId, 'absent')}
                            className={`transition-all duration-200 ${
                              record.status === 'absent' 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                                : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                            }`}
                          >
                            <XCircle className="w-5 h-5 mr-2" />
                            Falta
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            
            <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveAttendance}
                  disabled={isSaving || dayStats.pending === dayStats.total}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar Lista de Chamada'}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}