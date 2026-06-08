import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import AgentSurvey from "./components/AgentSurvey";
import SurveyArchive from "./components/SurveyArchive";
import QuestionManagement from "./components/QuestionManagement";
import CategoryManagement from "./components/CategoryManagement";
import UserManagement from "./components/UserManagement";
import WhatsAppLogs from "./components/WhatsAppLogs";
import { ReactNode } from "react";

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === "Agent") return <Navigate to="/survey" replace />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute roles={["Admin", "Manager", "Agent"]}><DashboardRedirect /></ProtectedRoute>} />
          <Route path="/survey" element={<ProtectedRoute roles={["Admin", "Agent"]}><AgentSurvey /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute roles={["Admin", "Manager", "Agent"]}><SurveyArchive /></ProtectedRoute>} />
          <Route path="/questions" element={<ProtectedRoute roles={["Admin", "Manager"]}><QuestionManagement /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute roles={["Admin"]}><CategoryManagement /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={["Admin"]}><UserManagement /></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute roles={["Admin", "Manager"]}><WhatsAppLogs /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
