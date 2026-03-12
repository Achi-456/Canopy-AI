import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Sun, Droplets, Zap, Power, Clock, ToggleLeft } from 'lucide-react';

export default function Controls({ controls: wsControls }) {
  const { post, loading } = useApi();
  const [controls, setControls] = useState({
    ledIntensity: 70,
    pumpActive: false,
    nutrientDosing: 3,
    irrigationInterval: 60,
    irrigationDuration: 30,
    autoMode: true,
  });

  useEffect(() => {
    if (wsControls) setControls(wsControls);
  }, [wsControls]);

  const updateControl = async (key, value) => {
    const updated = { ...controls, [key]: value };
    setControls(updated);
    try {
      await post('/controls/update', updated);
    } catch (err) {
      console.error('Failed to update control:', err);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🎛️ Controls</h2>
          <p>Manage LED lighting, irrigation, and nutrient systems</p>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '8px 16px', borderRadius: 'var(--radius-md)',
          background: controls.autoMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
          border: `1px solid ${controls.autoMode ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)'}`,
        }}>
          <ToggleLeft size={16} style={{ color: controls.autoMode ? 'var(--green-400)' : 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: controls.autoMode ? 'var(--green-400)' : 'var(--text-muted)' }}>
            {controls.autoMode ? 'Auto Mode' : 'Manual Mode'}
          </span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={controls.autoMode} 
              onChange={(e) => updateControl('autoMode', e.target.checked)}
              id="auto-mode-toggle"
            />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>
        </div>
      </div>

      <div className="controls-grid">
        {/* LED Control */}
        <div className="control-card fade-in-up">
          <div className="control-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(251, 191, 36, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#fbbf24',
              }}>
                <Sun size={20} />
              </div>
              <h3>LED Grow Lights</h3>
            </div>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%',
              background: controls.ledIntensity > 0 ? '#fbbf24' : '#64748b',
              boxShadow: controls.ledIntensity > 0 ? '0 0 10px #fbbf24' : 'none',
            }} />
          </div>

          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-label">Intensity</span>
              <span className="slider-value">{controls.ledIntensity}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={controls.ledIntensity}
              onChange={(e) => updateControl('ledIntensity', parseInt(e.target.value))}
              disabled={controls.autoMode}
              id="led-intensity-slider"
              style={{ 
                background: `linear-gradient(to right, #fbbf24 ${controls.ledIntensity}%, rgba(255,255,255,0.1) ${controls.ledIntensity}%)` 
              }}
            />
          </div>

          {/* Visual LED indicator */}
          <div style={{ 
            height: '6px', borderRadius: '3px', marginTop: '12px',
            background: `linear-gradient(90deg, rgba(251,191,36,${controls.ledIntensity / 100 * 0.8}) 0%, rgba(251,191,36,${controls.ledIntensity / 100 * 0.3}) 100%)`,
            boxShadow: `0 0 ${controls.ledIntensity / 5}px rgba(251,191,36,${controls.ledIntensity / 100 * 0.5})`,
          }} />
        </div>

        {/* Water Pump Control */}
        <div className="control-card fade-in-up stagger-1">
          <div className="control-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(96, 165, 250, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
              }}>
                <Droplets size={20} />
              </div>
              <h3>Water Pump</h3>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={controls.pumpActive} 
                onChange={(e) => updateControl('pumpActive', e.target.checked)}
                disabled={controls.autoMode}
                id="pump-toggle"
              />
              <span className="toggle-track" />
              <span className="toggle-thumb" />
            </label>
          </div>

          <div style={{ 
            textAlign: 'center', padding: '20px', marginTop: '8px',
            borderRadius: 'var(--radius-md)',
            background: controls.pumpActive ? 'rgba(96, 165, 250, 0.06)' : 'var(--bg-glass)',
          }}>
            <Power size={32} style={{ 
              color: controls.pumpActive ? '#60a5fa' : '#64748b',
              transition: 'color 0.3s ease',
            }} />
            <div style={{ 
              fontSize: '0.85rem', fontWeight: 600, marginTop: '8px',
              color: controls.pumpActive ? '#60a5fa' : '#64748b',
            }}>
              {controls.pumpActive ? 'RUNNING' : 'STANDBY'}
            </div>
          </div>
        </div>

        {/* Nutrient Dosing */}
        <div className="control-card fade-in-up stagger-2">
          <div className="control-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(34, 211, 238, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#22d3ee',
              }}>
                <Zap size={20} />
              </div>
              <h3>Nutrient Dosing</h3>
            </div>
          </div>

          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-label">Dosage</span>
              <span className="slider-value" style={{ color: '#22d3ee' }}>{controls.nutrientDosing} ml/cycle</span>
            </div>
            <input 
              type="range" 
              min="0" max="10" step="0.5"
              value={controls.nutrientDosing}
              onChange={(e) => updateControl('nutrientDosing', parseFloat(e.target.value))}
              disabled={controls.autoMode}
              id="nutrient-dosing-slider"
              style={{ 
                background: `linear-gradient(to right, #22d3ee ${controls.nutrientDosing * 10}%, rgba(255,255,255,0.1) ${controls.nutrientDosing * 10}%)` 
              }}
            />
          </div>

          {/* Dosing visualization */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '12px', justifyContent: 'center' }}>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ 
                width: '8px', height: '24px', borderRadius: '4px',
                background: i < controls.nutrientDosing 
                  ? `rgba(34, 211, 238, ${0.3 + i * 0.07})` 
                  : 'rgba(255,255,255,0.05)',
                transition: 'background 0.2s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Irrigation Schedule */}
        <div className="control-card fade-in-up stagger-3">
          <div className="control-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(34, 197, 94, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#4ade80',
              }}>
                <Clock size={20} />
              </div>
              <h3>Irrigation Schedule</h3>
            </div>
          </div>

          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-label">Interval</span>
              <span className="slider-value" style={{ color: '#4ade80' }}>Every {controls.irrigationInterval} min</span>
            </div>
            <input 
              type="range" 
              min="15" max="180" step="15"
              value={controls.irrigationInterval}
              onChange={(e) => updateControl('irrigationInterval', parseInt(e.target.value))}
              disabled={controls.autoMode}
              id="irrigation-interval-slider"
              style={{ 
                background: `linear-gradient(to right, #4ade80 ${((controls.irrigationInterval - 15) / 165) * 100}%, rgba(255,255,255,0.1) ${((controls.irrigationInterval - 15) / 165) * 100}%)` 
              }}
            />
          </div>

          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-label">Duration</span>
              <span className="slider-value" style={{ color: '#4ade80' }}>{controls.irrigationDuration}s</span>
            </div>
            <input 
              type="range" 
              min="5" max="120" step="5"
              value={controls.irrigationDuration}
              onChange={(e) => updateControl('irrigationDuration', parseInt(e.target.value))}
              disabled={controls.autoMode}
              id="irrigation-duration-slider"
              style={{ 
                background: `linear-gradient(to right, #4ade80 ${((controls.irrigationDuration - 5) / 115) * 100}%, rgba(255,255,255,0.1) ${((controls.irrigationDuration - 5) / 115) * 100}%)` 
              }}
            />
          </div>
        </div>
      </div>

      {controls.autoMode && (
        <div className="alert-card success fade-in-up" style={{ marginTop: '24px', justifyContent: 'center' }}>
          <span>🤖 Auto Mode Active — AI is managing all controls based on real-time sensor data and optimization recommendations</span>
        </div>
      )}
    </div>
  );
}
