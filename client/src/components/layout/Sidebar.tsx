import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LogoIcon } from "./LogoIcon";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  UserRound,
  GraduationCap,
  ShieldCheck,
  UsersRound,
  BookOpen,
  Star,
  BookText,
  CalendarDays,
  BarChart3,
  UserCog,
  Settings,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRoleTranslation, getUserInitials } from "@/lib/utils";

interface SidebarProps {
  isSidebarOpen: boolean;
  closeSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, closeSidebar }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  
  const handleNavigation = (path: string) => {
    navigate(path);
    closeSidebar();
  };
  
  const NavItem = ({ 
    path, 
    icon: Icon, 
    label 
  }: { 
    path: string; 
    icon: React.ComponentType<any>; 
    label: string; 
  }) => (
    <a 
      href={path}
      onClick={(e) => {
        e.preventDefault();
        handleNavigation(path);
      }}
      className={cn(
        "flex items-center px-2 py-2 text-sm font-medium rounded-md group transition-colors",
        location === path 
          ? "text-primary-500 bg-primary-50 dark:bg-dark-500 dark:text-primary-300" 
          : "text-gray-700 dark:text-gray-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-dark-500 dark:hover:text-primary-300"
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      {label}
    </a>
  );

  return (
    <div 
      className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-600 shadow-lg transform transition-transform duration-300 z-30 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-500">
        <div className="flex items-center">
          <LogoIcon className="h-8 w-8 text-primary-500 dark:text-primary-300" />
          <span className="ml-2 text-gray-700 dark:text-gray-300 font-heading font-semibold">Sistema Escolar</span>
        </div>
        <button 
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-500 focus:outline-none"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex flex-col items-center mt-6 -mx-2">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user?.profileImageUrl} alt={user?.firstName} className="object-cover" />
          <AvatarFallback className="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-200 text-lg">
            {getUserInitials(`${user?.firstName || ''} ${user?.lastName || ''}`)}
          </AvatarFallback>
        </Avatar>
        <h4 className="mx-2 mt-2 font-medium text-gray-800 dark:text-white">
          {user?.firstName} {user?.lastName}
        </h4>
        <p className="mx-2 mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
          {getRoleTranslation(userType)}
        </p>
      </div>
      
      <div className="py-4 px-4 space-y-1 overflow-y-auto h-[calc(100vh-12rem)]">
        {/* Administrator Menu */}
        {userType === 'admin' && (
          <>
            <NavItem path="/dashboard" icon={Home} label="Dashboard" />
            <NavItem path="/students" icon={UserRound} label="Alunos" />
            <NavItem path="/teachers" icon={GraduationCap} label="Professores" />
            <NavItem path="/coordinators" icon={ShieldCheck} label="Coordenadores" />
            <NavItem path="/classes" icon={UsersRound} label="Turmas" />
            <NavItem path="/subjects" icon={BookOpen} label="Disciplinas" />
            <NavItem path="/grades" icon={Star} label="Notas" />
            <NavItem path="/diary" icon={BookText} label="Diário de Classe" />
            <NavItem path="/calendar" icon={CalendarDays} label="Calendário" />
            <NavItem path="/reports" icon={BarChart3} label="Relatórios" />
            <NavItem path="/user-management" icon={UserCog} label="Gerenciar Usuários" />
            <NavItem path="/settings" icon={Settings} label="Configurações" />
          </>
        )}
        
        {/* Coordinator Menu */}
        {userType === 'coordinator' && (
          <>
            <NavItem path="/dashboard" icon={Home} label="Dashboard" />
            <NavItem path="/teachers" icon={GraduationCap} label="Professores" />
            <NavItem path="/classes" icon={UsersRound} label="Turmas" />
            <NavItem path="/subjects" icon={BookOpen} label="Disciplinas" />
            <NavItem path="/reports" icon={BarChart3} label="Relatórios" />
            <NavItem path="/calendar" icon={CalendarDays} label="Calendário" />
            <NavItem path="/notifications" icon={BookText} label="Recados" />
          </>
        )}
        
        {/* Teacher Menu */}
        {userType === 'teacher' && (
          <>
            <NavItem path="/dashboard" icon={Home} label="Dashboard" />
            <NavItem path="/my-classes" icon={UsersRound} label="Minhas Turmas" />
            <NavItem path="/grades" icon={Star} label="Lançar Notas" />
            <NavItem path="/diary" icon={BookText} label="Diário de Classe" />
            <NavItem path="/attendance" icon={CalendarDays} label="Presença" />
            <NavItem path="/notifications" icon={BookText} label="Recados" />
          </>
        )}
        
        {/* Student Menu */}
        {userType === 'student' && (
          <>
            <NavItem path="/dashboard" icon={Home} label="Dashboard" />
            <NavItem path="/my-grades" icon={Star} label="Minhas Notas" />
            <NavItem path="/report-card" icon={BookText} label="Meu Boletim" />
            <NavItem path="/class" icon={UsersRound} label="Turma" />
            <NavItem path="/attendance" icon={CalendarDays} label="Presença" />
            <NavItem path="/calendar" icon={CalendarDays} label="Calendário" />
            <NavItem path="/notifications" icon={BookText} label="Recados" />
          </>
        )}
        
        {/* Logout Button (for all users) */}
        <button 
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="flex items-center w-full px-2 py-2 mt-1 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-dark-500 dark:hover:text-primary-300 group transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          {isLoggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
    </div>
  );
}
