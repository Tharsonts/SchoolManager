import { useLocation } from "wouter";
import { BookOpen, Calendar, ChevronRight, GraduationCap, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ClassPerformanceChart } from "../charts/ClassPerformanceChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export function StudentDashboard() {
  const [, navigate] = useLocation();
  const currentDate = formatDate(new Date());
  const { user } = useAuth();
  
  // In a real app, this data would come from the API
  const stats = [
    { 
      title: "Média Geral", 
      value: "8.2", 
      change: "+3%", 
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      bgColor: "bg-blue-500 dark:bg-blue-600"
    },
    { 
      title: "Presença", 
      value: "96%", 
      icon: <UserRound className="h-6 w-6 text-white" />,
      bgColor: "bg-green-500 dark:bg-green-600"
    },
    { 
      title: "Disciplinas", 
      value: "8", 
      icon: <BookOpen className="h-6 w-6 text-white" />,
      bgColor: "bg-purple-500 dark:bg-purple-600"
    },
    { 
      title: "Próximos Eventos", 
      value: "3", 
      icon: <Calendar className="h-6 w-6 text-white" />,
      bgColor: "bg-yellow-500 dark:bg-yellow-600"
    }
  ];
  
  const upcomingDeadlines = [
    { 
      title: "Trabalho de História", 
      description: "Revolução Industrial", 
      date: "18 de Julho, 2023", 
      daysLeft: "3 dias restantes",
      status: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    },
    { 
      title: "Exercícios de Matemática", 
      description: "Equações do 2º Grau", 
      date: "20 de Julho, 2023", 
      daysLeft: "5 dias restantes",
      status: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    },
    { 
      title: "Projeto de Ciências", 
      description: "Sistemas Solares", 
      date: "25 de Julho, 2023", 
      daysLeft: "10 dias restantes",
      status: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  ];
  
  const announcements = [
    { 
      author: "Prof. Silva", 
      message: "Lembrem-se de trazer o material para o laboratório amanhã.", 
      time: "Há 2 horas" 
    },
    { 
      author: "Coordenação", 
      message: "Reunião de pais marcada para o dia 15/07 às 19h.", 
      time: "Ontem" 
    },
    { 
      author: "Prof. Carla", 
      message: "As notas do trabalho de Literatura já estão disponíveis.", 
      time: "3 dias atrás" 
    }
  ];
  
  const upcomingEvents = [
    { color: "bg-blue-500", title: "Prova de Matemática", date: "18 de Julho, 8:00" },
    { color: "bg-green-500", title: "Entrega de Trabalho", date: "20 de Julho, 14:00" },
    { color: "bg-purple-500", title: "Feira de Ciências", date: "25 de Julho, 9:00" }
  ];
  
  return (
    <div className="fade-in">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate">
            Bem-vindo, {user?.firstName || 'Aluno'}!
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visão geral do seu desempenho - {currentDate}
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

      {/* Charts and Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Desempenho por Disciplina</h3>
            <div className="h-80">
              <ClassPerformanceChart />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Próximas Entregas</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{deadline.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{deadline.description}</p>
                    <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {deadline.date}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deadline.status}`}>
                      {deadline.daysLeft}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Announcements, Attendance and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recados</h3>
            <button 
              onClick={() => navigate('/notifications')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {announcements.map((announcement, index) => (
              <div key={index} className="py-3">
                <div className="flex items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{announcement.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{announcement.message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{announcement.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Registro de Presença</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-32 w-32 relative">
                <svg viewBox="0 0 36 36" className="h-32 w-32">
                  <path className="stroke-current text-gray-200 dark:text-dark-400" fill="none" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="stroke-current text-green-500" fill="none" strokeWidth="3" strokeLinecap="round" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.5" className="text-3xl font-medium fill-current text-gray-700 dark:text-gray-300" textAnchor="middle">96%</text>
                </svg>
              </div>
            </div>
            <div className="mt-2 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de aulas: 125</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Presença: 120</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Faltas: 5</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Próximos Eventos</h3>
            <button 
              onClick={() => navigate('/calendar')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] space-y-5">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <div className={`${event.color} h-5 w-1 rounded-full mr-4`}></div>
                </div>
                <div className="ml-1 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                  <p className="text-gray-500 dark:text-gray-400">{event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
