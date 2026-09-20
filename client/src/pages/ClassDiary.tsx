import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Award, 
  FileText, 
  BarChart3,
  Clock,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getUserInitials } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  subjects: {
    id: string;
    name: string;
    code: string;
  }[];
  studentCount: number;
  students: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    registrationNumber: string;
    profileImageUrl?: string;
  }[];
}

export default function ClassDiary() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Buscar turmas do professor
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['teacher-classes-detailed', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes-detailed`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar turmas');
      return response.json();
    },
    enabled: !!user?.id
  });

  const classes = classesData?.data || [];
  const today = new Date();

  // Estatísticas gerais
  const totalStudents = classes.reduce((acc: number, cls: ClassInfo) => acc + cls.studentCount, 0);
  const totalClasses = classes.length;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando diário de classe...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 p-6">
        {/* Header Profissional */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-3">Diário de Classe</h1>
              <p className="text-blue-100 text-lg mb-4">
                Sistema profissional de gestão acadêmica e registro escolar
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Ano Letivo 2024</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{totalClasses}</div>
              <div className="text-blue-100">Turmas Ativas</div>
              <div className="text-sm text-blue-200 mt-1">{totalStudents} estudantes</div>
            </div>
          </div>
        </div>

        {/* Dashboard Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-700">{totalClasses}</div>
                  <div className="text-sm font-medium text-blue-600">Turmas Ministradas</div>
                </div>
                <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 text-xs text-blue-600">
                Gestão completa das suas turmas
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-700">{totalStudents}</div>
                  <div className="text-sm font-medium text-green-600">Estudantes Ativos</div>
                </div>
                <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 text-xs text-green-600">
                Total sob sua responsabilidade
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-700">100%</div>
                  <div className="text-sm font-medium text-purple-600">Taxa de Presença</div>
                </div>
                <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 text-xs text-purple-600">
                Média semanal de frequência
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-amber-700">8.5</div>
                  <div className="text-sm font-medium text-amber-600">Média Geral</div>
                </div>
                <div className="h-12 w-12 bg-amber-600 rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 text-xs text-amber-600">
                Performance acadêmica global
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <FileText className="h-5 w-5 text-blue-600" />
              Ações Rápidas do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-16 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => navigate('/activities')}
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Nova Atividade</div>
                    <div className="text-xs opacity-90">Criar tarefa ou avaliação</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => {
                  if (classes[0]) {
                    navigate(`/class-detail/${classes[0].id}/attendance`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Registrar Presença</div>
                    <div className="text-xs opacity-70">Chamada do dia</div>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-16 border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={() => {
                  if (classes[0]) {
                    navigate(`/class-detail/${classes[0].id}/grades`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Lançar Notas</div>
                    <div className="text-xs opacity-70">Avaliações e trabalhos</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Turmas */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Suas Turmas</h2>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {totalClasses} turma{totalClasses !== 1 ? 's' : ''} ativa{totalClasses !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((classInfo: ClassInfo) => (
              <Card key={classInfo.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                        {classInfo.name}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="font-medium">{classInfo.grade} • Seção {classInfo.section}</span>
                        <span>•</span>
                        <span>{classInfo.academicYear}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {classInfo.studentCount} alunos
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Disciplinas */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Disciplinas</h4>
                    <div className="flex flex-wrap gap-2">
                      {classInfo.subjects.map((subject) => (
                        <Badge 
                          key={subject.id} 
                          variant="secondary" 
                          className="bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          {subject.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Preview dos Alunos */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Estudantes</h4>
                    {classInfo.students && classInfo.students.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex -space-x-2">
                          {classInfo.students.slice(0, 6).map((student) => (
                            <Avatar 
                              key={student.id} 
                              className="h-8 w-8 border-2 border-white ring-1 ring-gray-200"
                            >
                              <AvatarImage src={student.profileImageUrl} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                                {getUserInitials(student.firstName + ' ' + student.lastName)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {classInfo.students.length > 6 && (
                            <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center">
                              <span className="text-xs font-semibold text-gray-600">
                                +{classInfo.students.length - 6}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {classInfo.students.slice(0, 3).map(s => s.firstName).join(', ')}
                          {classInfo.students.length > 3 && ` e mais ${classInfo.students.length - 3}`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Nenhum aluno matriculado
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate(`/class-detail/${classInfo.id}/attendance`)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Presença
                    </Button>
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => navigate(`/class-detail/${classInfo.id}/grades`)}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Notas
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => navigate(`/class-detail/${classInfo.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {classes.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhuma turma encontrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Você ainda não possui turmas atribuídas. Entre em contato com a coordenação.
                </p>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Contatar Coordenação
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}





