import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Search,
  Eye,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherClasses, useClassStudents } from '@/hooks/useApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  enrollmentDate: string;
  status: string;
}

interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  schoolYear: string;
  studentCount: number;
  subjects: Array<{
    id: string;
    name: string;
    teacherName: string;
  }>;
  students: ClassStudent[];
}

export function TeacherClassesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  const { data: classesData, isLoading } = useTeacherClasses(user?.id);
  const classes = classesData?.data || [];
  
  // Buscar alunos da turma selecionada
  const { data: studentsData } = useClassStudents(selectedClass?.id);
  const students = studentsData || [];

  // Agrupar turmas por classe e processar dados
  const groupedClasses = classes.reduce((acc: any, cls: any) => {
    const key = cls.classId;
    if (!acc[key]) {
      acc[key] = {
        id: cls.classId,
        name: cls.className,
        grade: cls.className.split(' ')[0], // Extrair série do nome da turma
        schoolYear: new Date().getFullYear().toString(), // Ano atual
        studentCount: cls.studentCount || 0,
        subjects: []
      };
    }
    acc[key].subjects.push({
      id: cls.subjectId,
      name: cls.subjectName,
      teacherName: `${user?.firstName} ${user?.lastName}`
    });
    return acc;
  }, {});

  const classesWithSubjects = Object.values(groupedClasses);

  const filteredClasses = classesWithSubjects.filter((classItem: any) =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewStudents = (classItem: ClassInfo) => {
    setSelectedClass(classItem);
    setShowStudentsModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Inativo</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-red-600 border-red-600">Suspenso</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando turmas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Turmas</h1>
            <p className="text-gray-600 mt-1">
              Gerencie as turmas e disciplinas que você leciona
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome da turma ou série..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Turmas */}
        <Card>
          <CardContent className="p-0">
            {filteredClasses.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma atribuída'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Tente ajustar os termos de busca'
                    : 'Você ainda não foi atribuído a nenhuma turma'
                  }
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turma</TableHead>
                    <TableHead>Série</TableHead>
                    <TableHead>Ano Letivo</TableHead>
                    <TableHead>Disciplinas</TableHead>
                    <TableHead>Alunos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((classItem: any) => (
                    <TableRow key={classItem.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{classItem.name}</div>
                            <div className="text-sm text-gray-500">ID: {classItem.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {classItem.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{classItem.schoolYear}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {classItem.subjects.map((subject: any) => (
                            <div key={subject.id} className="flex items-center gap-2">
                              <BookOpen className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{subject.name}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{classItem.studentCount || 0}</span>
                          <span className="text-sm text-gray-500">alunos</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStudents(classItem)}
                          className="h-8 w-8 p-0"
                          title="Ver alunos"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Alunos */}
      {showStudentsModal && selectedClass && (
        <Dialog open={showStudentsModal} onOpenChange={setShowStudentsModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Alunos da Turma {selectedClass.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Informações da Turma */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Série</Label>
                  <p className="text-sm text-gray-900">{selectedClass.grade}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Ano Letivo</Label>
                  <p className="text-sm text-gray-900">{selectedClass.schoolYear}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total de Alunos</Label>
                  <p className="text-sm text-gray-900">{students.length}</p>
                </div>
              </div>

              {/* Lista de Alunos */}
              <div className="max-h-96 overflow-y-auto">
                {students && students.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Data de Matrícula</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{student.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-600">{student.phone}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Não informado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {format(new Date(student.enrollmentDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(student.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum aluno encontrado nesta turma</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowStudentsModal(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default TeacherClassesPage;