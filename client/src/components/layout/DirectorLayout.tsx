import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import DirectorInstructionModal from '@/components/instructions/DirectorInstructionModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Users,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  User,
  GraduationCap,
  Building,
  FileText,
  Lightbulb,
  Code,
  ArrowRight,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface DirectorLayoutProps {
  children: React.ReactNode;
}

const DirectorLayout: React.FC<DirectorLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/director/dashboard', icon: BarChart3 },
    { name: 'Períodos', href: '/director/periods', icon: TrendingUp },
    { name: 'Matrículas', href: '/director/enrollments', icon: GraduationCap },
    { name: 'Aprovações', href: '/director/approvals', icon: FileText },
    { name: 'Usuários', href: '/director/users', icon: Users },
    { name: 'Comunicados', href: '/director/announcements', icon: MessageSquare },
    { name: 'Chat', href: '/director/chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col director-sidebar shadow-xl overflow-y-auto max-h-screen">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Home className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">Sistema Escolar</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'active text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Abrir menu</span>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl || ''} />
            <AvatarFallback className="bg-gray-100 text-gray-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{user?.firstName}</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col director-sidebar">
        <div className="flex flex-col flex-grow">
          <div className="flex h-16 items-center px-4">
            <Home className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">Sistema Escolar</span>
          </div>
          
          {/* User Profile */}
          <div className="px-4 py-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profileImageUrl || ''} />
                <AvatarFallback className="bg-gray-600 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-300 truncate">{user?.role}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="ml-2 text-xs text-gray-300">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-2">
            {/* Seção PRINCIPAL */}
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                PRINCIPAL
              </div>
              <Link
                href="/director/dashboard"
                className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === '/director/dashboard'
                    ? 'active text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </div>

            {/* Seção ACADÊMICO */}
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                ACADÊMICO
              </div>
              <Link
                href="/director/periods"
                className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === '/director/periods'
                    ? 'active text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <TrendingUp className="mr-3 h-5 w-5" />
                Períodos
              </Link>
              <Link
                href="/director/approvals"
                className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === '/director/approvals'
                    ? 'active text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <FileText className="mr-3 h-5 w-5" />
                Aprovações
              </Link>
              <Link
                href="/director/users"
                className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === '/director/users'
                    ? 'active text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Usuários
              </Link>
            </div>

            {/* Seção COMUNICAÇÃO */}
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                COMUNICAÇÃO
              </div>
              <Link
                href="/director/announcements"
                className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === '/director/announcements'
                    ? 'active text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Comunicados
              </Link>
              <Link
                href="/director/chat"
                className={`nav-item flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location === '/director/chat'
                    ? 'active text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <MessageSquare className="mr-3 h-5 w-5" />
                Chat
              </Link>
            </div>
          </nav>
          
          {/* Bottom section */}
          <div className="px-4 py-4 border-t border-gray-700">
            <Link
              href="/meu-perfil"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <User className="mr-3 h-5 w-5" />
              Meu Perfil
            </Link>
            <button
              onClick={() => setShowInstructions(true)}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <Lightbulb className="mr-3 h-5 w-5" />
              Instruções
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Instructions Modal - abre sobre qualquer página do Diretor */}
      <DirectorInstructionModal 
        isOpen={showInstructions} 
        onClose={() => setShowInstructions(false)} 
      />
    </div>
  );
};

export default DirectorLayout;
