import { useState, useEffect } from 'react';

interface EnergyCardProps {
  type: 'electricity' | 'gas';
}

interface EnergyData {
  value: number;
  cost: number;
  unit: string;
  chartData: number[];
}

// API credentials from environment
const API_KEY = import.meta.env.VITE_OCTOPUS_API_KEY || '';
const MPAN = import.meta.env.VITE_OCTOPUS_MPAN || '';
const ELEC_SERIAL = import.meta.env.VITE_OCTOPUS_ELEC_SERIAL || '';
const MPRN = import.meta.env.VITE_OCTOPUS_MPRN || '';
const GAS_SERIAL = import.meta.env.VITE_OCTOPUS_GAS_SERIAL || '';

// Rates
const ELEC_RATE = 0.2450;
const GAS_RATE = 0.0614;
const GAS_CONVERSION = 11.1868; // m³ to kWh

export default function EnergyCard({ type }: EnergyCardProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!API_KEY) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const periods = period === 'day' ? 48 : period === 'week' ? 336 : 1440;
        const endpoint = type === 'electricity'
          ? `https://api.octopus.energy/v1/electricity-meter-points/${MPAN}/meters/${ELEC_SERIAL}/consumption/?page_size=${periods}`
          : `https://api.octopus.energy/v1/gas-meter-points/${MPRN}/meters/${GAS_SERIAL}/consumption/?page_size=${periods}`;

        const res = await fetch(endpoint, {
          headers: {
            'Authorization': 'Basic ' + btoa(API_KEY + ':')
          }
        });
        
        const json = await res.json();
        
        if (json.results && json.results.length > 0) {
          let total = json.results.reduce((sum: number, r: any) => sum + r.consumption, 0);
          
          // Convert gas m³ to kWh
          if (type === 'gas') {
            total = total * GAS_CONVERSION;
          }
          
          // Calculate cost
          const rate = type === 'electricity' ? ELEC_RATE : GAS_RATE;
          const cost = total * rate;
          
          // Get chart data (10 points, smoothed)
          const chartData: number[] = [];
          const chunkSize = Math.max(1, Math.floor(json.results.length / 10));
          for (let i = 0; i < 10; i++) {
            const chunk = json.results.slice(i * chunkSize, (i + 1) * chunkSize);
            let chunkTotal = chunk.reduce((sum: number, r: any) => sum + r.consumption, 0);
            if (type === 'gas') chunkTotal *= GAS_CONVERSION;
            chartData.push(chunkTotal);
          }
          
          setData({
            value: Math.round(total),
            cost: Math.round(cost * 100) / 100,
            unit: 'kWh',
            chartData: chartData.reverse()
          });
        } else {
          setData({
            value: 0,
            cost: 0,
            unit: 'kWh',
            chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          });
        }
      } catch (e) {
        console.error('Energy fetch failed:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, period]);

  const cyclePeriod = () => {
    setPeriod(p => p === 'day' ? 'week' : p === 'week' ? 'month' : 'day');
  };

  const renderChart = () => {
    if (!data || data.chartData.every(v => v === 0)) {
      return <div style={{ height: 50 }} />;
    }

    const max = Math.max(...data.chartData);
    const min = Math.min(...data.chartData);
    const range = max - min || 1;
    const width = 100;
    const height = 50;
    const padding = 8;
    
    // Create points with better vertical distribution
    const points = data.chartData.map((v, i) => ({
      x: (i / (data.chartData.length - 1)) * width,
      y: padding + (1 - (v - min) / range) * (height - padding * 2)
    }));
    
    // Generate smooth cubic bezier path
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Catmull-Rom to Bezier conversion for smooth curves
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    // Area path for gradient fill
    const areaPath = path + ` L ${width},${height} L 0,${height} Z`;
    
    // First point for indicator (keeping for reference but not rendering)
    // const firstPoint = points[0];

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 50 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`area-gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Gradient fill under curve */}
        <path d={areaPath} fill={`url(#area-gradient-${type})`} />
        {/* Glowing line */}
        <path 
          d={path} 
          fill="none" 
          stroke="var(--accent)" 
          strokeWidth="2.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${type})`}
        />
        {/* Single indicator dot at start */}
      </svg>
    );
  };

  return (
    <div className="card energy-card-compact">
      <div className="energy-header">
        <h3 className="energy-title">{type === 'electricity' ? 'Electricity' : 'Gas'}</h3>
        <button className="energy-toggle" onClick={cyclePeriod}>
          {period.charAt(0).toUpperCase() + period.slice(1)} ▾
        </button>
      </div>
      
      <div className="energy-chart">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', height: 50 }}>...</div>
        ) : (
          renderChart()
        )}
      </div>
      
      <div className="energy-values">
        <div className="energy-value">
          {loading ? '...' : data?.value || 0}
          <span className="energy-unit">{data?.unit || 'kWh'}</span>
        </div>
        <div className="energy-cost">
          £{loading ? '...' : data?.cost?.toFixed(2) || '0.00'}
        </div>
      </div>
    </div>
  );
}
