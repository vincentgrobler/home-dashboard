import { useState, useEffect } from 'react';

interface EnergyCardProps {
  type: 'electricity' | 'gas';
}

interface EnergyData {
  value: number;
  unit: string;
  chartData: number[];
}

// API credentials from environment
const API_KEY = import.meta.env.VITE_OCTOPUS_API_KEY || '';
const MPAN = import.meta.env.VITE_OCTOPUS_MPAN || '';
const ELEC_SERIAL = import.meta.env.VITE_OCTOPUS_ELEC_SERIAL || '';
const MPRN = import.meta.env.VITE_OCTOPUS_MPRN || '';
const GAS_SERIAL = import.meta.env.VITE_OCTOPUS_GAS_SERIAL || '';

export default function EnergyCard({ type }: EnergyCardProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
          const total = json.results.reduce((sum: number, r: any) => sum + r.consumption, 0);
          
          // Get chart data (last 10 periods aggregated)
          const chartData: number[] = [];
          const chunkSize = Math.max(1, Math.floor(json.results.length / 10));
          for (let i = 0; i < 10; i++) {
            const chunk = json.results.slice(i * chunkSize, (i + 1) * chunkSize);
            const chunkTotal = chunk.reduce((sum: number, r: any) => sum + r.consumption, 0);
            chartData.push(chunkTotal);
          }
          
          setData({
            value: Math.round(total),
            unit: type === 'electricity' ? 'kWh' : 'm³',
            chartData: chartData.reverse()
          });
        } else {
          setData({
            value: 0,
            unit: type === 'electricity' ? 'kWh' : 'm³',
            chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          });
        }
      } catch (e) {
        console.error('Energy fetch failed:', e);
        setData({
          value: 0,
          unit: type === 'electricity' ? 'kWh' : 'm³',
          chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        });
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
      return null;
    }

    const max = Math.max(...data.chartData);
    const points = data.chartData.map((v, i) => {
      const x = (i / 9) * 100;
      const y = 100 - (v / max) * 80;
      return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    return (
      <svg viewBox="0 0 100 100" className="energy-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill={`url(#gradient-${type})`} />
        <polyline points={points} className="chart-line" />
        {data.chartData.map((v, i) => {
          const x = (i / 9) * 100;
          const y = 100 - (v / max) * 80;
          return <circle key={i} cx={x} cy={y} r="2" className="chart-dot" />;
        })}
      </svg>
    );
  };

  return (
    <div className="card energy-card">
      <div className="energy-header">
        <h3 className="energy-title">{type === 'electricity' ? 'Electricity' : 'Gas'}</h3>
        <button className="energy-toggle" onClick={cyclePeriod}>
          {period.charAt(0).toUpperCase() + period.slice(1)} ▾
        </button>
      </div>
      
      <div className="energy-chart">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', paddingTop: '20px' }}>...</div>
        ) : (
          renderChart()
        )}
      </div>
      
      <div className="energy-value">
        {loading ? '...' : data?.value || 0}
        <span className="energy-unit">{data?.unit || 'kWh'}</span>
      </div>
    </div>
  );
}
