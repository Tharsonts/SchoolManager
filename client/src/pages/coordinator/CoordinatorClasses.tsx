import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Users, 
  Calendar,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Eye
} from 'lucide-react';

export default function CoordinatorClasses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);

  // Buscar turmas reais da API do coordenador
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/classes');
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      return response.json();
    }
  });

  const classes = classesData?.data || [];
  console.log('📊 Turmas recebidas:', classes);

  // Buscar alunos para calcular estatísticas
  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await fetch('/api/users?role=student');
      if (!response.ok) throw new Error('Erro ao buscar alunos');
      const data = await response.json();
      console.log('📊 Dados dos alunos:', data);
      console.log('📊 Total de alunos:', data.length);
      if (data.length > 0) {
        console.log('📊 Exemplo de aluno:', data[0]);
      }
      return data;
    }
  });

  // Buscar atividades para calcular estatísticas
  const { data: activities = [] } = useQuery({
    queryKey: ['coordinator-activities'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/activities');
      if (!response.ok) throw new Error('Erro ao buscar atividades');
      return response.json();
    }
  });

  // Buscar provas para calcular estatísticas
  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await fetch('/api/exams');
      if (!response.ok) throw new Error('Erro ao buscar provas');
      return response.json();
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Ativa</Badge>;
      case 'inativo':
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><AlertTriangle className="w-3 h-3 mr-1" />Inativa</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" />Ativa</Badge>;
    }
  };

  const getClassStats = (classItem: any) => {
    // Os dados já vêm da API com as estatísticas calculadas
    return {
      studentsCount: classItem.studentsCount || 0,
      activitiesCount: classItem.activitiesCount || 0,
      examsCount: classItem.examsCount || 0,
      avgGrade: classItem.avgGrade || 0,
      attendanceRate: classItem.attendanceRate || 0,
      teachers: classItem.teachers || [],
      lastActivity: classItem.lastActivity,
      totalGrades: classItem.totalGrades || 0,
      totalAttendanceRecords: classItem.totalAttendanceRecords || 0
    };
  };

  const getGradeStatus = (avgGrade: number, totalGrades: number) => {
    if (totalGrades === 0) return { status: 'no-data', emoji: '📊', text: 'Sem notas' };
    if (avgGrade >= 7.0) return { status: 'good', emoji: '✅', text: 'Boa' };
    if (avgGrade >= 5.0) return { status: 'warning', emoji: '⚠️', text: 'Atenção' };
    return { status: 'danger', emoji: '🚨', text: 'Crítica' };
  };

  const getAttendanceStatus = (attendanceRate: number, totalRecords: number) => {
    if (totalRecords === 0) return { status: 'no-data', emoji: '📊', text: 'Sem dados' };
    if (attendanceRate >= 85) return { status: 'good', emoji: '✅', text: 'Boa' };
    if (attendanceRate >= 50) return { status: 'warning', emoji: '⚠️', text: 'Atenção' };
    return { status: 'danger', emoji: '🚨', text: 'Crítica' };
  };

  const filteredClasses = classes.filter((classItem: any) => {
    const matchesSearch = classItem.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (classItem.teachers && classItem.teachers.some((teacher: any) => 
                           teacher.name?.toLowerCase().includes(searchTerm.toLowerCase())
                         )) ||
                         (classItem.teachers && classItem.teachers.some((teacher: any) => 
                           teacher.subject?.toLowerCase().includes(searchTerm.toLowerCase())
                         ));
    
    return matchesSearch;
  });

  const totalStudents = classes.reduce((sum: number, classItem: any) => sum + (classItem.studentsCount || 0), 0);
  const totalActivities = classes.reduce((sum: number, classItem: any) => sum + (classItem.activitiesCount || 0), 0);
  const totalExams = classes.reduce((sum: number, classItem: any) => sum + (classItem.examsCount || 0), 0);

  const fetchClassStudents = async (classId: string) => {
    try {
      const response = await fetch(`/api/coordinator/classes/${classId}/students`);
      if (response.ok) {
        const data = await response.json();
        setClassStudents(data.data || []);
      } else {
        setClassStudents([]);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos da turma:', error);
      setClassStudents([]);
    }
  };

  const handleViewDetails = (classItem: any) => {
    setSelectedClass(classItem);
    setIsDetailsModalOpen(true);
    fetchClassStudents(classItem.id);
  };

  if (classesLoading) {
    return (
      <MainLayout pageTitle="Monitoramento de Turmas">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando turmas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout pageTitle="Monitoramento de Turmas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Monitoramento de Turmas</h1>
            <p className="text-gray-600 mt-2">
              Acompanhe o desempenho e atividades das turmas
            </p>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Turmas</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Alunos</p>
                <p className="text-2xl font-bold text-green-600">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atividades Ativas</p>
                <p className="text-2xl font-bold text-purple-600">{totalActivities}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Provas Agendadas</p>
                <p className="text-2xl font-bold text-orange-600">{totalExams}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar turmas, professores ou matérias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses.length > 0 ? (
            filteredClasses.map((classItem: any) => {
              const stats = getClassStats(classItem);
              return (
                <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{classItem.name || 'Nome não informado'}</h3>
                      {getStatusBadge(classItem.status)}
                      <Badge variant="outline">
                        {stats.teachers.length > 0 
                          ? `${stats.teachers.length} professor(es)` 
                          : 'Sem professores'
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">
                        Professores: <span className="font-medium">
                          {stats.teachers.length > 0 
                            ? `${stats.teachers.length} professor(es)`
                            : 'Não informado'
                          }
                        </span>
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(classItem)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Alunos</p>
                      <p className="text-xl font-bold text-blue-600">{stats.studentsCount}</p>
                      <p className="text-xs text-gray-500">cadastrados</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'good' ? 'bg-green-50' :
                      getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'warning' ? 'bg-yellow-50' :
                      getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'danger' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <p className="text-sm text-gray-600">Nota Média</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-lg">{getGradeStatus(stats.avgGrade, stats.totalGrades).emoji}</span>
                        <p className={`text-xl font-bold ${
                          getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'good' ? 'text-green-600' :
                          getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'warning' ? 'text-yellow-600' :
                          getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'danger' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {stats.avgGrade > 0 ? stats.avgGrade.toFixed(1) : 'N/A'}
                        </p>
                      </div>
                      <p className={`text-xs ${
                        getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'good' ? 'text-green-600' :
                        getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'warning' ? 'text-yellow-600' :
                        getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'danger' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {getGradeStatus(stats.avgGrade, stats.totalGrades).text}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    <div className={`text-center p-2 rounded-lg ${
                      getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'good' ? 'bg-green-50' :
                      getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'warning' ? 'bg-yellow-50' :
                      getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'danger' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">{getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).emoji}</span>
                        <p className="text-gray-600">Presença</p>
                      </div>
                      <p className={`font-bold ${
                        getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'good' ? 'text-green-600' :
                        getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'warning' ? 'text-yellow-600' :
                        getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'danger' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {stats.attendanceRate > 0 ? `${stats.attendanceRate}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Atividades</p>
                      <p className="font-bold text-purple-600">{stats.activitiesCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Provas</p>
                      <p className="font-bold text-blue-600">{stats.examsCount}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Criada em:</p>
                      <p className="text-gray-600">{classItem.createdAt ? new Date(classItem.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Última atividade:</p>
                      <p className="text-gray-600">
                        {stats.lastActivity 
                          ? `${stats.lastActivity.title} (${new Date(stats.lastActivity.createdAt).toLocaleDateString('pt-BR')})`
                          : 'Sem atividades'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="mt-4 space-y-2">
                    {stats.studentsCount === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Atenção: Nenhum aluno cadastrado nesta turma
                        </span>
                      </div>
                    )}
                    
                    {getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'danger' && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-lg">🚨</span>
                        <span className="text-sm text-red-800">
                          Nota média crítica: {stats.avgGrade.toFixed(1)} - Necessária intervenção pedagógica
                        </span>
                      </div>
                    )}
                    
                    {getGradeStatus(stats.avgGrade, stats.totalGrades).status === 'warning' && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-lg">⚠️</span>
                        <span className="text-sm text-yellow-800">
                          Nota média baixa: {stats.avgGrade.toFixed(1)} - Acompanhamento necessário
                        </span>
                      </div>
                    )}
                    
                    {getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'danger' && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <span className="text-lg">🚨</span>
                        <span className="text-sm text-red-800">
                          Presença crítica: {stats.attendanceRate}% - Necessária intervenção
                        </span>
                      </div>
                    )}
                    
                    {getAttendanceStatus(stats.attendanceRate, stats.totalAttendanceRecords).status === 'warning' && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-lg">⚠️</span>
                        <span className="text-sm text-yellow-800">
                          Presença baixa: {stats.attendanceRate}% - Acompanhamento necessário
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-2">
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turma encontrada</h3>
                <p className="text-gray-600">
                  Não há turmas que correspondam aos filtros selecionados.
                </p>
              </Card>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Turma com Mais Alunos</p>
                <p className="text-xl font-bold text-blue-800">
                  {classes.length > 0 ? 
                    classes.reduce((best: any, current: any) => {
                      const currentStats = getClassStats(current);
                      const bestStats = getClassStats(best);
                      return currentStats.studentsCount > bestStats.studentsCount ? current : best;
                    }).name || 'N/A'
                    : 'N/A'
                  }
                </p>
                <p className="text-sm text-blue-600">
                  {classes.length > 0 ? 
                    `${getClassStats(classes.reduce((best: any, current: any) => {
                      const currentStats = getClassStats(current);
                      const bestStats = getClassStats(best);
                      return currentStats.studentsCount > bestStats.studentsCount ? current : best;
                    })).studentsCount} alunos`
                    : '0 alunos'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Turma Mais Ativa</p>
                <p className="text-xl font-bold text-green-800">
                  {classes.length > 0 ? 
                    classes.reduce((best: any, current: any) => {
                      const currentStats = getClassStats(current);
                      const bestStats = getClassStats(best);
                      return currentStats.activitiesCount > bestStats.activitiesCount ? current : best;
                    }).name || 'N/A'
                    : 'N/A'
                  }
                </p>
                <p className="text-sm text-green-600">
                  {classes.length > 0 ? 
                    `${getClassStats(classes.reduce((best: any, current: any) => {
                      const currentStats = getClassStats(current);
                      const bestStats = getClassStats(best);
                      return currentStats.activitiesCount > bestStats.activitiesCount ? current : best;
                    })).activitiesCount} atividades`
                    : '0 atividades'
                  }
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total de Provas</p>
                <p className="text-xl font-bold text-purple-800">{totalExams}</p>
                <p className="text-sm text-purple-600">agendadas</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Modal de Detalhes da Turma */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Detalhes da Turma: {selectedClass?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedClass && (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Total de Alunos</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {getClassStats(selectedClass).studentsCount}
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Professores</p>
                      <p className="text-2xl font-bold text-green-600">
                        {getClassStats(selectedClass).teachers.length}
                      </p>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Disciplinas</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {new Set(getClassStats(selectedClass).teachers.map((t: any) => t.subject)).size}
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Lista de Professores */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Professores e Disciplinas
                  </h3>
                  <div className="space-y-3">
                    {getClassStats(selectedClass).teachers.length > 0 ? (
                      getClassStats(selectedClass).teachers.map((teacher: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {teacher.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{teacher.name}</p>
                              <p className="text-sm text-gray-600">{teacher.subject}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Ativo
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum professor vinculado</p>
                    )}
                  </div>
                </Card>

                {/* Lista de Alunos */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Alunos Matriculados
                  </h3>
                  <div className="space-y-3">
                    {classStudents.length > 0 ? (
                      classStudents.map((student: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">
                                {student.firstName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Ativo
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nenhum aluno matriculado</p>
                    )}
                  </div>
                </Card>

              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
