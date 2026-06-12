import { Outlet } from 'react-router-dom';
import { SidebarNav } from '../components/dashboard/SidebarNav';

export const DashboardPage = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <SidebarNav />
      <div style={{ flex: 1, padding: '2rem', minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
};