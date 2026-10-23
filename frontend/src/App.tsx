import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { TeacherLayout } from './layouts/TeacherLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { StudentLogin } from './pages/public/StudentLogin';
import { StudentRegister } from './pages/public/StudentRegister';
import { TeacherLogin } from './pages/public/TeacherLogin';
import { AdminLogin } from './pages/public/AdminLogin';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { AiTutor } from './pages/student/AiTutor';
import { AirWriting } from './pages/student/AirWriting';
import { ArLab } from './pages/student/ArLab';
import { Lessons as StudentLessons } from './pages/student/Lessons';
import { LessonView } from './pages/student/LessonView';
import { Quizzes as StudentQuizzes } from './pages/student/Quizzes';
import { QuizAttempt } from './pages/student/QuizAttempt';
import { Progress as StudentProgress } from './pages/student/Progress';
import { Downloads } from './pages/student/Downloads';
import { Settings as StudentSettings } from './pages/student/Settings';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { Classes as TeacherClasses } from './pages/teacher/Classes';
import { Materials as TeacherMaterials } from './pages/teacher/Materials';
import { Assessments as TeacherAssessments } from './pages/teacher/Assessments';
import { StudentProgress as TeacherStudentProgress } from './pages/teacher/StudentProgress';
import { Settings as TeacherSettings } from './pages/teacher/Settings';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { Users as AdminUsers } from './pages/admin/Users';
import { Courses as AdminCourses } from './pages/admin/Courses';
import { Lessons as AdminLessons } from './pages/admin/Lessons';
import { AiConfig } from './pages/admin/AiConfig';
import { KnowledgeBase } from './pages/admin/KnowledgeBase';
import { QuizManagement } from './pages/admin/QuizManagement';
import { ArLabManagement } from './pages/admin/ArLabManagement';
import { AirWritingConfig } from './pages/admin/AirWritingConfig';
import { PlatformSettings } from './pages/admin/PlatformSettings';
import { AuditLogs } from './pages/admin/AuditLogs';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  allowedRoles?: string[];
  redirectPath?: string;
  children: React.ReactNode;
}> = ({ allowedRoles, redirectPath = '/student/login', children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to appropriate home
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Portal Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/teacher/login" element={<TeacherLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
          </Route>

          {/* Student Portal (Protected) */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} redirectPath="/student/login">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="ai-tutor" element={<AiTutor />} />
            <Route path="air-writing" element={<AirWriting />} />
            <Route path="ar-lab" element={<ArLab />} />
            <Route path="lessons" element={<StudentLessons />} />
            <Route path="lessons/:id" element={<LessonView />} />
            <Route path="quizzes" element={<StudentQuizzes />} />
            <Route path="quizzes/:id" element={<QuizAttempt />} />
            <Route path="progress" element={<StudentProgress />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="settings" element={<StudentSettings />} />
          </Route>

          {/* Teacher Portal (Protected) */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']} redirectPath="/teacher/login">
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="materials" element={<TeacherMaterials />} />
            <Route path="assessments" element={<TeacherAssessments />} />
            <Route path="progress" element={<TeacherStudentProgress />} />
            <Route path="settings" element={<TeacherSettings />} />
          </Route>

          {/* Admin Portal (Protected: Admin Only) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']} redirectPath="/admin/login">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="lessons" element={<AdminLessons />} />
            <Route path="ai-config" element={<AiConfig />} />
            <Route path="knowledge-base" element={<KnowledgeBase />} />
            <Route path="quizzes" element={<QuizManagement />} />
            <Route path="ar-lab" element={<ArLabManagement />} />
            <Route path="air-writing" element={<AirWritingConfig />} />
            <Route path="settings" element={<PlatformSettings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
