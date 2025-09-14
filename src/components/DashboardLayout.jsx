// src/components/DashboardLayout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Admin from "../pages/Admin";

const DashboardLayout = ({ onLogout }) => {
  const [active, setActive] = useState("dashboard");

  return (
    <div className="dashboard-layout">
      <Sidebar active={active} onNavigate={setActive} />
      <main className="dashboard-content">
        <Admin view={active} onLogout={onLogout} />
      </main>
    </div>
  );
};

export default DashboardLayout;
