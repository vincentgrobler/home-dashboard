import { useState, useEffect } from 'react';

interface StatusCardProps {
  icon: string;
  label: string;
  type: 'wifi' | 'firetv';
  deviceId?: string;
}

export default function StatusCard({ icon, label, type, deviceId }: StatusCardProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (type === 'wifi') {
        // Check internet connectivity
        setIsOnline(navigator.onLine);
      } else if (type === 'firetv') {
        // For Fire TV, we'd need a backend to check ADB status
        // For now, show as unknown until backend is connected
        // This could ping a local API endpoint that checks ADB
        try {
          // Placeholder - would need backend API
          const res = await fetch(`/api/firetv/${deviceId}/status`);
          if (res.ok) {
            const data = await res.json();
            setIsOnline(data.online);
          }
        } catch {
          // If no backend, just show as offline/unknown
          setIsOnline(null);
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    
    // Listen for online/offline events
    if (type === 'wifi') {
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }
    
    return () => clearInterval(interval);
  }, [type, deviceId]);

  return (
    <div className="card status-card">
      <div 
        className={`status-indicator ${
          isOnline === true ? 'online' : 
          isOnline === false ? 'offline' : ''
        }`}
        style={isOnline === null ? { background: '#666' } : {}}
      />
      <div className="status-icon">{icon}</div>
      <div className="status-label">{label}</div>
    </div>
  );
}
