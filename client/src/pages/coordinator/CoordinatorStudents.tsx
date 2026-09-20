import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  UserCheck,
  UserX,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  classInfo?: {
    id: string;
    name: string;
    grade: string;
    section: string;
    enrollmentDate: string;
  };
  attendanceStats?: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
    lastAttendanceDate?: string;
  };
  gradeStats?: {
    averageGrade: number;
    totalGrades: number;
    lastGradeDate: string;
  };
}

const CoordinatorStudents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Buscar todos os alunos
  const { data: studentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['coordinator-students'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/students', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar alunos');
      }
      return response.json();
    }
  });

  // Buscar turmas para filtro
  const { data: classesData } = useQuery({
    queryKey: ['coordinator-classes'],
    queryFn: async () => {
      const response = await fetch('/api/coordinator/classes', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar turmas');
      }
      return response.json();
    }
  });

  const students: Student[] = studentsData?.data || [];
  const classes = classesData?.data || [];

  // Filtrar alunos
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    const matchesClass = classFilter === 'all' || 
      (student.classInfo && student.classInfo.id === classFilter);
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'suspended': return 'Suspenso';
      default: return 'Desconhecido';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return 'text-green-600';
    if (grade >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar alunos</p>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Alunos</h1>
          <p className="text-gray-600 mt-1">Gerencie frequência, notas e informações dos alunos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              refetch();
              toast.success('Dados atualizados!');
            }}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Badge variant="outline" className="px-3 py-1">
            <Users className="w-4 h-4 mr-1" />
            {filteredStudents.length} alunos
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar aluno</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome, sobrenome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class">Turma</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.grade}º {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setClassFilter('all');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.profileImageUrl} />
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {student.firstName[0]}{student.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{student.email}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(student.status)}>
                  {getStatusLabel(student.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Informações da Turma */}
              {student.classInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span>{student.classInfo.grade}º {student.classInfo.section}</span>
                </div>
              )}

              {/* Estatísticas de Frequência */}
              {student.attendanceStats && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Frequência</span>
                    <span className={`text-sm font-bold ${getAttendanceColor(student.attendanceStats.attendanceRate)}`}>
                      {student.attendanceStats.attendanceRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-blue-600">
                    <div className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>{student.attendanceStats.presentCount} presentes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserX className="w-3 h-3" />
                      <span>{student.attendanceStats.absentCount} faltas</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Estatísticas de Notas */}
              {student.gradeStats && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Média Geral</span>
                    <span className={`text-sm font-bold ${getGradeColor(student.gradeStats.averageGrade)}`}>
                      {student.gradeStats.averageGrade.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-green-600">
                    {student.gradeStats.totalGrades} avaliações
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewDetails(student)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno encontrado</h3>
          <p className="text-gray-500">Tente ajustar os filtros de busca</p>
        </div>
      )}

      {/* Modal de Detalhes do Aluno */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
            <DialogDescription>
              Informações completas e estatísticas do aluno
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Completo</Label>
                  <p className="text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedStudent.status)}>
                    {getStatusLabel(selectedStudent.status)}
                  </Badge>
                </div>
                {selectedStudent.classInfo && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Turma</Label>
                    <p className="text-gray-900">
                      {selectedStudent.classInfo.grade}º {selectedStudent.classInfo.section}
                    </p>
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4">
                {selectedStudent.attendanceStats && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Frequência</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Taxa de Presença</span>
                        <span className={`font-bold ${getAttendanceColor(selectedStudent.attendanceStats.attendanceRate)}`}>
                          {selectedStudent.attendanceStats.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Total de Aulas</span>
                        <span className="text-sm text-blue-900">{selectedStudent.attendanceStats.totalClasses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Presenças</span>
                        <span className="text-sm text-blue-900">{selectedStudent.attendanceStats.presentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Faltas</span>
                        <span className="text-sm text-blue-900">{selectedStudent.attendanceStats.absentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700">Última Presença</span>
                        <span className="text-sm text-blue-900">
                          {selectedStudent.attendanceStats.lastAttendanceDate 
                            ? new Date(selectedStudent.attendanceStats.lastAttendanceDate).toLocaleDateString('pt-BR')
                            : 'Nenhuma'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedStudent.gradeStats && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">Notas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Média Geral</span>
                        <span className={`font-bold ${getGradeColor(selectedStudent.gradeStats.averageGrade)}`}>
                          {selectedStudent.gradeStats.averageGrade.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Total de Avaliações</span>
                        <span className="text-sm text-green-900">{selectedStudent.gradeStats.totalGrades}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Última Nota</span>
                        <span className="text-sm text-green-900">
                          {new Date(selectedStudent.gradeStats.lastGradeDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </MainLayout>
  );
};

export default CoordinatorStudents;
