import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useStudentSubjects } from '@/hooks/useApi';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  BookOpen,
  BarChart3
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  academicYear: string;
  createdAt: string;
}

interface SubjectStats {
  subjectId: string;
  subjectName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  excusedClasses: number;
}

interface GeneralStats {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

const StudentAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Buscar disciplinas da turma do aluno
  const { data: subjectsData = [], isLoading: subjectsLoading } = useStudentSubjects();
  const studentSubjects = Array.isArray(subjectsData) ? subjectsData : [];

  // Buscar frequência do aluno
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance', user?.id, selectedSubject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subjectId', selectedSubject);

      const response = await fetch(`/api/attendance/student/${user?.id}?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao buscar frequência');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const attendance: AttendanceRecord[] = attendanceData?.attendance || [];
  const statsBySubject: SubjectStats[] = attendanceData?.statsBySubject || [];
  const generalStats: GeneralStats = attendanceData?.generalStats || {
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 0
  };

  // Usar apenas as disciplinas da turma do aluno
  const uniqueSubjects = studentSubjects.map(s => ({ id: s.id, name: s.name }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'absent': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'late': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'excused': return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default: return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent': return 'Falta';
      case 'late': return 'Atraso';
      case 'excused': return 'Justificado';
      default: return 'Presente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minha Frequência</h1>
          <p className="text-gray-600 mt-1">Acompanhe seu histórico de presença e ausência</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disciplina
            </label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as disciplinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as disciplinas</SelectItem>
                {uniqueSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Frequência Geral</p>
                <p className={`text-3xl font-bold ${getAttendanceRateColor(generalStats.attendanceRate)}`}>
                  {generalStats.attendanceRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Aulas</p>
                <p className="text-3xl font-bold text-gray-900">{generalStats.totalClasses}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presenças</p>
                <p className="text-3xl font-bold text-green-600">{generalStats.presentCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faltas</p>
                <p className="text-3xl font-bold text-red-600">{generalStats.absentCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Disciplina */}
      {subjectsLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Frequência por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando disciplinas...</p>
            </div>
          </CardContent>
        </Card>
      ) : statsBySubject.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Frequência por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statsBySubject.map((subject) => {
                const attendanceRate = subject.totalClasses > 0 
                  ? (subject.presentClasses / subject.totalClasses) * 100 
                  : 0;
                
                return (
                  <div key={subject.subjectId} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{subject.subjectName}</h3>
                      <Badge className={getAttendanceRateColor(attendanceRate) === 'text-green-600' ? 'bg-green-100 text-green-800' : 
                                      getAttendanceRateColor(attendanceRate) === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'}>
                        {attendanceRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>{subject.totalClasses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Presente:</span>
                        <span className="text-green-600">{subject.presentClasses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Falta:</span>
                        <span className="text-red-600">{subject.absentClasses}</span>
                      </div>
                      {subject.lateClasses > 0 && (
                        <div className="flex justify-between">
                          <span>Atraso:</span>
                          <span className="text-yellow-600">{subject.lateClasses}</span>
                        </div>
                      )}
                      {subject.excusedClasses > 0 && (
                        <div className="flex justify-between">
                          <span>Justificado:</span>
                          <span className="text-blue-600">{subject.excusedClasses}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : studentSubjects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Frequência por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Nenhum registro de frequência encontrado</p>
              <p className="text-sm mt-1">Os registros aparecerão aqui conforme as aulas forem registradas</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Frequência por Disciplina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Nenhuma disciplina encontrada</p>
              <p className="text-sm mt-1">Entre em contato com a administração para verificar sua matrícula</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Frequência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Histórico de Frequência
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando frequência...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Nenhum registro de frequência encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(record.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {record.subjectName} - {record.className}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-gray-500 mt-1">
                          Observação: {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(record.status)}>
                      {getStatusLabel(record.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendancePage;