import React from 'react';
import { Search, Bell, Download } from 'lucide-react';

/**
 * Topbar con búsqueda, acciones rápidas y avatar.
 * onExport es opcional (si lo pasas, aparece el botón Exportar).
 */
const Topbar = ({ onExport }) => {
  return (
    <header className="topbar">
      <div className="search">
        <Search size={18} />
        <input placeholder="Buscar..." />
      </div>

      <div className="top-actions">
        {onExport && (
          <button className="btn" onClick={onExport}>
            <Download size={18} />
            Exportar
          </button>
        )}
        <button className="btn ghost" title="Notificaciones">
          <Bell size={18} />
        </button>
        <div className="avatar">SP</div>
      </div>
    </header>
  );
};

export default Topbar;
