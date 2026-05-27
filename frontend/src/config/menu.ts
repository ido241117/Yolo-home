export interface MenuItem {
  key: string;
  label: string;
  path: string;
  /** Key into ICON_MAP in Sidebar */
  icon: string;
  /** When undefined, every role can see it. */
  roles?: Array<'owner' | 'admin' | 'tenant'>;
}

export const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: 'MdDashboard',
  },
  {
    key: 'rooms',
    label: 'Rooms',
    path: '/rooms',
    icon: 'MdMeetingRoom',
    roles: ['owner', 'admin'],
  },
  {
    key: 'accounts',
    label: 'Accounts',
    path: '/accounts',
    icon: 'MdSupervisorAccount',
    roles: ['owner'],
  },
  {
    key: 'alerts',
    label: 'Alerts',
    path: '/alerts',
    icon: 'MdNotificationsActive',
    roles: ['owner', 'admin'],
  },
  {
    key: 'faces',
    label: 'Faces',
    path: '/faces',
    icon: 'MdFace',
  },
];
