import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Trash2, Leaf } from 'lucide-react';

export default function Plants({ digitalTwinData }) {
  const { get, post, loading } = useApi();
  const [plants, setPlants] = useState([]);
  const [cropProfiles, setCropProfiles] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlant, setNewPlant] = useState({ cropType: 'lettuce', name: '' });

  useEffect(() => {
    get('/digital-twin/crops').then(res => {
      if (res.data) setCropProfiles(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (digitalTwinData?.plants) {
      setPlants(digitalTwinData.plants);
    }
  }, [digitalTwinData]);

  const addPlant = async () => {
    if (!newPlant.name.trim()) return;
    try {
      await post('/plants', newPlant);
      setNewPlant({ cropType: 'lettuce', name: '' });
      setShowAddForm(false);
      // Refresh
      const res = await get('/plants');
      if (res.data) setPlants(res.data);
    } catch (err) {
      console.error('Failed to add plant:', err);
    }
  };

  const removePlant = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/plants/${id}`, { method: 'DELETE' });
      setPlants(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to remove plant:', err);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🌿 Plants</h2>
          <p>Manage your hydroponic crop catalog and active plants</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(!showAddForm)}
          id="add-plant-btn"
        >
          <Plus size={16} />
          Add Plant
        </button>
      </div>

      {/* Add Plant Form */}
      {showAddForm && (
        <div className="glass-card fade-in-up" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '16px' }}>Add New Plant</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={newPlant.cropType}
              onChange={(e) => setNewPlant({ ...newPlant, cropType: e.target.value })}
              id="crop-type-select"
              style={{ 
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-glass)', border: '1px solid var(--border-normal)',
                color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem',
                outline: 'none', cursor: 'pointer', minWidth: '160px',
              }}
            >
              {Object.entries(cropProfiles).map(([key, profile]) => (
                <option key={key} value={key} style={{ background: '#111827' }}>
                  {profile.icon} {profile.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Plant name (e.g., Lettuce Bed B)"
              value={newPlant.name}
              onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
              id="plant-name-input"
              style={{ 
                flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-glass)', border: '1px solid var(--border-normal)',
                color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem',
                outline: 'none', minWidth: '200px',
              }}
            />
            <button className="btn btn-primary" onClick={addPlant} disabled={loading} id="confirm-add-plant">
              Add
            </button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Crop Catalog */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
          Available Crops
        </h3>
        <div className="plants-grid">
          {Object.entries(cropProfiles).map(([key, profile], i) => (
            <div key={key} className={`crop-catalog-item fade-in-up stagger-${i + 1}`}>
              <div className="crop-emoji">{profile.icon}</div>
              <div className="crop-name">{profile.name}</div>
              <div className="crop-variety">{profile.variety}</div>
              <div className="crop-details">
                <span className="crop-detail-badge">🗓️ {profile.growthDays} days</span>
                <span className="crop-detail-badge">📏 {profile.maxBiomass}g max</span>
                <span className="crop-detail-badge">🌡️ {profile.optimalTemp[0]}-{profile.optimalTemp[1]}°C</span>
                <span className="crop-detail-badge">💧 pH {profile.optimalPH[0]}-{profile.optimalPH[1]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Plants */}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
        Active Plants ({plants.length})
      </h3>
      <div className="plants-grid">
        {plants.map((plant, i) => {
          const progress = plant.biomassRatio || (plant.biomass / plant.profile.maxBiomass);
          const progressPct = Math.round(progress * 100);

          return (
            <div key={plant.id} className={`glass-card fade-in-up stagger-${(i % 6) + 1}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{plant.profile.icon}</span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{plant.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {plant.profile.name} • Day {plant.daysSincePlanting}
                    </p>
                  </div>
                </div>
                <button 
                  className="btn btn-danger" 
                  onClick={() => removePlant(plant.id)}
                  style={{ padding: '6px 8px', minWidth: 'auto' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Biomass</span>
                  <span style={{ color: 'var(--green-400)', fontWeight: 600 }}>
                    {Math.round(plant.biomass)}g / {plant.profile.maxBiomass}g
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>

              <div style={{ 
                display: 'flex', justifyContent: 'space-between', marginTop: '12px',
                fontSize: '0.75rem',
              }}>
                <span className="plant-stage-badge">{plant.currentStage || 'Growing'}</span>
                <span style={{ color: plant.healthScore > 75 ? 'var(--green-400)' : 'var(--amber-400)', fontWeight: 600 }}>
                  ❤️ {Math.round(plant.healthScore)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
