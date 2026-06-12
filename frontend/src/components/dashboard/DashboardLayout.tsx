import type { ReactNode } from 'react';
export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', minWidth: 0 }}>
      {children}
    </div>
  );
};
