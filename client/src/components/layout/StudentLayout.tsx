import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  GraduationCap, 
  User, 
  BookOpen, 
  FileText, 
  MessageSquare,
  LogOut,
  Bell,
  BarChart3,
  School,
  Calendar,
  Library,
  ClipboardList,
  CheckSquare,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import StudentInstructionModal from '@/components/instructions/StudentInstructionModal';

interface StudentLayoutProps {
  children: React.ReactNode;
}

function StudentLayout({ children }: StudentLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    {
      title: 'PRINCIPAL',
      items: [
        {
          name: 'Dashboard',
          href: '/student/dashboard',
          icon: GraduationCap,
          current: location === '/student/dashboard'
        }
      ]
    },
    {
      title: 'ACADÊMICO',
      items: [
        {
          name: 'Turma',
          href: '/student/class',
          icon: School,
          current: location === '/student/class'
        },
        {
          name: 'Boletim',
          href: '/student/report-card',
          icon: BookOpen,
          current: location === '/student/report-card'
        },
        {
          name: 'Materiais',
          href: '/student/materials',
          icon: Library,
          current: location === '/student/materials'
        }
      ]
    },
    {
      title: 'ATIVIDADES',
      items: [
        {
          name: 'Minhas Atividades',
          href: '/student/activities',
          icon: FileText,
          current: location === '/student/activities'
        },
        {
          name: 'Provas',
          href: '/student/exams',
          icon: ClipboardList,
          current: location === '/student/exams'
        },
        {
          name: 'Frequência',
          href: '/student/attendance',
          icon: CheckSquare,
          current: location === '/student/attendance'
        }
      ]
    },
    {
      title: 'COMUNICAÇÃO',
      items: [
        {
          name: 'Chat',
          href: '/student/chat',
          icon: MessageSquare,
          current: location === '/student/chat'
        },
        {
          name: 'Calendário',
          href: '/student/calendar',
          icon: Calendar,
          current: location === '/student/calendar'
        }
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-green-900 to-green-800 shadow-lg hidden md:block">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-green-700 px-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">SchoolManager</h1>
                <p className="text-xs text-green-200">Sistema Escolar</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="border-b border-green-700 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-green-100 text-green-700">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Aluno
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 p-4">
            {navigation.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.title && (
                  <h3 className="px-2 text-xs font-semibold text-green-300 uppercase tracking-wider mb-3 border-b border-green-600/30 pb-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.href)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          item.current
                            ? 'bg-green-700 text-white border-r-2 border-green-500'
                            : 'text-green-100 hover:bg-green-700 hover:text-white'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-green-700 p-4 space-y-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/meu-perfil')}
              className="w-full justify-start text-green-100 hover:text-white hover:bg-green-700"
            >
              <User className="mr-3 h-4 w-4" />
              Meu Perfil
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowInstructions(true)}
              className="w-full justify-start text-green-100 hover:text-white hover:bg-green-700"
            >
              <Lightbulb className="mr-3 h-4 w-4" />
              Instruções
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-300 hover:text-red-100 hover:bg-red-600"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className="sr-only">Abrir menu</span>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-green-100 text-green-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{user?.firstName}</span>
        </div>
      </div>

      {/* Mobile menu panel (slides, não cobre a tela inteira) */}
      <div className={`md:hidden fixed left-2 top-14 z-50 w-64 max-w-[80%] rounded-lg shadow-lg bg-gradient-to-b from-green-900 to-green-800 transition-all duration-200 ${mobileOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-[110%] pointer-events-none'}`}>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback className="bg-green-100 text-green-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-white font-medium">{user?.firstName} {user?.lastName}</p>
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Aluno</Badge>
            </div>
          </div>
          <div className="space-y-1">
            {navigation.flatMap(s => s.items).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => { setMobileOpen(false); navigate(item.href); }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${item.current ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-700 hover:text-white'}`}
                >
                  <Icon className="mr-3 h-5 w-5" />{item.name}
                </button>
              );
            })}
            <div className="h-px bg-green-700 my-2" />
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-green-100 hover:bg-green-700 hover:text-white" onClick={() => { setMobileOpen(false); navigate('/meu-perfil'); }}>
              <User className="mr-3 h-4 w-4" /> Meu Perfil
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-green-100 hover:bg-green-700 hover:text-white" onClick={() => { setMobileOpen(false); setShowInstructions(true); }}>
              <Lightbulb className="mr-3 h-4 w-4" /> Instruções
            </button>
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-200 hover:bg-red-600" onClick={handleLogout}>
              <LogOut className="mr-3 h-4 w-4" /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Instructions Modal */}
      <StudentInstructionModal 
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
}

export default StudentLayout;


