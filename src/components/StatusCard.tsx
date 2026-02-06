import { useState, useEffect } from 'react';

interface StatusCardProps {
  icon: string;
  label: string;
  type: 'wifi' | 'firetv';
  deviceId?: string;
}

// Local dashboard API (runs on your network)
const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8765';

export default function StatusCard({ icon, label, type, deviceId }: StatusCardProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [state, setState] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      if (type === 'wifi') {
        setIsOnline(navigator.onLine);
        setState(navigator.onLine ? 'connected' : 'disconnected');
      } else if (type === 'firetv' && deviceId) {
        try {
          const res = await fetch(`${LOCAL_API_URL}/api/firetv/${deviceId}/status`, {
            mode: 'cors'
          });
          if (res.ok) {
            const data = await res.json();
            setIsOnline(data.online);
            setState(data.state || '');
          } else {
            setIsOnline(null);
            setState('unavailable');
          }
        } catch {
          // Local API not running - show as unknown
          setIsOnline(null);
          setState('no api');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000); // Check every 15s
    
    if (type === 'wifi') {
      const handleOnline = () => { setIsOnline(true); setState('connected'); };
      const handleOffline = () => { setIsOnline(false); setState('disconnected'); };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return () => clearInterval(interval);
  }, [type, deviceId]);

  // Determine indicator color based on state
  const getIndicatorClass = () => {
    if (isOnline === null) return '';
    if (!isOnline) return 'offline';
    if (state === 'on') return 'active'; // Screen is on
    if (state === 'standby') return 'online'; // On but screen off
    return 'online';
  };

  return (
    <div className="card status-card">
      <div 
        className={`status-indicator ${getIndicatorClass()}`}
        style={isOnline === null ? { background: '#666' } : {}}
      />
      <div className="status-icon">{icon}</div>
      <div className="status-label">{label}</div>
      {state && <div className="status-state">{state}</div>}
    </div>
  );
}
