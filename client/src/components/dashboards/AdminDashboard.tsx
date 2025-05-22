import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BarChart3, BookOpen, Calendar, ChevronRight, GraduationCap, Users, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PerformanceChart } from "../charts/PerformanceChart";
import { GradeDistributionChart } from "../charts/GradeDistributionChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";

export function AdminDashboard() {
  const [, navigate] = useLocation();
  const currentDate = formatDate(new Date());
  
  // In a real app, this data would come from the API
  const stats = [
    { 
      title: "Total de Alunos", 
      value: "586", 
      change: "+5%", 
      icon: <UserRound className="h-6 w-6 text-white" />,
      bgColor: "bg-blue-500 dark:bg-blue-600"
    },
    { 
      title: "Total de Professores", 
      value: "47", 
      change: "+3%", 
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      bgColor: "bg-secondary-500 dark:bg-secondary-500"
    },
    { 
      title: "Total de Turmas", 
      value: "24", 
      change: "+2%", 
      icon: <Users className="h-6 w-6 text-white" />,
      bgColor: "bg-green-500 dark:bg-green-600"
    },
    { 
      title: "Média Geral", 
      value: "7.8", 
      change: "+4%", 
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      bgColor: "bg-purple-500 dark:bg-purple-600"
    }
  ];
  
  const events = [
    { color: "bg-blue-500", title: "Reunião de Pais", date: "15 de Julho, 19:00" },
    { color: "bg-green-500", title: "Conselho de Classe", date: "20 de Julho, 14:00" },
    { color: "bg-purple-500", title: "Feira de Ciências", date: "25 de Julho, 09:00" },
    { color: "bg-secondary-500", title: "Olimpíada de Matemática", date: "01 de Agosto, 10:00" }
  ];
  
  const recentStudents = [
    { 
      name: "Lucas Oliveira", 
      class: "9º Ano - Turma A", 
      image: "https://images.unsplash.com/photo-1543269664-56d93c1b41a6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
    },
    { 
      name: "Mariana Santos", 
      class: "7º Ano - Turma C", 
      image: "https://images.unsplash.com/photo-1517256673644-36ad11246d21?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
    },
    { 
      name: "Pedro Almeida", 
      class: "2º Ano - Ensino Médio", 
      image: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100" 
    },
    { 
      name: "Ana Ferreira", 
      class: "1º Ano - Ensino Médio", 
      image: "" 
    }
  ];
  
  const recentActivity = [
    { 
      name: "Marcos Silva", 
      action: "Lançou notas de Matemática para a turma 9º Ano B", 
      time: "Há 15 minutos" 
    },
    { 
      name: "Carla Mendes", 
      action: "Adicionou uma anotação ao diário de classe de Ciências", 
      time: "Há 45 minutos" 
    },
    { 
      name: "Renata Souza", 
      action: "Publicou um novo recado para a turma 8º Ano A", 
      time: "Há 2 horas" 
    },
    { 
      name: "Roberto Lima", 
      action: "Registrou presença para a turma 3º Ano Ensino Médio", 
      time: "Há 3 horas" 
    },
    { 
      name: "Sistema", 
      action: "Backup automático do banco de dados concluído", 
      time: "Há 4 horas" 
    }
  ];
  
  return (
    <div className="fade-in">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate">
            Bem-vindo, Admin!
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visão geral do sistema escolar - {currentDate}
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
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M3.707 5.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L8 7.586V2a1 1 0 10-2 0v5.586L3.707 5.293z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                        <span className="sr-only">Aumento de</span>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Desempenho por Turma</h3>
            <div className="h-80">
              <PerformanceChart />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Distribuição de Notas</h3>
            <div className="h-80">
              <GradeDistributionChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity, Events, and Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Próximos Eventos</h3>
            <button 
              onClick={() => navigate('/calendar')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver mais <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[400px] space-y-5">
            {events.map((event, index) => (
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
        
        {/* Recent Students */}
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Alunos Recentes</h3>
            <button 
              onClick={() => navigate('/students')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[400px] space-y-4">
            {recentStudents.map((student, index) => (
              <div key={index} className="flex items-center">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={student.image} alt={`Foto de ${student.name}`} className="profile-img" />
                  <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
                    {getUserInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{student.class}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Recent Activity */}
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Atividade Recente</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[400px] divide-y divide-gray-200 dark:divide-dark-500">
            {recentActivity.map((activity, index) => (
              <div key={index} className="py-3">
                <div className="flex items-start">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.action}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
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
