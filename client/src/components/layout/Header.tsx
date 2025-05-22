import { useState } from "react";
import { Bell, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getUserInitials, getRoleTranslation } from "@/lib/utils";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
  pageTitle: string;
}

export function Header({ toggleSidebar, pageTitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications - in a real app, these would come from the backend
  const notifications = [
    { id: 1, title: 'Nota lançada: Matemática', message: 'Sua nota da prova 2 foi lançada.', time: 'Há 5 minutos' },
    { id: 2, title: 'Aviso da coordenação', message: 'Reunião de pais agendada para 15/07.', time: 'Há 1 hora' },
    { id: 3, title: 'Novo evento no calendário', message: 'Feira de ciências agendada para 20/08.', time: 'Ontem' }
  ];

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-dark-600 shadow z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="hidden sm:block ml-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 relative"
              aria-label="View notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 inline-block w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-dark-600 ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1 divide-y divide-gray-200 dark:divide-dark-400 max-h-80 overflow-y-auto" role="menu">
                  {notifications.map(notification => (
                    <div key={notification.id} className="flex px-4 py-3 hover:bg-gray-100 dark:hover:bg-dark-500 transition-colors">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-500 dark:text-primary-300">
                          <Bell className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-dark-400">
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/notifications');
                      setShowNotifications(false);
                    }}
                    className="block px-4 py-2 text-sm text-center text-primary-500 dark:text-primary-300 font-medium hover:bg-gray-100 dark:hover:bg-dark-500"
                  >
                    Ver todas as notificações
                  </a>
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-200">
                    {getUserInitials(`${user?.firstName || ''} ${user?.lastName || ''}`)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getRoleTranslation(user?.role || 'user')}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => navigate('/settings')}
              >
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                onClick={() => window.location.href = '/api/logout'}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
