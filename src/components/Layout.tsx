import { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardList, FileText, MessageSquare,
  Users, LogOut, Menu, X, ChevronDown, Star, Building2,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "لوحة التحكم", roles: ["Admin", "Manager"], icon: LayoutDashboard },
  { path: "/survey", label: "تقييم جديد", roles: ["Agent", "Admin"], icon: ClipboardList },
  { path: "/archive", label: "أرشيف التقييمات", roles: ["Admin", "Manager", "Agent"], icon: FileText },
  { path: "/questions", label: "إدارة الأسئلة", roles: ["Admin", "Manager"], icon: Star },
  { path: "/categories", label: "الفئات", roles: ["Admin"], icon: Building2 },
  { path: "/users", label: "المستخدمين", roles: ["Admin"], icon: Users },
  { path: "/whatsapp", label: "سجل الواتساب", roles: ["Admin", "Manager"], icon: MessageSquare },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleItems = navItems.filter((item) => hasRole(...item.roles));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/ABC-Logo.png" alt="Logo" className="h-8" />
          <span className="font-bold text-gray-800">نزل تك</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 text-red-500">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-64 bg-white border-l shadow-sm z-50
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-4 border-b hidden lg:block">
          <div className="flex items-center gap-3">
            <img src="/ABC-Logo.png" alt="Logo" className="h-10" />
            <div>
              <div className="font-bold text-gray-800">نزل تك</div>
              <div className="text-xs text-gray-500">نظام رضا الزوار</div>
            </div>
          </div>
        </div>

        <div className="lg:hidden p-4 border-b flex items-center justify-between">
          <span className="font-bold">{user?.name}</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1">
            <X size={24} />
          </button>
        </div>

        <div className="p-3 border-b bg-blue-50 mx-3 my-2 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-blue-600">{user?.role === "Admin" ? "مدير" : user?.role === "Manager" ? "مشرف" : "عضو"}</div>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:mr-64 min-h-screen">
        <div className="hidden lg:block bg-white border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">مرحباً،</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700">
              <LogOut size={16} />
              تسجيل خروج
            </button>
          </div>
        </div>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
