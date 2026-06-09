import { useState } from 'react';
import { ReporteDiarioPage } from './pages/ReporteDiarioPage';
import { ProgramacionZonaPage } from './pages/ProgramacionZonaPage';
import { BrigadasDiaPage } from './pages/BrigadasDiaPage';
import './App.css';

function App() {
  const [fechaOperacional, setFechaOperacional] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'reporte' | 'programacion' | 'brigadas'>('reporte');

  return (
    <div className="App">
      {currentView === 'reporte' && (
        <ReporteDiarioPage 
          onSelectReporte={(fecha) => {
            setFechaOperacional(fecha);
            // Default to staying on reporte to allow choice, 
            // the buttons in ReporteDiarioPage will actually trigger the view change.
          }} 
          onChangeView={(view) => setCurrentView(view)}
        />
      )}
      
      {currentView === 'programacion' && fechaOperacional && (
        <ProgramacionZonaPage 
          fechaOperacional={fechaOperacional} 
          onBack={() => setCurrentView('reporte')} 
        />
      )}

      {currentView === 'brigadas' && fechaOperacional && (
        <BrigadasDiaPage
          fechaOperacional={fechaOperacional}
          onBack={() => setCurrentView('reporte')}
        />
      )}
    </div>
  );
}

export default App;
