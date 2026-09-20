import { Switch, Route, Redirect } from "wouter";
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
import UserManagementPage from "@/pages/UserManagementPage";
import SettingsPage from "@/pages/SettingsPage";
import MyGradesPage from "@/pages/MyGradesPage";
import ReportCardPage from "@/pages/ReportCardPage";
import ClassPage from "@/pages/ClassPage";
import StudentClassPage from "@/pages/student/StudentClassPage";
import MyActivitiesPage from "@/pages/MyActivitiesPage";
import StudentActivitiesPage from "@/pages/student/StudentActivitiesPage";
import SchedulePage from "@/pages/SchedulePage";
import StudentSchedulePage from "@/pages/student/StudentSchedulePage";
import StudentCalendarPage from "@/pages/student/StudentCalendarPage";
import TeacherCalendarPage from "@/pages/teacher/TeacherCalendarPage";
import TeacherActivitiesPage from "@/pages/teacher/TeacherActivitiesPage";
import TeacherChatPage from "@/pages/teacher/TeacherChatPage";
import TeacherGradePage from "@/pages/teacher/TeacherGradePage";
import TeacherDashboardPage from "@/pages/teacher/TeacherDashboardPage";
import TeacherExamsPage from "@/pages/teacher/TeacherExamsPage";
import TeacherClassesPage from "@/pages/teacher/TeacherClassesPage";
import TeacherAIAssistant from "@/pages/teacher/TeacherAIAssistant";
import CoordinatorDashboard from "@/pages/coordinator/CoordinatorDashboard";
import CoordinatorApprovals from "@/pages/coordinator/CoordinatorApprovals";
import CoordinatorActivities from "@/pages/coordinator/CoordinatorActivities";
import CoordinatorTeachers from "@/pages/coordinator/CoordinatorTeachers";
import CoordinatorReports from "@/pages/coordinator/CoordinatorReports";
import CoordinatorAcademicCalendar from "@/pages/coordinator/CoordinatorAcademicCalendar";
import CoordinatorClasses from "@/pages/coordinator/CoordinatorClasses";
import CoordinatorStudents from "@/pages/coordinator/CoordinatorStudents";
import CoordinatorPerformance from "@/pages/coordinator/CoordinatorPerformance";
import CoordinatorLogs from "@/pages/coordinator/CoordinatorLogs";
import CoordinatorChat from "@/pages/coordinator/CoordinatorChat";
// Profile pages - using generic UserProfilePage
// import CoordinatorProfilePage from "@/pages/coordinator/CoordinatorProfilePage";
// import TeacherProfilePage from "@/pages/teacher/TeacherProfilePage";
// import StudentProfilePage from "@/pages/student/StudentProfilePage";
import MyClassesPage from "@/pages/MyClassesPage";
import TeacherClassManagement from "@/pages/TeacherClassManagement";
import ClassDetailPage from "@/pages/ClassDetailPage";
import ClassDiary from "@/pages/ClassDiary";
import ActivitiesPage from "@/pages/ActivitiesPage";
import ActivitiesPageImproved from "@/pages/ActivitiesPageImproved";
import ActivityDetailForTeacher from "@/pages/ActivityDetailForTeacher";
import { StudentActivityDetail } from "@/pages/StudentActivityDetail";
import DocxViewerPage from "@/pages/DocxViewerPage";
import CreateActivityPage from "@/pages/CreateActivityPage";
import EditActivityPage from "@/pages/EditActivityPage";
import AdvancedActivitiesPage from "@/pages/AdvancedActivitiesPage";
import TeacherDashboard from "@/pages/TeacherDashboard";
import LaunchTaskPage from "@/pages/LaunchTaskPage";
import ChatPage from "@/pages/ChatPage";
import EvaluationsPage from "@/pages/EvaluationsPage";
import { TeacherMaterialsPage } from "@/pages/teacher/TeacherMaterialsPage";
import TeacherAttendancePage from "@/pages/teacher/TeacherAttendancePage";
import StudentAttendancePage from "@/pages/student/StudentAttendancePage";
import { StudentMaterialsPage } from "@/pages/student/StudentMaterialsPage";
import StudentExamsPage from "@/pages/student/StudentExamsPage";
import StudentEvaluationsPage from "@/pages/student/StudentEvaluationsPage";
import { useAuth } from "@/hooks/useAuth";


// Importar páginas administrativas
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminTeachersPage from "@/pages/admin/TeachersPage";
import AdminStudentsPage from "@/pages/admin/StudentsPage";
import AdminCoordinatorsPage from "@/pages/admin/CoordinatorsPage";
import AdministratorsPage from "@/pages/admin/AdministratorsPage";
import AdminSubjectsPage from "@/pages/admin/SubjectsPage";
import AdminClassesPage from "@/pages/admin/ClassesPage";
import AdminReportsPage from "@/pages/admin/ReportsPage";
// import AdminProfilePage from "@/pages/admin/ProfilePage"; // File doesn't exist
import AdminSettingsPage from "@/pages/admin/SettingsPage";
import AdminLogs from "@/pages/admin/AdminLogs";
import DirectorTransferPage from "@/pages/admin/DirectorTransferPage";
import DirectorViewPage from "@/pages/admin/DirectorViewPage";
import { useAdminCapabilities } from "@/hooks/useAdminApi";
import UsersDirectory from "@/pages/director/UsersDirectory";
import AdminLayout from "@/components/layout/AdminLayout";
import DirectorLayout from "@/components/layout/DirectorLayout";
import DirectorDashboard from "@/pages/director/DirectorDashboard";
import DirectorApprovals from "@/pages/director/DirectorApprovals";
import DirectorAnnouncements from "@/pages/director/DirectorAnnouncements";
import PeriodManagement from "@/pages/director/PeriodManagement";
import DirectorAccess from "@/pages/director/DirectorAccess";
import DirectorPeriods from "@/pages/director/DirectorPeriods";
import DirectorCalendar from "@/pages/director/DirectorCalendar";
import DirectorEnrollments from "@/pages/director/DirectorEnrollments";
import TestProfilePage from "@/pages/TestProfilePage";
import UseCaseCalendar from "@/pages/tcc/UseCaseCalendar";
import UseCaseEditor from "@/pages/tcc/UseCaseEditor";
import MappingPage from "@/pages/tcc/MappingPage";


// Importar páginas do aluno
import StudentDashboardPage from "@/pages/student/StudentDashboardPage";
import StudentGradesPage from "@/pages/student/StudentGradesPage";

// Importar MainLayout e TeacherLayout
import { MainLayout } from "@/components/layout/MainLayout";
import TeacherLayout from "@/components/layout/TeacherLayout";
import StudentLayout from "@/components/layout/StudentLayout";

// Componente para verificar permissões de acesso
function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  currentUserRole 
}: { 
  children: React.ReactNode, 
  allowedRoles: string[], 
  currentUserRole?: string 
}) {
  if (!currentUserRole || !allowedRoles.includes(currentUserRole)) {
    return <NotFound />;
  }
  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-600 font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        {/* Rota pública do editor disponível sem autenticação */}
        <Route path="/tcc/usecase-editor">
          <UseCaseEditor />
        </Route>

        {/* Login padrão */}
        <Route path="/">
          <LoginPage />
        </Route>

        {/* Fallback para não encontrados */}
        <Route component={NotFound} />
      </Switch>
    );
  }

  const userRole = user?.role;

    return (
      <Switch>
      {/* Redirecionamento padrão baseado no role */}
      <Route path="/">
        {userRole === 'admin' ? (
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        ) : userRole === 'director' ? (
          <DirectorLayout>
            <DirectorDashboard />
          </DirectorLayout>
        ) : userRole === 'student' ? (
          <StudentLayout>
            <StudentDashboardPage />
          </StudentLayout>
        ) : userRole === 'teacher' ? (
          <Redirect to="/teacher/dashboard" />
        ) : (
          <DashboardPage />
        )}
      </Route>
      <Route path="/dashboard">
        {userRole === 'admin' ? (
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        ) : userRole === 'director' ? (
          <DirectorLayout>
            <DirectorDashboard />
          </DirectorLayout>
        ) : userRole === 'student' ? (
          <StudentLayout>
            <StudentDashboardPage />
          </StudentLayout>
        ) : userRole === 'teacher' ? (
          <Redirect to="/teacher/dashboard" />
        ) : (
          <DashboardPage />
        )}
      </Route>

      {/* === ROTAS ADMINISTRATIVAS === */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>


      <Route path="/admin/coordinators">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminCoordinatorsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

  <Route path="/admin/administrators">
    <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
      <AdminLayout>
        <AdministratorsPage />
      </AdminLayout>
    </ProtectedRoute>
  </Route>


      <Route path="/admin/teachers">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminTeachersPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/students">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminStudentsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/director-view">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <DirectorViewPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/subjects">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminSubjectsPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/classes">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminClassesPage />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

        <Route path="/admin/reports">
          <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
            <AdminLayout>
              <AdminReportsPage />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

        {/* Perfil: acessível para todos os perfis ativos */}
      <Route path="/meu-perfil">
        <ProtectedRoute allowedRoles={['admin','director','teacher','student','coordinator']} currentUserRole={userRole}>
          {userRole === 'admin' ? (
            <AdminLayout>
              <TestProfilePage />
            </AdminLayout>
          ) : userRole === 'director' ? (
            <DirectorLayout>
              <TestProfilePage />
            </DirectorLayout>
          ) : userRole === 'teacher' ? (
            <TeacherLayout>
              <TestProfilePage />
            </TeacherLayout>
          ) : userRole === 'student' ? (
            <StudentLayout>
              <TestProfilePage />
            </StudentLayout>
          ) : (
            <MainLayout pageTitle="Meu Perfil">
              <TestProfilePage />
            </MainLayout>
          )}
        </ProtectedRoute>
      </Route>

        <Route path="/admin/settings">
          <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
            <AdminLayout>
              <AdminSettingsPage />
            </AdminLayout>
          </ProtectedRoute>
        </Route>

      <Route path="/admin/logs">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <AdminLayout>
            <AdminLogs />
          </AdminLayout>
        </ProtectedRoute>
      </Route>

  <Route path="/admin/director-transfer">
    <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
      {(() => {
        const CapsGate: React.FC = () => {
          const { data } = useAdminCapabilities();
          const caps = data?.data;
          return (
            <AdminLayout>
              <DirectorTransferPage />
            </AdminLayout>
          );
        };
        return <CapsGate />;
      })()}
    </ProtectedRoute>
  </Route>

        {/* Rotas do Diretor */}
        <Route path="/director/dashboard">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <DirectorDashboard />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        {/* Rota de instruções removida: o painel abre sobre qualquer página via DirectorLayout */}

      <Route path="/director/approvals">
        <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
          <DirectorLayout>
            <DirectorApprovals />
          </DirectorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/director/users">
        <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
          <DirectorLayout>
            <UsersDirectory />
          </DirectorLayout>
        </ProtectedRoute>
      </Route>

        <Route path="/director/announcements">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <DirectorAnnouncements />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/periods">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <PeriodManagement />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/access">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <DirectorAccess />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/periods">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <DirectorPeriods />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/calendar">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <DirectorCalendar />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/chat">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <ChatPage />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/enrollments">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <DirectorEnrollments />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        {/* Página TCC: Painel de Mapeamento OO-Relacional (pública) */}
        <Route path="/tcc">
          <MappingPage />
        </Route>

        {/* Página TCC: Caso de Uso — Gerenciar comunicados no calendário */}
        <Route path="/tcc/usecase-calendar">
          <ProtectedRoute allowedRoles={['director', 'coordinator']} currentUserRole={userRole}>
            {userRole === 'director' ? (
              <DirectorLayout>
                <UseCaseCalendar />
              </DirectorLayout>
            ) : (
              <UseCaseCalendar />
            )}
          </ProtectedRoute>
        </Route>

        {/* Página TCC: Editor de Caso de Uso — agora PÚBLICA para facilitar acesso direto */}
        <Route path="/tcc/usecase-editor">
          <UseCaseEditor />
        </Route>

        {/* Rotas de gestão para o diretor (espelhos das páginas admin) */}
        <Route path="/director/students">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <AdminStudentsPage />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/teachers">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <AdminTeachersPage />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/classes">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <AdminClassesPage />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>

        <Route path="/director/subjects">
          <ProtectedRoute allowedRoles={['director']} currentUserRole={userRole}>
            <DirectorLayout>
              <AdminSubjectsPage />
            </DirectorLayout>
          </ProtectedRoute>
        </Route>




      {/* === ROTAS LEGADAS PARA ADMIN === */}
      <Route path="/user-management">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <UserManagementPage />
        </ProtectedRoute>
      </Route>


      {/* === ROTAS PARA ADMIN E COORDINATOR === */}
      <Route path="/teachers">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <TeachersPage />
        </ProtectedRoute>
      </Route>

      <Route path="/students">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <StudentsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/classes">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <ClassesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/subjects">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <SubjectsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute allowedRoles={['admin', 'teacher']} currentUserRole={userRole}>
          <ReportsPage />
        </ProtectedRoute>
      </Route>

      {/* === ROTAS PARA PROFESSOR === */}
      <Route path="/teacher/subjects">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <SubjectsPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/my-classes">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherClassManagement />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/class-diary">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <ClassDiary />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/class-detail/:classId">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <ClassDetailPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/class-detail/:classId/:tab">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <ClassDetailPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/grades">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <GradesPage />
            </TeacherLayout>
          ) : (
            <GradesPage />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/attendance">
        <ProtectedRoute allowedRoles={['teacher', 'admin', 'student']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <AttendancePage />
            </TeacherLayout>
          ) : userRole === 'student' ? (
            <StudentLayout>
              <AttendancePage />
            </StudentLayout>
          ) : (
            <AttendancePage />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/diary">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <DiaryPage />
            </TeacherLayout>
          ) : (
            <DiaryPage />
          )}
        </ProtectedRoute>
      </Route>

      {/* === REDIRECIONAMENTOS PARA ROTAS ANTIGAS === */}

      <Route path="/evaluations">
        {userRole === 'student' ? (
          <Redirect to="/student/evaluations" />
        ) : (
          <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
            {userRole === 'teacher' ? (
              <TeacherLayout>
                <EvaluationsPage />
              </TeacherLayout>
            ) : (
              <EvaluationsPage />
            )}
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/schedule">
        {userRole === 'student' ? (
          <Redirect to="/student/schedule" />
        ) : (
          <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
            {userRole === 'teacher' ? (
              <TeacherLayout>
                <SchedulePage />
              </TeacherLayout>
            ) : (
              <SchedulePage />
            )}
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/chat">
        <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']} currentUserRole={userRole}>
          {userRole === 'admin' ? (
            <AdminLayout>
              <ChatPage />
            </AdminLayout>
          ) : userRole === 'teacher' ? (
            <TeacherLayout>
              <ChatPage />
            </TeacherLayout>
          ) : userRole === 'student' ? (
            <StudentLayout>
              <ChatPage />
            </StudentLayout>
          ) : (
            <MainLayout pageTitle="Chat">
              <ChatPage />
            </MainLayout>
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/materials">
        {userRole === 'student' ? (
          <Redirect to="/student/materials" />
        ) : userRole === 'teacher' ? (
          <Redirect to="/teacher/materials" />
        ) : (
          <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
            <AdminLayout>
              <TeacherMaterialsPage />
            </AdminLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/grades">
        {userRole === 'student' ? (
          <Redirect to="/student/grades" />
        ) : (
          <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
            <GradesPage />
          </ProtectedRoute>
        )}
      </Route>

      {/* === ROTAS COMUNS === */}

      <Route path="/activities">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          <Redirect to="/teacher/activities" />
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/activities">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherActivitiesPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/chat">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          <Redirect to="/chat" />
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/activities/:id/detail">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          <TeacherLayout>
            <ActivityDetailForTeacher />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/activities/create">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <CreateActivityPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/activities/:id/edit">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <EditActivityPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/activities/:id/grade">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherGradePage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/materials">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherMaterialsPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/attendance">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherAttendancePage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/dashboard">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherDashboardPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/exams">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherExamsPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/classes">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherClassesPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/ai-assistant">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherAIAssistant />
        </ProtectedRoute>
      </Route>

      <Route path="/student/activities/:id/detail">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentActivityDetail />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      {/* Visualizador local de DOC/DOCX */}
      <Route path="/viewer/docx/:fileId">
        <ProtectedRoute allowedRoles={['student','teacher','coordinator','director','admin']} currentUserRole={userRole}>
          {/* Render simples para manter o layout atual do aluno/role */}
          <DocxViewerPage />
        </ProtectedRoute>
      </Route>

      <Route path="/advanced-activities">
        <ProtectedRoute allowedRoles={['teacher', 'admin']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <AdvancedActivitiesPage />
            </TeacherLayout>
          ) : (
            <AdvancedActivitiesPage />
          )}
        </ProtectedRoute>
      </Route>


      <Route path="/edit-activity/:id">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <EditActivityPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/launch-task">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
          <LaunchTaskPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/calendar">
        <ProtectedRoute allowedRoles={['admin', 'teacher']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <CalendarPage />
            </TeacherLayout>
          ) : (
            <CalendarPage />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/calendar">
        <ProtectedRoute allowedRoles={['teacher']} currentUserRole={userRole}>
          <TeacherLayout>
            <TeacherCalendarPage />
          </TeacherLayout>
        </ProtectedRoute>
      </Route>

      {/* === ROTAS PARA COORDENADOR === */}
      <Route path="/coordinator/dashboard">
        <ProtectedRoute allowedRoles={['coordinator', 'admin', 'teacher']} currentUserRole={userRole}>
          <CoordinatorDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/approvals">
        <ProtectedRoute allowedRoles={['coordinator', 'admin', 'teacher']} currentUserRole={userRole}>
          <CoordinatorApprovals />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/activities">
        <ProtectedRoute allowedRoles={['coordinator', 'admin', 'teacher']} currentUserRole={userRole}>
          <CoordinatorActivities />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/teachers">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorTeachers />
        </ProtectedRoute>
      </Route>


      <Route path="/coordinator/reports">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorReports />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/academic-calendar">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorAcademicCalendar />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/classes">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorClasses />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/students">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorStudents />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/performance">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorPerformance />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/logs">
        <ProtectedRoute allowedRoles={['admin']} currentUserRole={userRole}>
          <CoordinatorLogs />
        </ProtectedRoute>
      </Route>

      <Route path="/coordinator/chat">
        <ProtectedRoute allowedRoles={['coordinator', 'admin']} currentUserRole={userRole}>
          <CoordinatorChat />
        </ProtectedRoute>
      </Route>

      {/* Rotas de perfil legadas removidas */}


      <Route path="/notifications">
        <ProtectedRoute allowedRoles={['admin', 'teacher']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <NotificationsPage />
            </TeacherLayout>
          ) : (
            <NotificationsPage />
          )}
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute allowedRoles={['admin', 'teacher']} currentUserRole={userRole}>
          {userRole === 'teacher' ? (
            <TeacherLayout>
              <SettingsPage />
            </TeacherLayout>
          ) : (
            <SettingsPage />
          )}
        </ProtectedRoute>
      </Route>

      {/* Rota genérica /profile removida - usar /meu-perfil */}

      {/* === ROTAS DO ALUNO COM STUDENT LAYOUT === */}
      <Route path="/student">
        <Redirect to="/student/dashboard" />
      </Route>

      <Route path="/student/dashboard">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentDashboardPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/class">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentClassPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/activities">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentActivitiesPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>


      <Route path="/student/materials">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentMaterialsPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/exams">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentExamsPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/attendance">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentAttendancePage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>



      <Route path="/student/submissions">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <MyActivitiesPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>


      <Route path="/student/evaluations">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentEvaluationsPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/schedule">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentSchedulePage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/calendar">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentCalendarPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/grades">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentGradesPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/report-card">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <ReportCardPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/attendance">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <StudentAttendancePage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/chat">
        <ProtectedRoute allowedRoles={['student']} currentUserRole={userRole}>
          <StudentLayout>
            <ChatPage />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      {/* Rota de perfil do aluno removida */}

      {/* Fallback */}
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
