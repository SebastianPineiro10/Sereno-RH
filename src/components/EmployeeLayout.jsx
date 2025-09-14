// src/components/EmployeeLayout.jsx
import React, { useState, useContext } from "react";
import EmployeeSidebar from "./EmployeeSidebar";
import Employee from "../pages/Employee";
import { DataContext } from "../App";

const EmployeeLayout = ({ onLogout, currentUserId }) => {
  const [active, setActive] = useState("dashboard");
  const { employees } = useContext(DataContext);
  
  const currentUser = employees.find(emp => emp.id === currentUserId);

  return (
    <div className="dashboard-layout">
      <EmployeeSidebar 
        active={active} 
        onNavigate={setActive}
        employeeName={currentUser?.name || "Empleado"}
      />
      <main className="dashboard-content">
        <Employee 
          view={active}
          onLogout={onLogout}
          currentUserId={currentUserId}
        />
      </main>
    </div>
  );
};

export default EmployeeLayout;