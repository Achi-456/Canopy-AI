import { useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, ResponsiveContainer, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { Thermometer, Droplets, Sun, FlaskConical, Zap, Waves } from 'lucide-react';
import SensorCard from '../components/SensorCard';

export default function Dashboard({ sensorData, sensorHistory, digitalTwinData }) {
  const sensorCards = useMemo(() => {
    if (!sensorData) return [];
    return [
      {
        label: 'Temperature',
        value: sensorData.temperature,
        unit: '°C',
        icon: <Thermometer size={20} />,
        color: 'red',
        key: 'temperature',
      },
      {
        label: 'Humidity',
        value: sensorData.humidity,
        unit: '%',
        icon: <Droplets size={20} />,
        color: 'blue',
        key: 'humidity',
      },
      {
        label: 'Light Intensity',
        value: sensorData.lightIntensity,
        unit: 'lux',
        icon: <Sun size={20} />,
        color: 'amber',
        key: 'lightIntensity',
      },
      {
        label: 'pH Level',
        value: sensorData.pH,
        unit: 'pH',
        icon: <FlaskConical size={20} />,
        color: 'purple',
        key: 'pH',
      },
      {
        label: 'EC Level',
        value: sensorData.ec,
        unit: 'mS/cm',
        icon: <Zap size={20} />,
        color: 'cyan',
        key: 'ec',
      },
      {
        label: 'Water Level',
        value: sensorData.waterLevel,
        unit: '%',
        icon: <Waves size={20} />,
        color: 'green',
        key: 'waterLevel',
      },
    ];
  }, [sensorData]);

  const prevValues = useMemo(() => {
    if (sensorHistory.length < 2) return {};
    const prev = sensorHistory[sensorHistory.length - 2];
    return prev || {};
  }, [sensorHistory]);

  const chartData = useMemo(() => {
    return sensorHistory.map((d, i) => ({
      idx: i,
      temp: d.temperature,
      humidity: d.humidity,
      light: d.lightIntensity,
      pH: d.pH,
      ec: d.ec,
      water: d.waterLevel,
      time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
  }, [sensorHistory]);

  const systemHealth = digitalTwinData?.systemHealth || 0;
  const plantsCount = digitalTwinData?.plants?.length || 0;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Real-time environmental monitoring and system overview</p>
      </div>

      {/* Quick Stats */}
      <div className="sensor-grid" style={{ marginBottom: '20px' }}>
        <div className="glass-card fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.2rem' }}>🌱</div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-400)' }}>{plantsCount}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Active Plants</div>
          </div>
        </div>
        <div className="glass-card fade-in-up stagger-1" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.2rem' }}>💚</div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--green-400)' }}>{systemHealth}%</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>System Health</div>
          </div>
        </div>
        <div className="glass-card fade-in-up stagger-2" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.2rem' }}>📊</div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--blue-400)' }}>{sensorHistory.length}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Data Points</div>
          </div>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="sensor-grid">
        {sensorCards.map((card, i) => {
          const trend = prevValues[card.key] !== undefined 
            ? card.value - prevValues[card.key] 
            : 0;
          const sparkData = sensorHistory.map(d => ({ value: d[card.key] }));

          return (
            <SensorCard
              key={card.key}
              label={card.label}
              value={card.value}
              unit={card.unit}
              icon={card.icon}
              color={card.color}
              trend={trend}
              sparkData={sparkData}
              delay={i + 1}
            />
          );
        })}
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="chart-card fade-in-up">
          <div className="chart-card-header">
            <span className="chart-title">Temperature & Humidity</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Last {chartData.length} readings
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.8rem'
                }} 
              />
              <Area type="monotone" dataKey="temp" stroke="#f87171" fill="url(#tempGrad)" strokeWidth={2} name="Temperature (°C)" />
              <Area type="monotone" dataKey="humidity" stroke="#60a5fa" fill="url(#humGrad)" strokeWidth={2} name="Humidity (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card fade-in-up">
          <div className="chart-card-header">
            <span className="chart-title">pH & EC Levels</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Nutrient monitoring
            </span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(17, 24, 39, 0.95)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '0.8rem'
                }} 
              />
              <Line type="monotone" dataKey="pH" stroke="#c084fc" strokeWidth={2} dot={false} name="pH" />
              <Line type="monotone" dataKey="ec" stroke="#22d3ee" strokeWidth={2} dot={false} name="EC (mS/cm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Light & Water Chart */}
      <div className="chart-card fade-in-up" style={{ marginBottom: '24px' }}>
        <div className="chart-card-header">
          <span className="chart-title">Light Intensity & Water Level</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(17, 24, 39, 0.95)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '0.8rem'
              }} 
            />
            <Area type="monotone" dataKey="light" stroke="#fbbf24" fill="url(#lightGrad)" strokeWidth={2} name="Light (lux)" />
            <Area type="monotone" dataKey="water" stroke="#4ade80" fill="url(#waterGrad)" strokeWidth={2} name="Water Level (%)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
