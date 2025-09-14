import React, { useState } from "react";
import {
  Home,
  Clock,
  User,
  Target,
  Gift,
  BarChart3,
  Calendar,
} from "lucide-react";

const EmployeeSidebar = ({ active = "dashboard", onNavigate, employeeName = "Empleado" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const items = [
    { key: "dashboard", label: "Inicio", Icon: Home },
    { key: "asistencia", label: "Mi Asistencia", Icon: Clock },
    { key: "perfil", label: "Mi Perfil", Icon: User },
    { key: "metas", label: "Mis Metas", Icon: Target },
    { key: "recompensas", label: "Recompensas", Icon: Gift },
    { key: "reportes", label: "Mis Reportes", Icon: BarChart3 },
    { key: "calendario", label: "Calendario", Icon: Calendar },
  ];

  const handleNavigate = (key) => {
    onNavigate(key);
    setIsOpen(false); // 👈 cerrar en mobile después de navegar
  };

  return (
    <>
      {/* Botón hamburguesa solo visible en mobile */}
      <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF">
          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
        </svg>
      </button>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="logo">SR</div>
          <div className="brand-text">
            <div style={{ fontWeight: 800 }}>Sereno RH</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{employeeName}</div>
          </div>
        </div>

        <nav className="menu">
          {items.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`menu-item ${active === key ? "active" : ""}`}
              onClick={() => handleNavigate(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">© {new Date().getFullYear()} Sereno</div>
      </aside>
    </>
  );
};

export default EmployeeSidebar;
