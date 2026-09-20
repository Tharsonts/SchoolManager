import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import InstructionsModal from "@/components/ui/InstructionsModal";
import CoordinatorInstructionModal from "@/components/instructions/CoordinatorInstructionModal";
import { AppSidebar } from "./AppSidebar";

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

      {/* Main Content */}
      <div className="lg:ml-64">

        {/* Page Content */}
        <main className="p-6">
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