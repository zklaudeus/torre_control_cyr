import { useState, useEffect } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

function App() {
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
      <DashboardPage
        fechaOperacional={fechaOperacional}
        onChangeFecha={setFechaOperacional}
      />
    </div>
  );
}

export default App;
