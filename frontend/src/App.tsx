import { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { ReporteGerencialPage } from './pages/ReporteGerencialPage';
import './App.css';

function App() {
  const [fechaOperacional, setFechaOperacional] = useState<string>('');
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);

  useEffect(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0];
    setFechaOperacional(localISOTime);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setCurrentRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!fechaOperacional) return null;

  // Standalone reporte gerencial page (no sidebar)
  if (currentRoute === '#/reporte-gerencial') {
    return <ReporteGerencialPage />;
  }

  return (
    <div className="App">
      <DashboardPage
        fechaOperacional={fechaOperacional}
        onChangeFecha={setFechaOperacional}
      />
    </div>
  );
}

export default App;

