import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { ReporteGerencialPage } from './pages/ReporteGerencialPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InicioDiaDashboardView } from './components/inicio-dia/InicioDiaDashboardView';
import { ResumenGeneralPanel } from './components/resumen-general/ResumenGeneralPanel';
import { ResumenZonaDashboardView } from './components/resumen-zona/ResumenZonaDashboardView';
import { SupervisorBitacoraView } from './components/supervisor/SupervisorBitacoraView';
import { RendimientoTecnicoDashboardView } from './components/rendimiento/RendimientoTecnicoDashboardView';
import './App.css';

const AppContent = () => {
  const { user } = useAuth();
  const [fechaOperacional, setFechaOperacional] = useState<string>('');

  useEffect(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0];
    setFechaOperacional(localISOTime);
  }, []);

  if (!fechaOperacional) return null;

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reporte-gerencial" element={<ReporteGerencialPage />} />

        {/* Default route redirect */}
        <Route path="/" element={<Navigate to={user ? (user.rol === 'supervisor' ? '/supervisor/bitacora' : user.rol === 'torre_control' ? '/torre-control/dashboard-cyr' : '/torre-control/inicio-dia') : '/login'} replace />} />

        {/* Dashboard Layout Routes */}
        <Route element={<DashboardPage />}>
          
          <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'torre_control']} />}>
            <Route path="/torre-control/dashboard-cyr" element={<ResumenGeneralPanel fechaOperacional={fechaOperacional} onChangeFecha={setFechaOperacional} activeSection="resumen-general" onChangeSection={() => {}} />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'torre_control', 'gerencia', 'supervisor']} />}>
            <Route path="/torre-control/resumen-zona" element={<ResumenZonaDashboardView fechaOperacional={fechaOperacional} onChangeFecha={setFechaOperacional} activeSection="resumen-zona" onChangeSection={() => {}} />} />
            <Route path="/torre-control/rendimiento-tecnico" element={<RendimientoTecnicoDashboardView fechaOperacional={fechaOperacional} onChangeFecha={setFechaOperacional} activeSection="rendimiento-tecnico" onChangeSection={() => {}} />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
            <Route path="/torre-control/inicio-dia" element={<InicioDiaDashboardView fechaOperacional={fechaOperacional} onChangeFecha={setFechaOperacional} activeSection="inicio-dia" onChangeSection={() => {}} />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'supervisor']} />}>
            <Route path="/supervisor/bitacora" element={<SupervisorBitacoraView fechaOperacional={fechaOperacional} onChangeFecha={setFechaOperacional} activeSection="supervisor-cyr" onChangeSection={() => {}} />} />
          </Route>

        </Route>
      </Routes>
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;

