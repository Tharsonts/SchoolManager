import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  MessageSquare,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
  pageTitle: string;
}

export function Header({ toggleSidebar, pageTitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const notifications = [
    {
      id: 1,
      title: "Nova mensagem",
      message: "Você tem uma nova mensagem do professor",
      time: "2 min atrás",
      type: "message"
    },
    {
      id: 2,
      title: "Lembrete de prova",
      message: "Prova de Matemática amanhã às 8h",
      time: "1 hora atrás",
      type: "calendar"
    },
    {
      id: 3,
      title: "Nota lançada",
      message: "Sua nota de História foi lançada",
      time: "3 horas atrás",
      type: "trending"
    }
  ];

  const unreadCount = notifications.length;

  return (
    <header className="header-modern sticky top-0 z-10">
      <div className="flex h-20 items-center justify-between px-6 sm:px-8 lg:px-10">
        {/* Left side */}
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden p-3 rounded-xl hover:bg-white/20 text-white hover:text-white transition-all duration-300"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="hidden sm:block">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              {pageTitle}
            </h1>
            <p className="text-secondary-header text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Center - Search (hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-10">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600" />
            <input
              type="text"
              placeholder="Pesquisar no sistema..."
              className="header-search w-full pl-12 pr-6 py-3 rounded-2xl text-gray-900 placeholder-slate-400 focus:outline-none transition-all duration-300 text-base font-medium"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-6">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-3 rounded-xl hover:bg-white/20 text-white hover:text-white transition-all duration-300"
          >
            {theme === 'dark' ? (
              <Sun className="h-6 w-6 text-blue-300" />
            ) : (
              <Moon className="h-6 w-6 text-accent-header" />
            )}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-xl hover:bg-white/20 text-white hover:text-white relative transition-all duration-300"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <Badge className="notification-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Notificações
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} não lidas
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {notification.type === 'message' && (
                            <MessageSquare className="h-5 w-5 text-blue-500" />
                          )}
                          {notification.type === 'calendar' && (
                            <Calendar className="h-5 w-5 text-green-500" />
                          )}
                          {notification.type === 'trending' && (
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/20 text-white hover:text-white transition-all duration-300"
            >
              <Avatar className="h-10 w-10 user-avatar">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="text-white text-base font-bold">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-user-name text-sm font-semibold">
                  {user?.firstName || user?.email}
                </p>
                <p className="text-sidebar-accent text-xs font-semibold capitalize">
                  {user?.role === 'admin' && 'Administrador'}
                  {user?.role === 'coordinator' && 'Coordenador'}
                  {user?.role === 'teacher' && 'Professor'}
                  {user?.role === 'student' && 'Aluno'}
                </p>
              </div>
              <ChevronDown className="h-5 w-5 text-accent-header" />
            </Button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <div className="py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/meu-perfil');
                    }}
                  >
                    <User className="h-4 w-4 mr-3" />
                    Meu Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configurações
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-15"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
