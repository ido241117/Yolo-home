import type { ReactElement } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdDarkMode,
  MdDashboard,
  MdDevices,
  MdLightMode,
  MdLogout,
  MdMeetingRoom,
  MdNotificationsActive,
  MdSensors,
  MdSupervisorAccount,
} from 'react-icons/md';
import { Link, useLocation, useNavigate } from 'react-router';
import { menuItems } from '@/config/menu';
import { useTheme } from '@/contexts/theme-context';

const ICON_MAP: Record<string, ReactElement> = {
  MdDashboard:        <MdDashboard size={20} />,
  MdMeetingRoom:      <MdMeetingRoom size={20} />,
  MdDevices:          <MdDevices size={20} />,
  MdSensors:          <MdSensors size={20} />,
  MdNotificationsActive:<MdNotificationsActive size={20} />,
  MdSupervisorAccount:<MdSupervisorAccount size={20} />,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className="sidebar"
      style={{
        width: collapsed
          ? 'var(--sidebar-width-collapsed)'
          : 'var(--sidebar-width)',
      }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-mark">P</span>
        {!collapsed && <span className="sidebar-logo-text">Proton IoT</span>}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.key}
            to={item.path}
            className={`sidebar-nav-item${isActive(item.path) ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon">{ICON_MAP[item.icon]}</span>
            {!collapsed && (
              <span className="sidebar-nav-label">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-nav-item"
          onClick={toggleTheme}
          title={isDark ? 'Chuyển Light Mode' : 'Chuyển Dark Mode'}
        >
          <span className="sidebar-nav-icon">
            {isDark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
          </span>
          {!collapsed && (
            <span className="sidebar-nav-label">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        <button
          className="sidebar-nav-item"
          onClick={logout}
          title="Đăng xuất"
        >
          <span className="sidebar-nav-icon">
            <MdLogout size={20} />
          </span>
          {!collapsed && (
            <span className="sidebar-nav-label">Đăng xuất</span>
          )}
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onToggle}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          <span className="sidebar-nav-icon">
            {collapsed ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
          </span>
          {!collapsed && (
            <span className="sidebar-nav-label">Thu gọn</span>
          )}
        </button>
      </div>
    </aside>
  );
}
