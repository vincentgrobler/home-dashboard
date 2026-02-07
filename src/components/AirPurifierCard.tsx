import { useState, useEffect } from 'react';

interface PurifierData {
  name: string;
  type: string;
  power: boolean;
  mode: string | null;
  fan_level: number;
  filter_life: number;
  display: boolean;
  supports_air_quality: boolean;
  air_quality: number | null;
  error?: string;
}

// API endpoint - adjust if running elsewhere
const API_URL = import.meta.env.VITE_DASHBOARD_API_URL || 'http://localhost:5555';

export default function AirPurifierCard() {
  const [data, setData] = useState<PurifierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/purifier`);
      const json = await res.json();
      
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        setError(null);
      }
    } catch (e) {
      setError('Cannot connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getModeIcon = (mode: string | null) => {
    switch (mode) {
      case 'sleep': return '🌙';
      case 'manual': return '⚙️';
      case 'auto': return '🔄';
      default: return '💨';
    }
  };

  const getFilterColor = (pct: number) => {
    if (pct > 50) return '#4ade80'; // green
    if (pct > 20) return '#facc15'; // yellow
    return '#f87171'; // red
  };

  const getFanBars = (level: number) => {
    return [1, 2, 3].map(i => (
      <div
        key={i}
        className={`fan-bar ${i <= level ? 'active' : ''}`}
        style={{
          height: `${8 + i * 4}px`,
          backgroundColor: i <= level ? 'var(--accent)' : 'rgba(255,255,255,0.2)'
        }}
      />
    ));
  };

  if (loading) {
    return (
      <div className="card purifier-card-compact">
        <div className="purifier-header">
          <h3 className="purifier-title">🌬️ Air Purifier</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card purifier-card-compact">
        <div className="purifier-header">
          <h3 className="purifier-title">🌬️ Air Purifier</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '12px' }}>
          {error || 'No data'}
          <br />
          <small style={{ opacity: 0.6 }}>Start dashboard_api.py</small>
        </div>
      </div>
    );
  }

  return (
    <div className="card purifier-card-compact">
      <div className="purifier-header">
        <h3 className="purifier-title">
          🌬️ {data.type || 'Air Purifier'}
        </h3>
        <div className={`power-indicator ${data.power ? 'on' : 'off'}`}>
          {data.power ? '●' : '○'}
        </div>
      </div>

      <div className="purifier-stats-compact">
        <div className="stat-mini">
          <span className="stat-val">{getModeIcon(data.mode)}</span>
          <span className="stat-lbl">{data.mode || 'Off'}</span>
        </div>
        
        <div className="stat-mini">
          <div className="fan-bars">
            {getFanBars(data.fan_level)}
          </div>
          <span className="stat-lbl">Speed {data.fan_level}</span>
        </div>
        
        <div className="stat-mini">
          <span 
            className="stat-val" 
            style={{ color: getFilterColor(data.filter_life) }}
          >
            {data.filter_life}%
          </span>
          <span className="stat-lbl">Filter</span>
        </div>
      </div>

      {!data.power && (
        <div className="purifier-overlay">
          Purifier is off
        </div>
      )}
    </div>
  );
}
