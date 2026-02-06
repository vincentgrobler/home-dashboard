import { useState } from 'react';

export default function AirPurifierCard() {
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<'cooling' | 'heating' | 'airwave'>('cooling');

  return (
    <div className="card purifier-card-compact">
      <div className="purifier-header">
        <h3 className="purifier-title">Air Purifier</h3>
        <button 
          className={`power-btn ${isOn ? '' : 'off'}`}
          onClick={() => setIsOn(!isOn)}
        >
          ⏻
        </button>
      </div>

      <div className="purifier-actions-compact">
        <button 
          className={`action-btn-sm ${mode === 'cooling' ? 'active' : ''}`}
          onClick={() => setMode('cooling')}
        >
          ❄️
        </button>
        <button 
          className={`action-btn-sm ${mode === 'heating' ? 'active' : ''}`}
          onClick={() => setMode('heating')}
        >
          🔥
        </button>
        <button 
          className={`action-btn-sm ${mode === 'airwave' ? 'active' : ''}`}
          onClick={() => setMode('airwave')}
        >
          💨
        </button>
      </div>

      <div className="purifier-stats-compact">
        <div className="stat-mini">
          <span className="stat-val">2h</span>
          <span className="stat-lbl">Timer</span>
        </div>
        <div className="stat-mini">
          <span className="stat-val">36%</span>
          <span className="stat-lbl">Humidity</span>
        </div>
      </div>
      
      {!isOn && (
        <div className="purifier-overlay">
          VeSync login required
        </div>
      )}
    </div>
  );
}
