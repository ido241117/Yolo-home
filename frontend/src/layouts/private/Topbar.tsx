import { Icon } from '@/components';
import { useNavigate } from 'react-router';

export function Topbar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      {/* Search */}
      <div className="topbar-search">
        <span className="topbar-search-icon">
          <Icon name="search" size={16} />
        </span>
        <input placeholder="Search rooms, tenants, or events..." />
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        <button className="btn-primary">Add New</button>

        <Icon
          name="notifications"
          size={22}
          className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors"
        />

        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
            <Icon name="person" size={18} className="text-on-surface-variant" />
          </div>
          <Icon name="expand_more" size={18} className="text-on-surface-variant" />
        </div>

        <button className="table-icon-btn" onClick={logout} title="Logout" aria-label="Logout">
          <Icon name="logout" size={20} />
        </button>
      </div>
    </header>
  );
}
