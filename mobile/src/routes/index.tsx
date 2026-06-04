import { useState } from 'react';
import { login, logout, type AuthUser } from '../apis';
import AppLayout from '../layouts/app';
import type { AppTabKey } from '../layouts/app';
import AlertsPage from '../pages/alerts';
import IdentityPage from '../pages/identity';
import LoginPage from '../pages/login';
import MyRoomPage from '../pages/my-room';
import ProfilePage from '../pages/profile';

const tabTitles: Record<AppTabKey, string> = {
  home: 'My Room',
  identity: 'My Room',
  alerts: 'MyRoom',
  profile: 'My Room',
};

function renderTab(tab: AppTabKey, user: AuthUser | null, onLogout: () => void) {
  if (tab === 'identity') {
    return <IdentityPage />;
  }

  if (tab === 'alerts') {
    return <AlertsPage />;
  }

  if (tab === 'profile') {
    return <ProfilePage user={user} onLogout={onLogout} />;
  }

  return <MyRoomPage />;
}

export default function AppRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTabKey>('home');
  const [user, setUser] = useState<AuthUser | null>(null);

  async function handleLogin(username: string, password: string) {
    const response = await login(username, password);
    setUser(response.user);
    setIsLoggedIn(true);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setActiveTab('home');
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <AppLayout activeTab={activeTab} onTabPress={setActiveTab} title={tabTitles[activeTab]}>
      {renderTab(activeTab, user, handleLogout)}
    </AppLayout>
  );
}
