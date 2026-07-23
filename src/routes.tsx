import DashboardPage from './pages/DashboardPage';
import LiveFeedsPage from './pages/LiveFeedsPage';
import LiveHSRPDetectionPage from './pages/LiveHSRPDetectionPage';
import ViolationsPage from './pages/ViolationsPage';
import VehiclesPage from './pages/VehiclesPage';
import CamerasPage from './pages/CamerasPage';
import PaymentsPage from './pages/PaymentsPage';
import AdminPage from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Dashboard',
    path: '/',
    element: <DashboardPage />,
  },
  {
    name: 'Live Feeds',
    path: '/live-feeds',
    element: <LiveFeedsPage />,
  },
  {
    name: 'Live HSRP Detection',
    path: '/live-detection',
    element: <LiveHSRPDetectionPage />,
  },
  {
    name: 'Violations',
    path: '/violations',
    element: <ViolationsPage />,
  },
  {
    name: 'Vehicles',
    path: '/vehicles',
    element: <VehiclesPage />,
  },
  {
    name: 'Cameras',
    path: '/cameras',
    element: <CamerasPage />,
  },
  {
    name: 'Payments',
    path: '/payments',
    element: <PaymentsPage />,
  },
  {
    name: 'Admin Panel',
    path: '/admin',
    element: <AdminPage />,
  },
  {
    name: 'Settings',
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    visible: false,
  },
];

export default routes;
