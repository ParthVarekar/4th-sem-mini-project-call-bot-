import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Transcripts } from './components/Transcripts';
import { Insights } from './components/Insights';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Rewards } from './components/Rewards';
import { ComboMeals } from './components/ComboMeals';
import { HolidaySchedule } from './components/HolidaySchedule';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'transcripts':
        return <Transcripts />;
      case 'insights':
        return <Insights onNavigate={setActiveTab} />;
      case 'settings':
        return <Settings />;
      case 'rewards':
        return <Rewards />;
      case 'combos':
        return <ComboMeals />;
      case 'holidays':
        return <HolidaySchedule />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setIsAuthenticated(false)}>
      {renderContent()}
    </Layout>
  );
};

export default App;
