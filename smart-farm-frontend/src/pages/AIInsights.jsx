import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Brain, Sun, Droplets, FlaskConical, Zap, AlertTriangle,
  CheckCircle, TrendingUp, RefreshCw
} from 'lucide-react';

export default function AIInsights({ aiRecommendation, sensorData }) {
  const { post, get, loading } = useApi();
  const [recommendation, setRecommendation] = useState(aiRecommendation);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (aiRecommendation) setRecommendation(aiRecommendation);
  }, [aiRecommendation]);

  useEffect(() => {
    get('/ai/latest').then(res => {
      if (res.data) setRecommendation(res.data);
    }).catch(() => {});
    get('/ai/history').then(res => {
      if (res.data) setHistory(res.data);
    }).catch(() => {});
  }, []);

  const runOptimization = async () => {
    try {
      const res = await post('/ai/optimize', {});
      if (res.data) {
        setRecommendation(res.data);
        setHistory(prev => [res.data, ...prev].slice(0, 20));
      }
    } catch (err) {
      console.error('Optimization failed:', err);
    }
  };

  const score = recommendation?.overallScore || 0;
  const confidence = recommendation?.confidence || 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  const recItems = [
    { 
      icon: <Sun size={18} />, 
      label: 'LED Intensity', 
      value: recommendation?.ledIntensity != null ? `${recommendation.ledIntensity}%` : '--',
      bg: 'rgba(251, 191, 36, 0.12)', 
      color: '#fbbf24' 
    },
    { 
      icon: <Droplets size={18} />, 
      label: 'Irrigation', 
      value: recommendation?.irrigationInterval != null 
        ? `Every ${recommendation.irrigationInterval}min, ${recommendation.irrigationDuration}s` 
        : '--',
      bg: 'rgba(96, 165, 250, 0.12)', 
      color: '#60a5fa' 
    },
    { 
      icon: <Zap size={18} />, 
      label: 'Nutrient Dosing', 
      value: recommendation?.nutrientDosing != null ? `${recommendation.nutrientDosing} ml/cycle` : '--',
      bg: 'rgba(34, 211, 238, 0.12)', 
      color: '#22d3ee' 
    },
    { 
      icon: <FlaskConical size={18} />, 
      label: 'pH Adjustment', 
      value: recommendation?.phAdjustment || '--',
      bg: 'rgba(192, 132, 252, 0.12)', 
      color: '#c084fc' 
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🧠 AI Insights</h2>
          <p>Intelligent optimization recommendations for your farm</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={runOptimization} 
          disabled={loading}
          id="run-optimization-btn"
          style={{ marginTop: '4px' }}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Analyzing...' : 'Run Optimization'}
        </button>
      </div>

      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Score & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Score Ring */}
        <div className="glass-card fade-in-up" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div className="ai-score-ring">
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle 
                cx="60" cy="60" r="54" fill="none" 
                stroke={score > 75 ? '#4ade80' : score > 50 ? '#fbbf24' : '#f87171'}
                strokeWidth="8" 
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="ai-score-value">
              <div className="score" style={{ color: score > 75 ? '#4ade80' : score > 50 ? '#fbbf24' : '#f87171' }}>
                {score}
              </div>
              <div className="label">Health Score</div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Confidence: <span style={{ color: 'var(--blue-400)', fontWeight: 600 }}>{confidence}%</span>
            </div>
            <div style={{ 
              fontSize: '0.72rem', 
              padding: '4px 12px', 
              borderRadius: '20px',
              background: recommendation?.source === 'gemini-ai' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(148, 163, 184, 0.12)',
              color: recommendation?.source === 'gemini-ai' ? '#c084fc' : '#94a3b8',
              display: 'inline-block',
            }}>
              {recommendation?.source === 'gemini-ai' ? '✨ Gemini AI' : '⚙️ Rule-based'}
            </div>
          </div>
        </div>

        {/* Recommendation Cards */}
        <div className="ai-recommendation-list">
          {recItems.map((item, i) => (
            <div key={i} className={`ai-rec-item fade-in-up stagger-${i + 1}`}>
              <div className="ai-rec-icon" style={{ background: item.bg, color: item.color }}>
                {item.icon}
              </div>
              <div className="ai-rec-content">
                <h4>{item.label}</h4>
                <p>{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts & Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card fade-in-up">
          <div className="glass-card-header">
            <span className="glass-card-title">⚠️ Alerts</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {recommendation?.alerts?.length || 0} active
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendation?.alerts?.length > 0 ? (
              recommendation.alerts.map((alert, i) => (
                <div key={i} className={`alert-card ${alert.includes('🚨') ? 'danger' : 'warning'}`}>
                  <AlertTriangle size={16} />
                  <span>{alert}</span>
                </div>
              ))
            ) : (
              <div className="alert-card success">
                <CheckCircle size={16} />
                <span>All systems operating within optimal ranges</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card fade-in-up stagger-1">
          <div className="glass-card-header">
            <span className="glass-card-title">💡 Insights</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {recommendation?.insights?.length || 0} suggestions
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendation?.insights?.length > 0 ? (
              recommendation.insights.map((insight, i) => (
                <div key={i} style={{ 
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 14px', background: 'var(--bg-glass)', 
                  borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                  color: 'var(--text-secondary)', lineHeight: 1.4,
                }}>
                  <TrendingUp size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--green-400)' }} />
                  {insight}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Run optimization to generate insights
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="glass-card fade-in-up" style={{ marginTop: '24px' }}>
          <div className="glass-card-header">
            <span className="glass-card-title">📜 Optimization History</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.slice(0, 8).map((rec, i) => (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : '--'}
                </span>
                <span style={{ 
                  color: rec.overallScore > 75 ? 'var(--green-400)' : 'var(--amber-400)',
                  fontWeight: 600,
                }}>
                  Score: {rec.overallScore}%
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {rec.source === 'gemini-ai' ? '✨ AI' : '⚙️ Rules'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
