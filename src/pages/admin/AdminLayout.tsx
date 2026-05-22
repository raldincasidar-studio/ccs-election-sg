import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  ListOrdered,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Flag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type AdminTab =
  | 'dashboard'
  | 'positions'
  | 'candidates'
  | 'students'
  | 'programs'
  | 'partylists'
  | 'reports'
  | 'settings';

interface NavItem {
  id: AdminTab;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'positions', label: 'Positions', icon: ListOrdered },
  { id: 'partylists', label: 'Partylists', icon: Flag },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'programs', label: 'Programs', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: ReactNode;
}

export function AdminLayout({ activeTab, onTabChange, children }: AdminLayoutProps) {
  const { authUser, setAuthUser, showToast } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const admin = authUser?.type === 'admin' ? authUser.data : null;

  const handleLogout = () => {
    setAuthUser(null);
    showToast('info', 'Logged out successfully.');
  };

  const handleNav = (tab: AdminTab) => {
    onTabChange(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on all screen sizes, always visible on desktop */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#2b2378] z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f9c301] flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/jrmsu-ccs-logo.png"
                alt="Logo"
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  t.style.display = 'none';
                }}
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">JRMSU CCS</p>
              <p className="text-white/60 text-xs">Election Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-[#f9c301] text-[#2b2378]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="px-4 py-2 mb-2">
            <p className="text-white font-semibold text-sm truncate">{admin?.name}</p>
            <p className="text-white/50 text-xs">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150 active:scale-95"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content — offset on desktop to account for fixed sidebar */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 active:scale-90 transition-all"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[#2b2378] text-base truncate">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
            <div className="w-7 h-7 rounded-lg bg-[#2b2378] flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {admin?.name?.[0] ?? 'A'}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-700 truncate max-w-32">
              {admin?.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
