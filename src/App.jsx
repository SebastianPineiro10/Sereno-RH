// src/App.jsx
import React, { useState, useEffect, createContext } from 'react';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import EmployeeLayout from './components/EmployeeLayout'; // 👈 importa el layout de empleado
import { getStorageData, seedStorage, STORAGE_KEYS } from './lib/storage';
import './App.css';

export const DataContext = createContext();

const App = () => {
  const [employees, setEmployees] = useState(getStorageData(STORAGE_KEYS.employees));
  const [checkins, setCheckins] = useState(getStorageData(STORAGE_KEYS.checkins));
  const [rewards, setRewards] = useState(getStorageData(STORAGE_KEYS.rewards));
  const [goals, setGoals] = useState(getStorageData(STORAGE_KEYS.goals));
  const [passwords, setPasswords] = useState(getStorageData(STORAGE_KEYS.passwords));
  const [loggedInUserRole, setLoggedInUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    seedStorage();
    setEmployees(getStorageData(STORAGE_KEYS.employees));
    setCheckins(getStorageData(STORAGE_KEYS.checkins));
    setRewards(getStorageData(STORAGE_KEYS.rewards));
    setGoals(getStorageData(STORAGE_KEYS.goals));
    setPasswords(getStorageData(STORAGE_KEYS.passwords));
  }, []);

  if (!employees || !checkins || !rewards || !goals || !passwords) {
    return <p>Cargando datos iniciales...</p>;
  }

  const handleLogin = (email, password) => {
    const user = employees.find(emp => emp.email === email);
    if (user && passwords[user.email] === password) {
      setLoggedInUserRole(user.role);
      setCurrentUserId(user.id);
    } else {
      alert('Credenciales incorrectas.');
    }
  };

  const handleLogout = () => {
    setLoggedInUserRole(null);
    setCurrentUserId(null);
  };

  const renderContent = () => {
    if (loggedInUserRole === 'admin') {
      return <DashboardLayout onLogout={handleLogout} />;
    }
    if (loggedInUserRole === 'employee' && currentUserId) {
      // 👇 usar EmployeeLayout en vez de Employee directo
      return <EmployeeLayout onLogout={handleLogout} currentUserId={currentUserId} />;
    }
    return <Login onLogin={handleLogin} />;
  };

  return (
    <DataContext.Provider
      value={{
        employees, setEmployees,
        checkins, setCheckins,
        rewards, setRewards,
        goals, setGoals,
        passwords, setPasswords
      }}
    >
      <div className="app-container">
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </DataContext.Provider>
  );
};

export default App;
