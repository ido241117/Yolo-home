import { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="private-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
      />
      <div className="private-body">
        <Topbar />
        <main className="private-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
