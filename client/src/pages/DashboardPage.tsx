import { MainLayout } from "@/components/layout/MainLayout";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboards/TeacherDashboard";
import { StudentDashboard } from "@/components/dashboards/StudentDashboard";
import CoordinatorDashboard from "@/pages/coordinator/CoordinatorDashboard";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Get user type from the authenticated user
  const userType = user?.role || 'admin';
  
  const renderDashboard = () => {
    switch (userType) {
      case 'admin':
      case 'administrator':
        return <AdminDashboard />;
      case 'teacher':
      case 'professor':
        return <TeacherDashboard />;
      case 'student':
      case 'aluno':
        return <StudentDashboard />;
      case 'coordinator':
        return <CoordinatorDashboard />; // Dashboard específico do coordenador
      default:
        return <AdminDashboard />;
    }
  };
  
  return (
    <MainLayout pageTitle="Dashboard">
      {renderDashboard()}
    </MainLayout>
  );
}
