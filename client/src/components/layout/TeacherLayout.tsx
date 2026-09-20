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
  ClipboardList,
  Library,
  Calendar,
  Users,
  Brain,
  Sparkles,
  CheckSquare,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import TeacherInstructionModal from '@/components/instructions/TeacherInstructionModal';
import { useQuery } from '@tanstack/react-query';

interface TeacherLayoutProps {
  children: React.ReactNode;
  immersive?: boolean;
}

function TeacherLayout({ children, immersive = false }: TeacherLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['header-notifications', user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async () => {
      const response = await fetch('/api/messages/conversations', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    },
  });
  const unreadMessages = conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0);

  const navigation = [
    {
      title: 'PRINCIPAL',
      items: [
        { icon: GraduationCap, label: 'Dashboard', path: '/teacher/dashboard' }
      ]
    },
    {
      title: 'ACADÊMICO',
      items: [
        { icon: BookOpen, label: 'Minhas Turmas', path: '/teacher/classes' },
        { icon: Library, label: 'Materiais', path: '/teacher/materials' },
        { icon: FileText, label: 'Relatórios', path: '/reports' }
      ]
    },
    {
      title: 'AVALIAÇÕES',
      items: [
        { icon: FileText, label: 'Atividades', path: '/teacher/activities' },
        { icon: ClipboardList, label: 'Provas', path: '/teacher/exams' },
        { icon: CheckSquare, label: 'Frequência', path: '/teacher/attendance' }
      ]
    },
    {
      title: 'COMUNICAÇÃO',
      items: [
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
        { icon: Calendar, label: 'Calendário', path: '/teacher/calendar' }
      ]
    },
    {
      title: 'FERRAMENTAS',
      items: [
        { icon: Brain, label: 'Assistente', path: '/teacher/ai-assistant', special: true }
      ]
    }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setMobileOpen(!mobileOpen)}>
          <span className="sr-only">Abrir menu</span>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{user?.firstName}</span>
        </div>
      </div>
      {/* Sidebar (desktop) */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-lg md:block md:overflow-y-auto md:max-h-screen">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-blue-700">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">Sistema Escolar</span>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-blue-700 p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-white text-blue-800">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-blue-200">Professor</p>
              </div>
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6">
            {navigation.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="px-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 border-b border-blue-600/30 pb-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const isActive = location === item.path;
                    const isSpecial = (item as any).special;
                    
                    if (isSpecial) {
                      return (
                        <Button
                          key={itemIndex}
                          variant="ghost"
                          className={`w-full justify-start text-left h-10 px-3 ${
                            isActive
                              ? 'bg-blue-800 text-white'
                              : 'bg-blue-700 text-gray-200 hover:bg-blue-800 hover:text-white'
                          }`}
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          <span className="font-semibold">{item.label}</span>
                        </Button>
                      );
                    }
                    
                    return (
                      <Button
                        key={itemIndex}
                        variant="ghost"
                        className={`w-full justify-start text-left h-10 px-3 ${
                          isActive
                            ? 'bg-blue-700 text-white'
                            : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                        }`}
                        onClick={() => navigate(item.path)}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-blue-700 p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-blue-100 hover:bg-blue-600 hover:text-white"
              onClick={() => navigate('/meu-perfil')}
            >
              <User className="mr-3 h-4 w-4" />
              Meu Perfil
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-blue-100 hover:bg-blue-600 hover:text-white"
              onClick={() => setShowInstructions(true)}
            >
              <Lightbulb className="mr-3 h-4 w-4" />
              Instruções
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-300 hover:bg-red-600 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-blue-900 to-blue-800 shadow-lg overflow-y-auto max-h-screen">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-center border-b border-blue-700">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-white" />
                <span className="text-xl font-bold text-white">Sistema Escolar</span>
              </div>
            </div>
            <div className="border-b border-blue-700 p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-white text-blue-800">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-blue-200">Professor</p>
                </div>
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-6">
              {navigation.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <h3 className="px-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 border-b border-blue-600/30 pb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const isActive = location === item.path;
                      const isSpecial = (item as any).special;
                      const handleClick = () => { navigate(item.path); setMobileOpen(false); };
                      if (isSpecial) {
                        return (
                          <Button
                            key={itemIndex}
                            variant="ghost"
                            className={`w-full justify-start text-left h-10 px-3 ${
                              isActive
                                ? 'bg-blue-800 text-white'
                                : 'bg-blue-700 text-gray-200 hover:bg-blue-800 hover:text-white'
                            }`}
                            onClick={handleClick}
                          >
                            <item.icon className="mr-3 h-4 w-4" />
                            <span className="font-semibold">{item.label}</span>
                          </Button>
                        );
                      }
                      return (
                        <Button
                          key={itemIndex}
                          variant="ghost"
                          className={`w-full justify-start text-left h-10 px-3 ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-100 hover:bg-blue-600 hover:text-white'
                          }`}
                          onClick={handleClick}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-blue-700 p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-blue-100 hover:bg-blue-600 hover:text-white"
                onClick={() => { navigate('/meu-perfil'); setMobileOpen(false); }}
              >
                <User className="mr-3 h-4 w-4" />
                Meu Perfil
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-blue-100 hover:bg-blue-600 hover:text-white"
                onClick={() => setShowInstructions(true)}
              >
                <Lightbulb className="mr-3 h-4 w-4" />
                Instruções
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-300 hover:bg-red-600 hover:text-white"
                onClick={() => { handleLogout(); setMobileOpen(false); }}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64">
        {/* Header */}
        {!immersive && <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {(() => {
                    // Buscar o item ativo em todas as seções
                    for (const section of navigation) {
                      const activeItem = section.items.find(item => item.path === location);
                      if (activeItem) {
                        return activeItem.label;
                      }
                    }
                    return 'Dashboard';
                  })()}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="relative" onClick={() => setShowNotifications((open) => !open)} aria-label="Abrir notificações">
                  <Bell className="h-5 w-5" />
                  {unreadMessages > 0 && <Badge className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full px-1 flex items-center justify-center text-xs">{unreadMessages > 99 ? '99+' : unreadMessages}</Badge>}
                </Button>
                {showNotifications && <div className="absolute right-6 top-16 z-50 w-80 rounded-lg border bg-white p-4 shadow-xl">
                  <p className="font-semibold text-gray-900">Notificações</p>
                  <p className="mt-1 text-sm text-gray-600">{unreadMessages > 0 ? `${unreadMessages} mensagem(ns) ainda não lida(s).` : 'Nenhuma mensagem nova no momento.'}</p>
                  <div className="mt-3 grid gap-2">
                    <Button variant="outline" size="sm" onClick={() => { navigate('/chat'); setShowNotifications(false); }}><MessageSquare className="mr-2 h-4 w-4" />Abrir mensagens</Button>
                    <Button variant="outline" size="sm" onClick={() => { navigate('/teacher/calendar'); setShowNotifications(false); }}><Calendar className="mr-2 h-4 w-4" />Ver calendário e prazos</Button>
                  </div>
                </div>}
              </div>
            </div>
          </div>
        </header>}

        {/* Page Content */}
        <main className={immersive ? "h-screen overflow-hidden p-0" : "p-6"}>
          {children}
        </main>
      </div>

      {/* Instructions Modal */}
      <TeacherInstructionModal 
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
}

export default TeacherLayout;
