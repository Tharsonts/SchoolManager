import { useLocation } from "wouter";
import { BarChart3, BookOpen, Calendar, ChevronRight, Flag, GraduationCap, Users, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PerformanceChart } from "../charts/PerformanceChart";
import { AttendanceChart } from "../charts/AttendanceChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function CoordinatorDashboard() {
  const [, navigate] = useLocation();
  const currentDate = formatDate(new Date());
  const { user } = useAuth();
  
  // In a real app, this data would come from the API
  const stats = [
    { 
      title: "Total de Alunos", 
      value: "320", 
      change: "+2%", 
      icon: <UserRound className="h-6 w-6 text-white" />,
      bgColor: "bg-blue-500 dark:bg-blue-600"
    },
    { 
      title: "Total de Professores", 
      value: "18", 
      icon: <GraduationCap className="h-6 w-6 text-white" />,
      bgColor: "bg-secondary-500 dark:bg-secondary-500"
    },
    { 
      title: "Total de Turmas", 
      value: "12", 
      icon: <Users className="h-6 w-6 text-white" />,
      bgColor: "bg-green-500 dark:bg-green-600"
    },
    { 
      title: "Média Geral", 
      value: "7.6", 
      change: "+1%", 
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      bgColor: "bg-purple-500 dark:bg-purple-600"
    }
  ];
  
  const classesPerformance = [
    { name: "9º Ano A", students: 32, average: "8.2", attendance: "92%", status: "Excelente", statusColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    { name: "9º Ano B", students: 30, average: "7.5", attendance: "88%", status: "Bom", statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    { name: "8º Ano A", students: 28, average: "7.8", attendance: "90%", status: "Bom", statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    { name: "8º Ano B", students: 31, average: "7.2", attendance: "86%", status: "Bom", statusColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    { name: "8º Ano C", students: 29, average: "6.4", attendance: "78%", status: "Atenção", statusColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" }
  ];
  
  const events = [
    { color: "bg-blue-500", title: "Reunião de Pais", date: "15 de Julho, 19:00" },
    { color: "bg-green-500", title: "Conselho de Classe", date: "20 de Julho, 14:00" },
    { color: "bg-purple-500", title: "Feira de Ciências", date: "25 de Julho, 09:00" }
  ];
  
  const alertsAndIssues = [
    { title: "Baixo desempenho", description: "5 alunos com média abaixo de 5,0 no 8º Ano C", priority: "Alta", icon: <Flag className="h-5 w-5 text-red-500" /> },
    { title: "Frequência", description: "3 alunos com frequência abaixo de 75% no 7º Ano B", priority: "Média", icon: <Calendar className="h-5 w-5 text-yellow-500" /> },
    { title: "Material didático", description: "Solicitação de novos livros para 9º Ano", priority: "Baixa", icon: <BookOpen className="h-5 w-5 text-green-500" /> }
  ];
  
  return (
    <div className="fade-in">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate">
            Bem-vindo, {user?.firstName || 'Coordenador'}!
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visão geral da coordenação - {currentDate}
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
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Frequência por Série</h3>
            <div className="h-80">
              <AttendanceChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Performance */}
      <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Desempenho por Turma</h3>
          <button 
            onClick={() => navigate('/reports')} 
            className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
          >
            Ver relatórios <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Turma
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Quantidade de Alunos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Média Geral
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Frequência
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {classesPerformance.map((cls, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {cls.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{cls.students}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{cls.average}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{cls.attendance}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cls.statusColor}`}>
                      {cls.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/classes/${index}`);
                      }}
                      className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Detalhes
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Events and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500 flex justify-between items-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Próximos Eventos</h3>
            <button 
              onClick={() => navigate('/calendar')} 
              className="text-primary-500 dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm flex items-center"
            >
              Ver calendário <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] space-y-5">
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
        
        <Card className="bg-white dark:bg-dark-600 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-500">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Alertas e Pendências</h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[300px] divide-y divide-gray-200 dark:divide-dark-500">
            {alertsAndIssues.map((alert, index) => (
              <div key={index} className="py-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {alert.icon}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{alert.description}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Prioridade: <span className="font-medium">{alert.priority}</span>
                    </p>
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
