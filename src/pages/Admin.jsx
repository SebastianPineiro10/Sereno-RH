import { useState, useEffect, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataContext } from '../App';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { calculateGlobalMetrics, calculateDailyPunctuality } from '../lib/metrics';
import { exportToCsv } from '../lib/csv';
import { setStorageData, STORAGE_KEYS } from '../lib/storage';

const Admin = ({ onLogout }) => {
  const { employees, setEmployees, checkins, setCheckins, passwords, setPasswords, rewards, setRewards } = useContext(DataContext);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filteredCheckins, setFilteredCheckins] = useState(checkins);

  // Estado para la gestión de recompensas
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardModalMode, setRewardModalMode] = useState('add');
  const [currentReward, setCurrentReward] = useState(null);

  useEffect(() => {
    const newFiltered = checkins.filter(c => {
      const isDateMatch = (!filterStartDate || c.date >= filterStartDate) && (!filterEndDate || c.date <= filterEndDate);
      const isEmployeeMatch = !filterEmployeeId || c.employeeId === filterEmployeeId;
      return isDateMatch && isEmployeeMatch;
    });
    setFilteredCheckins(newFiltered);
  }, [filterStartDate, filterEndDate, filterEmployeeId, checkins]);

  const globalMetrics = calculateGlobalMetrics(checkins, employees);
  const dailyPunctualityData = calculateDailyPunctuality(checkins, 30);

  // Funciones para Empleados
  const openAddModal = () => {
    setModalMode('add');
    setCurrentEmployee({ name: '', email: '', password: '', active: true });
    setShowModal(true);
  };

  const openEditModal = (employee) => {
    setModalMode('edit');
    setCurrentEmployee({ ...employee, password: passwords[employee.email] || '' });
    setShowModal(true);
  };

  const handleSaveEmployee = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newEmployee = { ...currentEmployee, id: `emp-${Date.now()}`, active: true, role: 'employee' };
      const newEmployees = [...employees, newEmployee];
      const newPasswords = { ...passwords, [newEmployee.email]: newEmployee.password };
      setEmployees(newEmployees);
      setPasswords(newPasswords);
      setStorageData(STORAGE_KEYS.employees, newEmployees);
      setStorageData(STORAGE_KEYS.passwords, newPasswords);
    } else {
      const newEmployees = employees.map(emp => emp.id === currentEmployee.id ? { ...currentEmployee, password: undefined } : emp);
      const newPasswords = { ...passwords, [currentEmployee.email]: currentEmployee.password };
      setEmployees(newEmployees);
      setPasswords(newPasswords);
      setStorageData(STORAGE_KEYS.employees, newEmployees);
      setStorageData(STORAGE_KEYS.passwords, newPasswords);
    }
    setShowModal(false);
  };

  const handleToggleActive = (employeeId) => {
    const newEmployees = employees.map(emp => emp.id === employeeId ? { ...emp, active: !emp.active } : emp);
    setEmployees(newEmployees);
    setStorageData(STORAGE_KEYS.employees, newEmployees);
  };

  const handleDeleteEmployee = (employeeId) => {
    console.log(`Eliminando empleado con ID: ${employeeId}`);
    const employeeToDelete = employees.find(emp => emp.id === employeeId);
    if (!employeeToDelete) return;

    const newEmployees = employees.filter(emp => emp.id !== employeeId);
    const newCheckins = checkins.filter(c => c.employeeId !== employeeId);
    const newPasswords = { ...passwords };
    delete newPasswords[employeeToDelete.email];

    setEmployees(newEmployees);
    setCheckins(newCheckins);
    setPasswords(newPasswords);
    setStorageData(STORAGE_KEYS.employees, newEmployees);
    setStorageData(STORAGE_KEYS.checkins, newCheckins);
    setStorageData(STORAGE_KEYS.passwords, newPasswords);
  };

  const handleExport = () => {
    const csvData = filteredCheckins.map(c => ({
      ...c,
      employeeName: employees.find(e => e.id === c.employeeId)?.name || 'Desconocido',
      status: c.checkinTime && c.checkoutTime ? 'Completo' : c.checkinTime ? 'Pendiente Salida' : 'Ausente'
    }));
    exportToCsv(csvData, 'asistencias.csv');
  };

  // Funciones para Recompensas
  const openAddRewardModal = () => {
    setRewardModalMode('add');
    setCurrentReward({ name: '', description: '', pointsRequired: 0, active: true });
    setShowRewardModal(true);
  };

  const openEditRewardModal = (reward) => {
    setRewardModalMode('edit');
    setCurrentReward({ ...reward });
    setShowRewardModal(true);
  };

  const handleSaveReward = (e) => {
    e.preventDefault();
    if (rewardModalMode === 'add') {
      const newReward = { ...currentReward, id: `rew-${Date.now()}`, active: true };
      const newRewards = [...rewards, newReward];
      setRewards(newRewards);
      setStorageData(STORAGE_KEYS.rewards, newRewards);
    } else {
      const newRewards = rewards.map(rew => rew.id === currentReward.id ? currentReward : rew);
      setRewards(newRewards);
      setStorageData(STORAGE_KEYS.rewards, newRewards);
    }
    setShowRewardModal(false);
  };

  const handleToggleRewardActive = (rewardId) => {
    const newRewards = rewards.map(rew => rew.id === rewardId ? { ...rew, active: !rew.active } : rew);
    setRewards(newRewards);
    setStorageData(STORAGE_KEYS.rewards, newRewards);
  };

  const handleDeleteReward = (rewardId) => {
    const newRewards = rewards.filter(rew => rew.id !== rewardId);
    setRewards(newRewards);
    setStorageData(STORAGE_KEYS.rewards, newRewards);
  };

  return (
    <div className="content">
      <div className="page-header">
        <h1>Panel de Administración</h1>
        <div className="header-actions">
          <button onClick={openAddModal} className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="16" x2="16" y1="11" y2="17"/><line x1="19" x2="13" y1="14" y2="14"/></svg>
            Añadir Empleado
          </button>
          <button onClick={openAddRewardModal} className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="4" x="2" y="8"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M12 8H8a2 2 0 0 1-2-2v-4h4l3 3 3-3h4v4a2 2 0 0 1-2 2h-4"/></svg>
            Añadir Recompensa
          </button>
          <button onClick={onLogout} className="button secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="grid grid-3">
        <Card title="Puntualidad Hoy">
          <p className="metric-number">{globalMetrics.punctualityRate}%</p>
          <Badge type="success" text={`${globalMetrics.punctualCount} puntuales`} />
          <Badge type="warning" text={`${globalMetrics.lateCount} tarde`} />
        </Card>
        <Card title="Ausencias Hoy">
          <p className="metric-number">{globalMetrics.absenteeCount}</p>
          <Badge type="danger" text={`${globalMetrics.absenteeCount} ausentes`} />
        </Card>
        <Card title="Total de Empleados">
          <p className="metric-number">{globalMetrics.totalEmployees}</p>
          <Badge type="info" text={`${employees.filter(e => e.active).length} activos`} />
        </Card>
      </div>

      <h2 className="section-title">Gráfica de Rendimiento</h2>
      <Card title="Puntualidad General (Últimos 30 días)" className="chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyPunctualityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
            <XAxis dataKey="date" stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fill: '#fff', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="Puntualidad %" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="section-title">Gestión de Empleados</h2>
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td><Badge type={employee.active ? 'success' : 'danger'} text={employee.active ? 'Activo' : 'Desactivado'} /></td>
                <td className="table-actions">
                  <button onClick={() => openEditModal(employee)} className="button secondary icon-button" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button onClick={() => handleToggleActive(employee.id)} className={`button ${employee.active ? 'danger' : 'success'} icon-button`} title={employee.active ? 'Desactivar' : 'Activar'}>
                    {employee.active ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-x"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="10" y2="15"/><line x1="22" x2="17" y1="10" y2="15"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-check"><path d="M16 11l2 2l4-4"/></svg>
                    )}
                  </button>
                  <button onClick={() => handleDeleteEmployee(employee.id)} className="button danger icon-button" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Asistencias</h2>
      <div className="filter-controls glass-card">
        <label>
          Fecha Inicio:
          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="glass-input" />
        </label>
        <label>
          Fecha Fin:
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="glass-input" />
        </label>
        <label>
          Empleado:
          <select value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)} className="glass-input">
            <option value="">Todos</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </label>
        <button onClick={handleExport} className="button primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Exportar CSV
        </button>
      </div>
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Fecha</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheckins.map((c, index) => (
              <tr key={index}>
                <td>{employees.find(e => e.id === c.employeeId)?.name || 'Desconocido'}</td>
                <td>{c.date}</td>
                <td>{c.checkinTime || '-'}</td>
                <td>{c.checkoutTime || '-'}</td>
                <td>{c.duration || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Gestión de Recompensas</h2>
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Puntos Requeridos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map(reward => (
              <tr key={reward.id}>
                <td>{reward.name}</td>
                <td>{reward.pointsRequired}</td>
                <td><Badge type={reward.active ? 'success' : 'danger'} text={reward.active ? 'Activa' : 'Inactiva'} /></td>
                <td className="table-actions">
                  <button onClick={() => openEditRewardModal(reward)} className="button secondary icon-button" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button onClick={() => handleToggleRewardActive(reward.id)} className={`button ${reward.active ? 'danger' : 'success'} icon-button`} title={reward.active ? 'Desactivar' : 'Activar'}>
                    {reward.active ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-unlock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    )}
                  </button>
                  <button onClick={() => handleDeleteReward(reward.id)} className="button danger icon-button" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para añadir/editar empleados */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={modalMode === 'add' ? 'Añadir Nuevo Empleado' : 'Editar Empleado'}>
        <form onSubmit={handleSaveEmployee}>
          <div className="form-group">
            <label htmlFor="name">Nombre:</label>
            <input type="text" id="name" value={currentEmployee?.name || ''} onChange={(e) => setCurrentEmployee({ ...currentEmployee, name: e.target.value })} required className="glass-input" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" value={currentEmployee?.email || ''} onChange={(e) => setCurrentEmployee({ ...currentEmployee, email: e.target.value })} required className="glass-input" />
          </div>
          {modalMode === 'add' && (
            <div className="form-group">
              <label htmlFor="password">Contraseña Inicial:</label>
              <input type="password" id="password" value={currentEmployee?.password || ''} onChange={(e) => setCurrentEmployee({ ...currentEmployee, password: e.target.value })} required className="glass-input" />
            </div>
          )}
          <div className="form-actions">
            <button type="submit" className="button primary">Guardar</button>
            <button type="button" onClick={() => setShowModal(false)} className="button secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Modal para añadir/editar recompensas */}
      <Modal show={showRewardModal} onClose={() => setShowRewardModal(false)} title={rewardModalMode === 'add' ? 'Añadir Nueva Recompensa' : 'Editar Recompensa'}>
        <form onSubmit={handleSaveReward}>
          <div className="form-group">
            <label htmlFor="reward-name">Nombre:</label>
            <input type="text" id="reward-name" value={currentReward?.name || ''} onChange={(e) => setCurrentReward({ ...currentReward, name: e.target.value })} required className="glass-input" />
          </div>
          <div className="form-group">
            <label htmlFor="reward-description">Descripción:</label>
            <textarea id="reward-description" value={currentReward?.description || ''} onChange={(e) => setCurrentReward({ ...currentReward, description: e.target.value })} required className="glass-input" />
          </div>
          <div className="form-group">
            <label htmlFor="points-required">Puntos Requeridos:</label>
            <input type="number" id="points-required" value={currentReward?.pointsRequired || ''} onChange={(e) => setCurrentReward({ ...currentReward, pointsRequired: parseInt(e.target.value, 10) })} required className="glass-input" />
          </div>
          <div className="form-actions">
            <button type="submit" className="button primary">Guardar</button>
            <button type="button" onClick={() => setShowRewardModal(false)} className="button secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;