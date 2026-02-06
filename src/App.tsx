import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <span style={{ fontSize: '24px' }}>—</span>
        <h1 className="header-date">{formatDate(currentDate)}</h1>
      </header>

      {/* Main Content Grid */}
      <div className="main-content">
        {/* Left: Weather */}
        <div className="left-column">
          <WeatherCard />
        </div>

        {/* Center: Events (Today + Tomorrow) */}
        <div className="center-column">
          <EventsCard />
        </div>

        {/* Right: Air Purifier + Energy */}
        <div className="right-column">
          <AirPurifierCard />
          <EnergyCard type="electricity" />
          <EnergyCard type="gas" />
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
