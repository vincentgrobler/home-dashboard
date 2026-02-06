import { useState } from 'react';

interface AirPurifierState {
  isOn: boolean;
  mode: 'cooling' | 'heating' | 'airwave';
}

export default function AirPurifierCard() {
  const [state, setState] = useState<AirPurifierState>({
    isOn: false,
    mode: 'cooling',
  });

  const togglePower = () => {
    setState(s => ({ ...s, isOn: !s.isOn }));
  };

  const setMode = (mode: AirPurifierState['mode']) => {
    setState(s => ({ ...s, mode }));
  };

  return (
    <div className="card purifier-card-compact">
      <div className="purifier-header">
        <h3 className="purifier-title">Air Purifier</h3>
        <button 
          className={`power-btn-small ${state.isOn ? '' : 'off'}`}
          onClick={togglePower}
        >
          ⏻
        </button>
      </div>

      <div className="purifier-actions-compact">
        <button 
          className={`action-btn-small ${state.mode === 'cooling' ? 'active' : ''}`}
          onClick={() => setMode('cooling')}
        >
          ❄️
        </button>
        <button 
          className={`action-btn-small ${state.mode === 'heating' ? 'active' : ''}`}
          onClick={() => setMode('heating')}
        >
          🔥
        </button>
        <button 
          className={`action-btn-small ${state.mode === 'airwave' ? 'active' : ''}`}
          onClick={() => setMode('airwave')}
        >
          💨
        </button>
      </div>
      
      {!state.isOn && (
        <div className="purifier-overlay">
          Not connected
        </div>
      )}
    </div>
  );
}
