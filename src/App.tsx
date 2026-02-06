import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import WeatherCard from './components/WeatherCard';
import EventsCard from './components/EventsCard';
import AirPurifierCard from './components/AirPurifierCard';
import EnergyCard from './components/EnergyCard';
import StatusCard from './components/StatusCard';
import VikiOrb from './components/VikiOrb';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
    setLastRefresh(new Date());
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    // Update date every minute
    const dateTimer = setInterval(() => setCurrentDate(new Date()), 60000);
    
    // Auto-refresh every 15 minutes
    const refreshTimer = setInterval(() => {
      handleRefresh();
    }, 15 * 60 * 1000);
    
    return () => {
      clearInterval(dateTimer);
      clearInterval(refreshTimer);
    };
  }, [handleRefresh]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <span style={{ fontSize: '24px' }}>—</span>
        <h1 className="header-date">{formatDate(currentDate)}</h1>
        <div className="header-spacer" />
        <button className="refresh-btn" onClick={handleRefresh} title="Refresh dashboard">
          🔄
        </button>
        <span className="last-refresh">
          {formatTime(lastRefresh)}
        </span>
      </header>

      {/* Main Content Grid */}
      <div className="main-content">
        {/* Left: Weather */}
        <div className="left-column">
          <WeatherCard key={`weather-${refreshKey}`} />
        </div>

        {/* Center: Events (Today + Tomorrow) */}
        <div className="center-column">
          <EventsCard key={`events-${refreshKey}`} />
        </div>

        {/* Right: Air Purifier + Energy */}
        <div className="right-column">
          <AirPurifierCard />
          <EnergyCard key={`elec-${refreshKey}`} type="electricity" />
          <EnergyCard key={`gas-${refreshKey}`} type="gas" />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <motion.div 
          className="viki-orb-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <VikiOrb />
        </motion.div>
        
        <div className="status-cards">
          <StatusCard icon="📡" label="Wi-Fi" type="wifi" />
          <StatusCard icon="📺" label="MainTV" type="firetv" deviceId="main" />
          <StatusCard icon="📺" label="TV Bedroom" type="firetv" deviceId="bedroom" />
        </div>
      </div>
    </div>
  );
}

export default App;
