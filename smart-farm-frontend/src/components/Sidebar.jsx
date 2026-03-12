import { 
  LayoutDashboard, Leaf, Brain, SlidersHorizontal, Sprout, Activity, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
  { id: 'digital-twin', label: 'Digital Twin', icon: Leaf, section: 'Overview' },
  { id: 'ai-insights', label: 'AI Insights', icon: Brain, section: 'Intelligence' },
  { id: 'controls', label: 'Controls', icon: SlidersHorizontal, section: 'Management' },
  { id: 'plants', label: 'Plants', icon: Sprout, section: 'Management' },
];

export default function Sidebar({ activePage, onNavigate, connected }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = [...new Set(navItems.map(item => item.section))];

  const handleNav = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setMobileOpen(!mobileOpen)}
        id="mobile-menu-toggle"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h1>🌱 Smart Farm</h1>
          <p>Digital Twin Dashboard</p>
        </div>
        
        <nav className="sidebar-nav">
          {sections.map(section => (
            <div key={section}>
              <div className="nav-section-title">{section}</div>
              {navItems.filter(item => item.section === section).map(item => (
                <div
                  key={item.id}
                  className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => handleNav(item.id)}
                  id={`nav-${item.id}`}
                >
                  <item.icon className="nav-icon" size={20} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className={`status-dot ${connected ? '' : 'disconnected'}`} 
                  style={!connected ? { background: '#ef4444', boxShadow: '0 0 8px #ef4444' } : {}} />
            <span>{connected ? 'System Online' : 'Reconnecting...'}</span>
          </div>
          <div className="system-status" style={{ marginTop: '8px' }}>
            <Activity size={14} />
            <span>ESP32_FARM_01</span>
          </div>
        </div>
      </aside>
    </>
  );
}
