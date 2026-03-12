import { useMemo } from 'react';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell 
} from 'recharts';

export default function DigitalTwin({ digitalTwinData, sensorData }) {
  const plants = digitalTwinData?.plants || [];
  const systemHealth = digitalTwinData?.systemHealth || 0;

  const biomassChart = useMemo(() => {
    return plants.map(p => ({
      name: p.name.split(' ').slice(0, 2).join(' '),
      biomass: Math.round(p.biomass),
      max: p.profile.maxBiomass,
      ratio: p.biomassRatio || (p.biomass / p.profile.maxBiomass),
    }));
  }, [plants]);

  const barColors = ['#4ade80', '#60a5fa', '#f87171', '#c084fc', '#fbbf24', '#22d3ee'];

  return (
    <div>
      <div className="page-header">
        <h2>🌿 Digital Twin</h2>
        <p>Plant growth simulation and biomass tracking</p>
      </div>

      {/* System Overview */}
      <div className="sensor-grid" style={{ marginBottom: '24px' }}>
        <div className="glass-card fade-in-up">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>System Health</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: systemHealth > 75 ? 'var(--green-400)' : systemHealth > 50 ? 'var(--amber-400)' : 'var(--red-400)' }}>
            {systemHealth}%
          </div>
        </div>
        <div className="glass-card fade-in-up stagger-1">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Active Plants</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--blue-400)' }}>{plants.length}</div>
        </div>
        <div className="glass-card fade-in-up stagger-2">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Avg Growth Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--cyan-400)' }}>
            {plants.length > 0 
              ? (plants.reduce((s, p) => s + (p.growthRate || 0), 0) / plants.length).toFixed(3)
              : '0.000'
            }
          </div>
        </div>
      </div>

      {/* Plant Cards */}
      <div className="twin-container">
        {plants.map((plant, idx) => {
          const progress = plant.biomassRatio || (plant.biomass / plant.profile.maxBiomass);
          const progressPct = Math.round(progress * 100);
          const stage = plant.currentStage || 'Growing';

          // Animated plant visualization
          const plantHeight = Math.max(20, progress * 100);
          const leafCount = Math.min(8, Math.floor(progress * 10));

          return (
            <div key={plant.id} className={`plant-card fade-in-up stagger-${idx + 1}`}>
              <div className="plant-header">
                <div className="plant-icon">{plant.profile.icon}</div>
                <div className="plant-info">
                  <h3>{plant.name}</h3>
                  <p>{plant.profile.name} — {plant.profile.variety}</p>
                  <span className="plant-stage-badge">{stage}</span>
                </div>
              </div>

              {/* Plant ASCII Art Visualization */}
              <div style={{ 
                textAlign: 'center', 
                padding: '16px',
                background: 'rgba(34, 197, 94, 0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontFamily: 'monospace',
                fontSize: '1.2rem',
                lineHeight: 1.4,
              }}>
                {progress > 0.8 && <div>{'🌸'.repeat(Math.min(4, leafCount))}</div>}
                {progress > 0.4 && <div>{'🌿'.repeat(Math.min(5, leafCount))}</div>}
                {progress > 0.15 && <div>{'🍃'.repeat(Math.min(3, leafCount))}</div>}
                <div>{'🌱'}</div>
                <div style={{ 
                  width: `${Math.max(40, plantHeight)}%`, 
                  height: '4px', 
                  background: 'linear-gradient(90deg, #92400e, #78350f)',
                  margin: '4px auto 0',
                  borderRadius: '2px',
                }} />
              </div>

              {/* Biomass Progress */}
              <div className="biomass-progress">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Biomass</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--green-400)', fontWeight: 600 }}>
                    {Math.round(plant.biomass)}g / {plant.profile.maxBiomass}g
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="progress-labels">
                  <span>{progressPct}% grown</span>
                  <span>Day {plant.daysSincePlanting} / ~{plant.profile.growthDays}</span>
                </div>
              </div>

              {/* Environmental Factors */}
              {plant.factors && (
                <div className="factor-bars">
                  <div className="factor-row">
                    <span className="factor-label">☀️ Light</span>
                    <div className="factor-bar-bg">
                      <div className="factor-bar-fill light" style={{ width: `${plant.factors.light * 100}%` }} />
                    </div>
                    <span className="factor-value">{Math.round(plant.factors.light * 100)}%</span>
                  </div>
                  <div className="factor-row">
                    <span className="factor-label">🌡️ Temperature</span>
                    <div className="factor-bar-bg">
                      <div className="factor-bar-fill temp" style={{ width: `${plant.factors.temperature * 100}%` }} />
                    </div>
                    <span className="factor-value">{Math.round(plant.factors.temperature * 100)}%</span>
                  </div>
                  <div className="factor-row">
                    <span className="factor-label">💧 Nutrients</span>
                    <div className="factor-bar-bg">
                      <div className="factor-bar-fill nutrient" style={{ width: `${plant.factors.nutrient * 100}%` }} />
                    </div>
                    <span className="factor-value">{Math.round(plant.factors.nutrient * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Health & Harvest */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.78rem',
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Health: </span>
                  <span style={{ 
                    color: plant.healthScore > 75 ? 'var(--green-400)' : plant.healthScore > 50 ? 'var(--amber-400)' : 'var(--red-400)',
                    fontWeight: 600,
                  }}>
                    {Math.round(plant.healthScore)}%
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Growth Rate: </span>
                  <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>
                    {(plant.growthRate || 0).toFixed(3)} g/tick
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Biomass Comparison Chart */}
      {biomassChart.length > 0 && (
        <div className="chart-card fade-in-up" style={{ marginTop: '24px' }}>
          <div className="chart-card-header">
            <span className="chart-title">Biomass Comparison</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current vs Maximum (grams)</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={biomassChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
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
              <Bar dataKey="max" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} name="Max Biomass" />
              <Bar dataKey="biomass" radius={[4, 4, 0, 0]} name="Current Biomass">
                {biomassChart.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
