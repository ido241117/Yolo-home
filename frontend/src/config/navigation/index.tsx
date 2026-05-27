import type { ReactNode } from 'react';
import { FaBell, FaHome, FaRegChartBar, FaShieldAlt, FaUsers } from 'react-icons/fa';

export interface NavigationItem {
  key: string;
  label: string;
  path: string;
  icon: ReactNode;
}

export const navigationItems: NavigationItem[] = [
  { key: '/', label: 'Dashboard', path: '/', icon: <FaRegChartBar /> },
  { key: '/rooms', label: 'Rooms', path: '/rooms', icon: <FaHome /> },
  { key: '/accounts', label: 'Accounts', path: '/accounts', icon: <FaUsers /> },
  { key: '/alerts', label: 'Alerts', path: '/alerts', icon: <FaBell /> },
  { key: '/faces', label: 'Faces', path: '/faces', icon: <FaShieldAlt /> },
];
