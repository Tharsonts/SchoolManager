import { useLocation } from "wouter";
import { BarChart3, BookOpen, Calendar, ChevronRight, Users, UserRound, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PerformanceChart } from "../charts/PerformanceChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function TeacherDashboard() {
  const [, navigate] = useLocation();
  const currentDate = formatDate(new Date());
  const { user } = useAuth();
  
  // Buscar dados do professor
  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ['teacher-data', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do professor');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar turmas do professor
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/classes`);
      if (!response.ok) throw new Error('Falha ao carregar turmas');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar próximas aulas
  const { data: upcomingClassesData, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['teacher-upcoming-classes', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/upcoming-classes`);
      if (!response.ok) throw new Error('Falha ao carregar próximas aulas');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar notas recentes
  const { data: recentGradesData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['teacher-recent-grades', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/recent-grades`);
      if (!response.ok) throw new Error('Falha ao carregar notas recentes');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Buscar alunos em atenção
  const { data: studentsToWatchData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['teacher-students-watch', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/teacher/${user?.id}/students-watch`);
      if (!response.ok) throw new Error('Falha ao carregar alunos em atenção');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Processar dados para estatísticas
  const stats = [
    { 
      title: "Minhas Turmas", 
      value: classesData?.data?.length || "0", 
      icon: <Users className="h-6 w-6 text-white" />,
      bgColor: "bg-blue-500 dark:bg-blue-600",
      loading: isLoadingClasses
    },
    { 
      title: "Total de Alunos", 
      value: classesData?.data?.reduce((acc: number, cls: any) => acc + (cls.currentStudents || 0), 0) || "0", 
      icon: <UserRound className="h-6 w-6 text-white" />,
      bgColor: "bg-secondary-500 dark:bg-secondary-500",
      loading: isLoadingClasses
    },
    { 
      title: "Próximas Aulas", 
      value: upcomingClassesData?.data?.length || "0", 
      icon: <Clock className="h-6 w-6 text-white" />,
      bgColor: "bg-green-500 dark:bg-green-600",
      loading: isLoadingUpcoming
    },
    { 
      title: "Disciplinas", 
      value: classesData?.data?.reduce((acc: number, cls: any) => acc + (cls.subjects?.length || 0), 0) || "0", 
      icon: <BookOpen className="h-6 w-6 text-white" />,
      bgColor: "bg-purple-500 dark:bg-purple-600",
      loading: isLoadingClasses
    }
  ];

  // Processar próximas aulas
  const upcomingClasses = upcomingClassesData?.data || [];

  // Processar notas recentes
  const recentGrades = recentGradesData?.data || [];

  // Processar alunos em atenção
  const studentsToWatch = studentsToWatchData?.data || [];

  if (isLoadingTeacher || isLoadingClasses) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate">
            Bem-vindo, {user?.firstName || 'Professor'}!
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visão geral do professor - {currentDate}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          <Button 
            onClick={() => navigate('/attendance')} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Frequência
          </Button>
          <Button 
            onClick={() => navigate('/grades')} 
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Lançar Notas
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-white dark:bg-dark-600 overflow-hidden shadow rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                  {stat.icon}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.title}
                    </dt>
                    <dd className="flex items-baseline">
                      {stat.loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      ) : (
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
              Desempenho por Turma
            </h3>
            <div className="h-80">
              <PerformanceChart />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Próximas Aulas
            </h3>
            <button 
              onClick={() => navigate('/my-classes')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver todas <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {isLoadingUpcoming ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando...</span>
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma aula agendada</p>
                <p className="text-sm">Você não tem aulas nos próximos dias</p>
              </div>
            ) : (
              upcomingClasses.map((cls: any, index: number) => (
                <div key={index} className="py-3">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {cls.className} - {cls.subjectName}
                    </div>
                    <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {cls.day}, {cls.time}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {cls.room || "Sala não definida"}
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {cls.studentsCount || 0} alunos
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Grades and Students to Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Notas Recentes
            </h3>
            <button 
              onClick={() => navigate('/grades')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Lançar notas <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {isLoadingGrades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando...</span>
              </div>
            ) : recentGrades.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma nota lançada</p>
                <p className="text-sm">Comece a lançar notas para seus alunos</p>
              </div>
            ) : (
              recentGrades.map((grade: any, index: number) => (
                <div key={index} className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {grade.className}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {grade.subjectName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Lançada em: {formatDate(new Date(grade.createdAt))}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {grade.studentsCount || 0} alunos avaliados
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {grade.status || "Lançada"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Alunos em Atenção
            </h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {isLoadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando...</span>
              </div>
            ) : studentsToWatch.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20 text-green-500" />
                <p>Nenhum aluno em atenção</p>
                <p className="text-sm">Todos os alunos estão com bom desempenho</p>
              </div>
            ) : (
              studentsToWatch.map((student: any, index: number) => (
                <div key={index} className="py-3">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                        {getUserInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.className} - {student.issue}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {student.issue === "Baixo desempenho" && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        {student.issue === "Faltas frequentes" && (
                          <XCircle className="h-3 w-3 text-yellow-500" />
                        )}
                        {student.issue === "Indisciplina" && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {student.issue}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-red-500 dark:text-red-400">
                      {student.averageGrade || "N/A"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/attendance')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Registrar Frequência</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/grades')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <BookOpen className="h-6 w-6" />
                <span>Lançar Notas</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/activities')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2"
              >
                <Calendar className="h-6 w-6" />
                <span>Criar Atividade</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
