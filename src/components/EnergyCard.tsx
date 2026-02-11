import { useState, useCallback } from 'react';
import { useCache } from '../hooks/useCache';
import { fetchEnergyData } from '../utils/api';
import type { EnergyData } from '../types';

interface EnergyCardProps {
  type: 'electricity' | 'gas';
}

export default function EnergyCard({ type }: EnergyCardProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  
  const fetcher = useCallback(() => fetchEnergyData(type, period), [type, period]);
  const { data, loading } = useCache<EnergyData>(`energy-${type}-${period}`, fetcher, 300000); // 5 min cache

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
        {loading && !data ? (
          <div style={{ textAlign: 'center', color: '#888', height: 50 }}>...</div>
        ) : (
          renderChart()
        )}
      </div>
      
      <div className="energy-values">
        <div className="energy-value">
          {loading && !data ? '...' : data?.value || 0}
          <span className="energy-unit">{data?.unit || 'kWh'}</span>
        </div>
        <div className="energy-cost">
          £{loading && !data ? '...' : data?.cost?.toFixed(2) || '0.00'}
        </div>
      </div>
    </div>
  );
}
