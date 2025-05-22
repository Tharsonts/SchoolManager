import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import TeachersPage from "@/pages/TeachersPage";
import ClassesPage from "@/pages/ClassesPage";
import GradesPage from "@/pages/GradesPage";
import AttendancePage from "@/pages/AttendancePage";
import CalendarPage from "@/pages/CalendarPage";
import ReportsPage from "@/pages/ReportsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import DiaryPage from "@/pages/DiaryPage";
import SubjectsPage from "@/pages/SubjectsPage";
import CoordinatorsPage from "@/pages/CoordinatorsPage";
import UserManagementPage from "@/pages/UserManagementPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import MyGradesPage from "@/pages/MyGradesPage";
import ReportCardPage from "@/pages/ReportCardPage";
import ClassPage from "@/pages/ClassPage";
import MyClassesPage from "@/pages/MyClassesPage";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={isAuthenticated ? DashboardPage : LoginPage} />
      
      {/* Protected routes */}
      {isAuthenticated && (
        <>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/students" component={StudentsPage} />
          <Route path="/teachers" component={TeachersPage} />
          <Route path="/coordinators" component={CoordinatorsPage} />
          <Route path="/classes" component={ClassesPage} />
          <Route path="/subjects" component={SubjectsPage} />
          <Route path="/grades" component={GradesPage} />
          <Route path="/my-grades" component={MyGradesPage} />
          <Route path="/diary" component={DiaryPage} />
          <Route path="/report-card" component={ReportCardPage} />
          <Route path="/class" component={ClassPage} />
          <Route path="/my-classes" component={MyClassesPage} />
          <Route path="/attendance" component={AttendancePage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route path="/notifications" component={NotificationsPage} />
          <Route path="/user-management" component={UserManagementPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/profile" component={ProfilePage} />
        </>
      )}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
