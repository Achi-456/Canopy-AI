import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import DigitalTwin from './pages/DigitalTwin';
import AIInsights from './pages/AIInsights';
import Controls from './pages/Controls';
import Plants from './pages/Plants';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const { sensorData, digitalTwinData, controls, aiRecommendation, connected, sensorHistory } = useWebSocket();

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard sensorData={sensorData} sensorHistory={sensorHistory} digitalTwinData={digitalTwinData} />;
      case 'digital-twin':
        return <DigitalTwin digitalTwinData={digitalTwinData} sensorData={sensorData} />;
      case 'ai-insights':
        return <AIInsights aiRecommendation={aiRecommendation} sensorData={sensorData} />;
      case 'controls':
        return <Controls controls={controls} />;
      case 'plants':
        return <Plants digitalTwinData={digitalTwinData} />;
      default:
        return <Dashboard sensorData={sensorData} sensorHistory={sensorHistory} digitalTwinData={digitalTwinData} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} connected={connected} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
