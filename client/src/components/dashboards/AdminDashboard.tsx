
import { useDashboardStats, useUsers, useClasses, useSubjects, User, Class, Subject } from "../../hooks/useApi";
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  UserPlus, 
  Plus,
  Search,
  Filter
} from "lucide-react";
import CurrentPeriodCard from "../CurrentPeriodCard";

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'coordinator': return 'bg-green-500';
      case 'teacher': return 'bg-blue-500';
      case 'student': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'coordinator': return 'Coordenador';
      case 'teacher': return 'Professor';
      case 'student': return 'Aluno';
      default: return role;
    }
  };

  return (
      <div className="p-6 space-y-6">
        {/* Current Period Card */}
        <CurrentPeriodCard />
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600">Gerencie usuários, turmas e disciplinas</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-modern bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
            <button className="btn-modern bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4" />
              Nova Turma
            </button>
            <button 
              onClick={() => {
                alert('🔐 COORDENADOR\n\n📧 Email: coord@escola.com\n🔑 Senha: 123456\n\n⚠️ Use essas credenciais para fazer login como coordenador pedagógico');
              }}
              className="btn-modern bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Users className="w-4 h-4" />
              Coordenador
            </button>
            <a 
              href="/coordinator/dashboard"
              className="btn-modern bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Users className="w-4 h-4" />
              Coordenação Pedagógica
            </a>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalUsers || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% este mês</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Turmas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalClasses || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+5% este mês</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Disciplinas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalSubjects || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+8% este mês</span>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sistema Ativo</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <div className="w-6 h-6 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="dashboard-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Usuários Recentes</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  className="input-modern pl-10"
                />
              </div>
              <button className="btn-modern bg-gray-100 hover:bg-gray-200 text-gray-700">
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-8">
              <div className="loading-dots"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                                     {users?.slice(0, 5).map((user: User) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.registrationNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Classes and Subjects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes */}
          <div className="dashboard-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Turmas Ativas</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Ver todas
              </button>
            </div>

            {classesLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-dots"></div>
              </div>
            ) : (
              <div className="space-y-4">
                                 {classes?.slice(0, 3).map((classItem: Class) => (
                  <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{classItem.name}</h3>
                      <p className="text-sm text-gray-600">{classItem.grade} - {classItem.section}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {classItem.currentStudents}/{classItem.capacity}
                      </p>
                      <p className="text-xs text-gray-500">alunos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subjects */}
          <div className="dashboard-card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Disciplinas</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Ver todas
              </button>
            </div>

            {subjectsLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-dots"></div>
              </div>
            ) : (
              <div className="space-y-4">
                                 {subjects?.slice(0, 3).map((subject: Subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600">{subject.code} - {subject.credits} créditos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{subject.workload}h</p>
                      <p className="text-xs text-gray-500">carga horária</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <div className="text-center">
                <UserPlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-700">Adicionar Usuário</p>
                <p className="text-sm text-gray-500">Criar novo usuário</p>
              </div>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <GraduationCap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-700">Criar Turma</p>
                <p className="text-sm text-gray-500">Nova turma</p>
              </div>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <div className="text-center">
                <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-700">Adicionar Disciplina</p>
                <p className="text-sm text-gray-500">Nova disciplina</p>
              </div>
            </button>
          </div>
        </div>
      </div>
  );
}