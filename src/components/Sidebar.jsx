import React from 'react';
import { Grid, Clock, Users, Gift, Target, BarChart3, Settings } from 'lucide-react';

/**
 * Sidebar del dashboard (estático / demo).
 * Si luego agregas routing, puedes pasar "active" por props para marcar el item actual.
 */
const Sidebar = ({ active = 'dashboard', onNavigate }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', Icon: Grid },
    { key: 'asistencia', label: 'Asistencia', Icon: Clock },
    { key: 'empleados', label: 'Empleados', Icon: Users },
    { key: 'bonos', label: 'Bonos', Icon: Gift },
    { key: 'metas', label: 'Metas', Icon: Target },
    { key: 'reportes', label: 'Reportes', Icon: BarChart3 },
    { key: 'config', label: 'Configuración', Icon: Settings },
  ];

  const handleClick = (key) => {
    if (onNavigate) onNavigate(key);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">SR</div>
        <div className="brand-text">
          <div style={{ fontWeight: 800 }}>Sereno RH</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Panel</div>
        </div>
      </div>

      <nav className="menu">
        {items.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`menu-item ${active === key ? 'active' : ''}`}
            onClick={() => handleClick(key)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">© {new Date().getFullYear()} Sereno</div>
    </aside>
  );
};

export default Sidebar;
