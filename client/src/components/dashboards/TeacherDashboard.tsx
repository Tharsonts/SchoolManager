import { useLocation } from "wouter";
import { BarChart3, BookOpen, Calendar, ChevronRight, Users, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PerformanceChart } from "../charts/PerformanceChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function TeacherDashboard() {
  const [, navigate] = useLocation();
  const currentDate = formatDate(new Date());
  const { user } = useAuth();
  
  // In a real app, this data would come from the API
  const stats = [
    { 
      title: "Minhas Turmas", 
      value: "5", 
      icon: <Users className="h-6 w-6 text-white" />,
      bgColor: "bg-blue-500 dark:bg-blue-600"
    },
    { 
      title: "Total de Alunos", 
      value: "127", 
      icon: <UserRound className="h-6 w-6 text-white" />,
      bgColor: "bg-secondary-500 dark:bg-secondary-500"
    },
    { 
      title: "Média Geral", 
      value: "7.5", 
      change: "+2%", 
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      bgColor: "bg-green-500 dark:bg-green-600"
    },
    { 
      title: "Disciplinas", 
      value: "3", 
      icon: <BookOpen className="h-6 w-6 text-white" />,
      bgColor: "bg-purple-500 dark:bg-purple-600"
    }
  ];
  
  const upcomingClasses = [
    { className: "9º Ano A - Matemática", day: "Segunda-feira", time: "07:30 - 09:10", room: "Sala 12" },
    { className: "8º Ano B - Matemática", day: "Segunda-feira", time: "09:30 - 11:10", room: "Sala 8" },
    { className: "7º Ano C - Matemática", day: "Terça-feira", time: "07:30 - 09:10", room: "Sala 5" },
    { className: "9º Ano B - Matemática", day: "Quarta-feira", time: "09:30 - 11:10", room: "Sala 12" },
  ];
  
  const recentGrades = [
    { class: "9º Ano A", subject: "Matemática", date: "14/07/2023", status: "Lançada" },
    { class: "8º Ano B", subject: "Matemática", date: "10/07/2023", status: "Lançada" },
    { class: "7º Ano C", subject: "Matemática", date: "05/07/2023", status: "Lançada" }
  ];
  
  const studentsToWatch = [
    { name: "João Silva", class: "9º Ano A", issue: "Baixo desempenho", grade: "4.5" },
    { name: "Maria Oliveira", class: "8º Ano B", issue: "Faltas frequentes", grade: "6.0" },
    { name: "Pedro Santos", class: "7º Ano C", issue: "Indisciplina", grade: "5.8" }
  ];
  
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
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.title}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                      {stat.change && (
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L8 7.586V2a1 1 0 10-2 0v5.586L3.707 5.293z" clipRule="evenodd" fillRule="evenodd"></path>
                          </svg>
                          <span className="sr-only">Aumento de</span>
                          {stat.change}
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
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Desempenho por Turma</h3>
            <div className="h-80">
              <PerformanceChart />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Próximas Aulas</h3>
            <button 
              onClick={() => navigate('/my-classes')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver todas <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {upcomingClasses.map((cls, index) => (
              <div key={index} className="py-3">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{cls.className}</div>
                  <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    {cls.day}, {cls.time}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {cls.room}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Grades and Students to Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Notas Recentes</h3>
            <button 
              onClick={() => navigate('/grades')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Lançar notas <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {recentGrades.map((grade, index) => (
              <div key={index} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{grade.class}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{grade.subject}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Lançada em: {grade.date}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {grade.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Alunos em Atenção</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {studentsToWatch.map((student, index) => (
              <div key={index} className="py-3">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                      {getUserInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.class} - {student.issue}</p>
                  </div>
                  <div className="text-sm font-medium text-red-500 dark:text-red-400">
                    {student.grade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
