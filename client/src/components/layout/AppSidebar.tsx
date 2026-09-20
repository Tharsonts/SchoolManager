import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Home, 
  Users, 
  GraduationCap, 
  BookOpen, 
  School, 
  BarChart3, 
  UserCheck, 
  FileText, 
  ClipboardList, 
  Calendar, 
  MessageSquare, 
  Settings, 
  User,
  LogOut,
  Lightbulb,
  Library,
  X
} from "lucide-react";
import { getUserInitials } from "@/lib/utils";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onInstructionsClick: () => void;
}

export function AppSidebar({ isOpen, onClose, onInstructionsClick }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const isCoordinator = user?.role === 'coordinator';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    // Para rotas específicas, verificar se a localização atual começa com o path
    if (path === '/teacher/activities') {
      return location.startsWith('/teacher/activities') || location.includes('/teacher/activities/');
    }
    if (path === '/teacher/materials') {
      return location.startsWith('/teacher/materials') || location.includes('/teacher/materials/');
    }
    if (path === '/teacher/subjects') {
      return location.startsWith('/teacher/subjects') || location.includes('/teacher/subjects/');
    }
    if (path === '/coordinator/activities') {
      return location.startsWith('/coordinator/activities') || location.includes('/coordinator/activities/');
    }
    if (path === '/coordinator/reports') {
      return location.startsWith('/coordinator/reports') || location.includes('/coordinator/reports/');
    }
    if (path === '/coordinator/academic-calendar') {
      return location.startsWith('/coordinator/academic-calendar') || location.includes('/coordinator/academic-calendar/');
    }
    if (path === '/coordinator/teachers') {
      return location.startsWith('/coordinator/teachers') || location.includes('/coordinator/teachers/');
    }
    if (path === '/coordinator/classes') {
      return location.startsWith('/coordinator/classes') || location.includes('/coordinator/classes/');
    }
    if (path === '/coordinator/students') {
      return location.startsWith('/coordinator/students') || location.includes('/coordinator/students/');
    }
    if (path === '/coordinator/performance') {
      return location.startsWith('/coordinator/performance') || location.includes('/coordinator/performance/');
    }
    if (path === '/student/activities') {
      return location.startsWith('/student/activities') || location.includes('/student/activities/');
    }
    if (path === '/student/submissions') {
      return location.startsWith('/student/submissions') || location.includes('/student/submissions/');
    }
    if (path === '/student/materials') {
      return location.startsWith('/student/materials') || location.includes('/student/materials/');
    }
    if (path === '/student/subjects') {
      return location.startsWith('/student/subjects') || location.includes('/student/subjects/');
    }
    // Para outras rotas, usar comparação exata
    return location === path;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Professor';
      case 'coordinator': return 'Coordenador';
      case 'student': return 'Aluno';
      default: return 'Usuário';
    }
  };

  const getNavigation = () => {
    const baseItems = [
      {
        title: 'PRINCIPAL',
        items: [
          { icon: BarChart3, label: 'Dashboard', path: '/dashboard' }
        ]
      }
    ];

    if (user?.role === 'admin') {
      baseItems.push(
        {
          title: 'GESTÃO DE PESSOAS',
          items: [
            { icon: Users, label: 'Usuários', path: '/users' },
            { icon: UserCheck, label: 'Professores', path: '/teachers' },
            { icon: Users, label: 'Alunos', path: '/students' }
          ]
        },
        {
          title: 'ACADÊMICO',
          items: [
            { icon: BookOpen, label: 'Disciplinas', path: '/subjects' },
            { icon: School, label: 'Turmas', path: '/classes' }
          ]
        }
      );
    }

    if (user?.role === 'teacher') {
      baseItems.push(
        {
          title: 'ACADÊMICO',
          items: [
            { icon: BookOpen, label: 'Minhas Disciplinas', path: '/teacher/subjects' },
            { icon: School, label: 'Minhas Turmas', path: '/my-classes' },
            { icon: Library, label: 'Materiais', path: '/teacher/materials' }
          ]
        },
        {
          title: 'ATIVIDADES',
          items: [
            { icon: ClipboardList, label: 'Criar Atividade', path: '/teacher/activities/create' },
            { icon: FileText, label: 'Minhas Atividades', path: '/teacher/activities' }
          ]
        }
      );
    }

    if (user?.role === 'coordinator') {
      baseItems.push(
        {
          title: 'MONITORAMENTO',
          items: [
            { icon: Users, label: 'Professores', path: '/coordinator/teachers' },
            { icon: GraduationCap, label: 'Turmas', path: '/coordinator/classes' },
            { icon: UserCheck, label: 'Alunos', path: '/coordinator/students' },
            { icon: BookOpen, label: 'Atividades', path: '/coordinator/activities' },
            { icon: BarChart3, label: 'Performance', path: '/coordinator/performance' }
          ]
        }
      );
    }

    if (user?.role === 'student') {
      baseItems.push(
        {
          title: 'ACADÊMICO',
          items: [
            { icon: BookOpen, label: 'Minhas Disciplinas', path: '/student/subjects' },
            { icon: School, label: 'Turma', path: '/student/class' },
            { icon: Library, label: 'Materiais', path: '/student/materials' }
          ]
        },
        {
          title: 'ATIVIDADES',
          items: [
            { icon: ClipboardList, label: 'Minhas Atividades', path: '/student/activities' },
            { icon: FileText, label: 'Entregas', path: '/student/submissions' }
          ]
        }
      );
    }

    // Itens comuns para todos
    if (user?.role !== 'coordinator') {
      baseItems.push(
        {
          title: 'COMUNICAÇÃO',
          items: [
            { icon: MessageSquare, label: 'Chat', path: '/chat' }
          ]
        }
      );
    } else {
      // Para coordenador, comunicação com calendário
      baseItems.push(
        {
          title: 'COMUNICAÇÃO',
          items: [
            { icon: MessageSquare, label: 'Chat', path: '/coordinator/chat' },
            { icon: Calendar, label: 'Calendário', path: '/coordinator/academic-calendar' }
          ]
        }
      );
    }

    return baseItems;
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 ${isCoordinator ? 'bg-gradient-to-b from-red-900 to-red-800' : 'bg-slate-900'} transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isCoordinator ? 'border-red-700' : 'border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-6 w-6 text-blue-400" />
                <span className="text-white font-bold text-lg">Sistema Escolar</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`lg:hidden text-white ${isCoordinator ? 'hover:bg-red-700' : 'hover:bg-slate-700'}`}
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* User Profile */}
          <div className={`px-6 py-4 border-b ${isCoordinator ? 'border-red-700' : 'border-slate-700'}`}>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getUserInitials(user?.firstName + ' ' + user?.lastName || 'A')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-white font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-slate-300 text-sm">{getRoleLabel(user?.role || '')}</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6">
            {navigation.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className={`px-2 text-xs font-semibold uppercase tracking-wider mb-3 pb-2 ${
                    isCoordinator ? 'text-white border-b border-red-700/50' : 'text-slate-400 border-b border-slate-600/30'
                  }`}>
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items ? section.items.map((item, itemIndex) => (
                    <Link key={itemIndex} href={item.path}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start text-left h-10 px-3 ${
                          isActive(item.path)
                            ? `${isCoordinator ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`
                            : `${isCoordinator ? 'text-white hover:bg-red-700 hover:text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`
                        }`}
                      >
                        <item.icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  )) : (section.path ? (
                    <Link href={section.path}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start text-left h-10 px-3 ${
                          isActive(section.path)
                            ? `${isCoordinator ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'}`
                            : `${isCoordinator ? 'text-white hover:bg-red-700 hover:text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`
                        }`}
                      >
                        <section.icon className="h-4 w-4 mr-3" />
                        {section.label}
                      </Button>
                    </Link>
                  ) : null)}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className={`mt-auto px-4 py-4 border-t ${isCoordinator ? 'border-red-700' : 'border-slate-700'} space-y-2`}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-left ${isCoordinator ? 'text-white hover:bg-red-700 hover:text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              onClick={() => {
                window.location.href = '/meu-perfil';
              }}
            >
              <User className="h-4 w-4 mr-3" />
              Meu Perfil
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start text-left ${isCoordinator ? 'text-white hover:bg-red-700 hover:text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              onClick={onInstructionsClick}
            >
              <Lightbulb className="h-4 w-4 mr-3" />
              Instruções
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start text-left ${isCoordinator ? 'text-white hover:bg-red-700 hover:text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}