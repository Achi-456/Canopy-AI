import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function SensorCard({ label, value, unit, icon, color, trend, sparkData, delay }) {
  const trendLabel = trend > 0 ? `+${trend.toFixed(1)}` : trend < 0 ? trend.toFixed(1) : '0.0';
  const trendClass = trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable';
  
  const colorMap = {
    green: '#4ade80',
    blue: '#60a5fa',
    purple: '#c084fc',
    amber: '#fbbf24',
    cyan: '#22d3ee',
    red: '#f87171',
  };

  return (
    <div className={`sensor-card ${color} fade-in-up stagger-${delay || 1}`} id={`sensor-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="sensor-card-top">
        <div className={`sensor-icon ${color}`}>
          {icon}
        </div>
        <span className={`sensor-trend ${trendClass}`}>
          {trendLabel}
        </span>
      </div>
      <div className="sensor-value">
        {value !== null && value !== undefined ? value : '--'}
        <span className="sensor-unit">{unit}</span>
      </div>
      <div className="sensor-label">{label}</div>
      {sparkData && sparkData.length > 2 && (
        <div className="sensor-sparkline">
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={sparkData.slice(-20)}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={colorMap[color] || '#4ade80'} 
                strokeWidth={1.5} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
