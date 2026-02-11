import { useCache } from '../hooks/useCache';
import { fetchPurifierData } from '../utils/api';
import type { PurifierData } from '../types';

export default function AirPurifierCard() {
  // Use cache with 60s TTL (matches device refresh rate)
  const { data, loading, error } = useCache<PurifierData>('purifier-status', fetchPurifierData, 60000);

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

  if (loading && !data) {
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

  // Handle both explicit error and null data (API down)
  if (error || !data) {
    return (
      <div className="card purifier-card-compact">
        <div className="purifier-header">
          <h3 className="purifier-title">🌬️ Air Purifier</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '12px' }}>
          {error?.message || 'No data'}
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
