import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import InstructionsModal from "@/components/ui/InstructionsModal";
import CoordinatorInstructionModal from "@/components/instructions/CoordinatorInstructionModal";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function MainLayout({ children, pageTitle }: MainLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-700">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Professor';
      case 'coordinator': return 'Coordenador';
      case 'student': return 'Aluno';
      default: return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <AppSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onInstructionsClick={() => setShowInstructions(true)}
      />

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white px-4 py-2 lg:hidden">
        <Button variant="ghost" size="sm" className="h-12 w-12 p-0" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menu">
          <Menu className="h-6 w-6" />
        </Button>
        <span className="min-w-0 truncate font-medium text-slate-800">{pageTitle}</span>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">

        {/* Page Content */}
        <main className="min-w-0 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Instructions Modal */}
      {user?.role === 'coordinator' ? (
        <CoordinatorInstructionModal 
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
        />
      ) : (
        <InstructionsModal 
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          userRole={user?.role as 'admin' | 'teacher' | 'student'}
        />
      )}
    </div>
  );
}

export default MainLayout;
