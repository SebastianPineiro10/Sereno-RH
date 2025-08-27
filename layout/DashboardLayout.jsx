import React from "react";
import "./dashboard.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="dash-wrap">
      <aside className="dash-sidebar">
        <div className="brand">Sereno RH</div>
        <nav className="menu">
          <a href="/admin">Panel Admin</a>
          <a href="/employee">Panel Empleado</a>
        </nav>
      </aside>
      <main className="dash-main">
        <header className="dash-topbar">
          <div className="top-actions">
            <button id="theme-toggle">🌓</button>
            <button onClick={()=>{
              localStorage.removeItem("sereno-rh-auth");
              localStorage.removeItem("sereno-rh-role");
              location.href="/login";
            }}>Salir</button>
          </div>
        </header>
        <section className="dash-content">
          {children}
        </section>
      </main>
    </div>
  );
}
