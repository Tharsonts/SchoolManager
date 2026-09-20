import { useLocation } from "wouter";
import { BookOpen, Calendar, ChevronRight, GraduationCap, UserRound, TrendingUp, Award, Clock, Target, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { ClassPerformanceChart } from "../charts/ClassPerformanceChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      bgColor: "stats-card",
      trend: "up"
    },
    { 
      title: "Presença", 
      value: "96%", 
      change: "+2%",
      icon: <UserRound className="h-6 w-6 text-white" />,
      bgColor: "stats-card",
      trend: "up"
    },
    { 
      title: "Disciplinas", 
      value: "8", 
      change: "0%",
      icon: <BookOpen className="h-6 w-6 text-white" />,
      bgColor: "stats-card",
      trend: "stable"
    },
    { 
      title: "Próximos Eventos", 
      value: "3", 
      change: "+1",
      icon: <Calendar className="h-6 w-6 text-white" />,
      bgColor: "stats-card",
      trend: "up"
    }
  ];
  
  const upcomingDeadlines = [
    { 
      title: "Trabalho de História", 
      description: "Revolução Industrial", 
      date: "18 de Julho, 2023", 
      daysLeft: "3 dias restantes",
      status: "urgent",
      priority: "Alta"
    },
    { 
      title: "Exercícios de Matemática", 
      description: "Equações do 2º Grau", 
      date: "20 de Julho, 2023", 
      daysLeft: "5 dias restantes",
      status: "warning",
      priority: "Média"
    },
    { 
      title: "Projeto de Ciências", 
      description: "Sistemas Solares", 
      date: "25 de Julho, 2023", 
      daysLeft: "10 dias restantes",
      status: "normal",
      priority: "Baixa"
    }
  ];
  
  const announcements = [
    { 
      author: "Prof. Silva", 
      message: "Lembrem-se de trazer o material para o laboratório amanhã.", 
      time: "Há 2 horas",
      avatar: "S",
      type: "reminder"
    },
    { 
      author: "Coordenação", 
      message: "Reunião de pais marcada para o dia 15/07 às 19h.", 
      time: "Ontem",
      avatar: "C",
      type: "announcement"
    },
    { 
      author: "Prof. Carla", 
      message: "As notas do trabalho de Literatura já estão disponíveis.", 
      time: "3 dias atrás",
      avatar: "C",
      type: "grade"
    }
  ];
  
  const upcomingEvents = [
    { color: "bg-blue-500", title: "Prova de Matemática", date: "18 de Julho, 8:00", type: "exam" },
    { color: "bg-green-500", title: "Entrega de Trabalho", date: "20 de Julho, 14:00", type: "assignment" },
    { color: "bg-purple-500", title: "Feira de Ciências", date: "25 de Julho, 9:00", type: "event" }
  ];

  const achievements = [
    { title: "Primeiro Lugar", description: "Olimpíada de Matemática", icon: <Award className="h-5 w-5" />, color: "text-yellow-500" },
    { title: "100% Presença", description: "Mês de Junho", icon: <Target className="h-5 w-5" />, color: "text-green-500" },
    { title: "Nota Perfeita", description: "História - 10.0", icon: <Zap className="h-5 w-5" />, color: "text-blue-500" }
  ];
  
  return (
    <div className="fade-in space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">
                Bem-vindo, {user?.firstName || 'Aluno'}! 👋
              </h2>
              <p className="mt-2 text-blue-100">
                Visão geral do seu desempenho - {currentDate}
              </p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Seu desempenho está melhorando!</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className={`${stat.bgColor} dashboard-card card-hover`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-200' : 
                        stat.trend === 'down' ? 'text-red-200' : 'text-white/70'
                      }`}>
                        {stat.change}
                      </span>
                      <TrendingUp className={`h-4 w-4 ml-1 ${
                        stat.trend === 'up' ? 'text-green-200' : 
                        stat.trend === 'down' ? 'text-red-200 rotate-180' : 'text-white/50'
                      }`} />
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <div className="lg:col-span-2">
            <Card className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Desempenho por Disciplina
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    Último Bimestre
                  </Badge>
                </div>
                <div className="h-80">
                  <ClassPerformanceChart />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <Card className="dashboard-card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Próximas Entregas
                </h3>
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {deadline.title}
                        </h4>
                        <Badge 
                          variant={deadline.status === 'urgent' ? 'destructive' : 
                                  deadline.status === 'warning' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {deadline.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {deadline.description}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-1" />
                        {deadline.date}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      deadline.status === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      deadline.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {deadline.daysLeft}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Announcements */}
          <Card className="dashboard-card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recados
                </h3>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/notifications')} 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {announcements.map((announcement, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs font-medium ${
                      announcement.type === 'reminder' ? 'bg-blue-100 text-blue-600' :
                      announcement.type === 'announcement' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {announcement.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {announcement.author}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {announcement.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {announcement.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          {/* Attendance Record */}
          <Card className="dashboard-card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Registro de Presença
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <svg viewBox="0 0 36 36" className="h-32 w-32">
                    <path 
                      className="stroke-current text-gray-200 dark:text-gray-700" 
                      fill="none" 
                      strokeWidth="3" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                    <path 
                      className="stroke-current text-green-500" 
                      fill="none" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeDasharray="96, 100" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    />
                    <text x="18" y="20.5" className="text-3xl font-bold fill-current text-gray-700 dark:text-gray-300" textAnchor="middle">
                      96%
                    </text>
                  </svg>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total de aulas: <span className="font-semibold">125</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Presença: <span className="font-semibold text-green-600">120</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Faltas: <span className="font-semibold text-red-600">5</span>
                </p>
              </div>
            </div>
          </Card>
          
          {/* Upcoming Events */}
          <Card className="dashboard-card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Próximos Eventos
                </h3>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/calendar')} 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {upcomingEvents.map((event, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className={`${event.color} h-3 w-3 rounded-full mt-2 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.date}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {event.type === 'exam' ? 'Prova' : 
                       event.type === 'assignment' ? 'Trabalho' : 'Evento'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Achievements Section */}
        <Card className="dashboard-card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conquistas Recentes 🏆
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-600 shadow-sm ${achievement.color}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {achievement.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
}
