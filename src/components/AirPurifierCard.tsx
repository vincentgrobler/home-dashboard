import { useState } from 'react';

interface AirPurifierState {
  isOn: boolean;
  mode: 'cooling' | 'heating' | 'airwave';
  timer: number;
  humidity: number;
}

export default function AirPurifierCard() {
  // Placeholder state - will connect to VeSync when available
  const [state, setState] = useState<AirPurifierState>({
    isOn: false,
    mode: 'cooling',
    timer: 2,
    humidity: 36
  });

  const togglePower = () => {
    setState(s => ({ ...s, isOn: !s.isOn }));
    // TODO: Connect to VeSync API when credentials available
  };

  const setMode = (mode: AirPurifierState['mode']) => {
    setState(s => ({ ...s, mode }));
    // TODO: Connect to VeSync API
  };

  return (
    <div className="card purifier-card">
      <div className="purifier-header">
        <h3 className="purifier-title">Air Purifier</h3>
        <button 
          className={`power-btn ${state.isOn ? '' : 'off'}`}
          onClick={togglePower}
        >
          ⏻
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Action</div>
      
      <div className="purifier-actions">
        <button 
          className={`action-btn ${state.mode === 'cooling' ? 'active' : ''}`}
          onClick={() => setMode('cooling')}
        >
          <span className="action-btn-icon">❄️</span>
          Cooling
        </button>
        <button 
          className={`action-btn ${state.mode === 'heating' ? 'active' : ''}`}
          onClick={() => setMode('heating')}
        >
          <span className="action-btn-icon">🔥</span>
          Heating
        </button>
        <button 
          className={`action-btn ${state.mode === 'airwave' ? 'active' : ''}`}
          onClick={() => setMode('airwave')}
        >
          <span className="action-btn-icon">💨</span>
          Airwave
        </button>
      </div>

      <div className="purifier-stats">
        <div className="stat-item">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{state.timer}</div>
          <div className="stat-label">Hours</div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">💧</div>
          <div className="stat-value">{state.humidity}</div>
          <div className="stat-label">% Humidity</div>
        </div>
      </div>
      
      {!state.isOn && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          Not connected - VeSync login required
        </div>
      )}
    </div>
  );
}
