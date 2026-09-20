import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { useStudentClassInfo } from '@/hooks/useStudentApi';

export default function StudentClassPage() {
  const { data: classData, isLoading, error } = useStudentClassInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações da turma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Erro ao carregar informações</div>
          <p className="text-gray-600">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  const classInfo = classData?.data;

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Não matriculado em nenhuma turma
          </h3>
          <p className="text-gray-600">
            Entre em contato com a administração para ser matriculado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações da Turma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-amber-600" />
            {classInfo.class.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Informações Básicas</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Série: {classInfo.class.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Seção: {classInfo.class.section}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Ano Letivo: {classInfo.class.academicYear}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Estatísticas</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total de alunos: {classInfo.totalStudents}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Professores: {classInfo.teachers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Capacidade: {classInfo.class.capacity}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Sua Matrícula</h3>
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-800">
                  <User className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
                <p className="text-sm text-gray-600">
                  Matriculado desde: {classInfo.enrollmentDate ? 
                    new Date(classInfo.enrollmentDate).toLocaleDateString('pt-BR') : 
                    'Data não disponível'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-amber-600" />
            Professores da Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classInfo.teachers.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum professor vinculado
              </h3>
              <p className="text-gray-600">
                Ainda não há professores vinculados a esta turma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classInfo.teachers.map((teacher: any) => (
                <div key={teacher.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.profileImageUrl} />
                    <AvatarFallback>
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{teacher.subjectName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{teacher.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Colegas de Turma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Colegas de Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classInfo.classmates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Você é o único aluno da turma
              </h3>
              <p className="text-gray-600">
                Não há outros alunos matriculados nesta turma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classInfo.classmates.map((classmate: any) => (
                <div key={classmate.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={classmate.profileImageUrl} />
                    <AvatarFallback>
                      {classmate.firstName[0]}{classmate.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {classmate.firstName} {classmate.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{classmate.email}</p>
                    {classmate.registrationNumber && (
                      <p className="text-xs text-gray-500">
                        Matrícula: {classmate.registrationNumber}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}