import { createBrowserRouter } from 'react-router';
import PrivateLayout from '../layouts/private';
import AccountsPage from '../pages/accounts';
import AlertsPage from '../pages/alerts';
import DashboardPage from '../pages/dashboard';
import FacesPage from '../pages/faces';
import LoginPage from '../pages/login';
import RoomsPage from '../pages/rooms';
import RoomDetailPage from '../pages/rooms/detail';
import { RequireAuth } from './RequireAuth';

const AppRoutes = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth>
        <PrivateLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'rooms', element: <RoomsPage /> },
      { path: 'rooms/:code', element: <RoomDetailPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'faces', element: <FacesPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
]);

export default AppRoutes;
