// src/pages/Admin.jsx
import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataContext } from '../App';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { calculateGlobalMetrics, calculateDailyPunctuality } from '../lib/metrics';
import { exportToExcel } from "../lib/excel";
import { setStorageData, STORAGE_KEYS } from '../lib/storage';
import WeeklyStatusCard from "../components/WeeklyStatusCard";

const Admin = ({ view = "dashboard", onLogout }) => {
  const { employees, setEmployees, checkins, setCheckins, passwords, setPasswords, rewards, setRewards } = useContext(DataContext);

  // Estados compartidos entre todas las vistas
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [filteredCheckins, setFilteredCheckins] = useState(checkins);
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardModalMode, setRewardModalMode] = useState('add');
  const [currentReward, setCurrentReward] = useState(null);
  const [hoveredLine, setHoveredLine] = useState(null);

  // Utilidades comunes
  const formatDuration = (checkin, checkout) => {
    if (!checkin || !checkout) return "—";

    const normalizeTime = (time) => {
      const clean = time.trim().toUpperCase();
      if (clean.includes("A.M.") || clean.includes("P.M.") || clean.includes("AM") || clean.includes("PM")) {
        let [rawHour, rawMinute] = clean.replace(/[^\d:]/g, "").split(":").map(Number);
        const isPM = clean.includes("P.M.") || clean.includes("PM");
        if (isPM && rawHour < 12) rawHour += 12;
        if (!isPM && rawHour === 12) rawHour = 0;
        return [rawHour, rawMinute];
      }
      return time.split(":").map(Number);
    };

    const [inHours, inMinutes] = normalizeTime(checkin);
    const [outHours, outMinutes] = normalizeTime(checkout);
    const start = new Date(2000, 0, 1, inHours, inMinutes);
    const end = new Date(2000, 0, 1, outHours, outMinutes);
    let diff = (end - start) / (1000 * 60);
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const ALL_VALUE = '__ALL__';
  const normalizeTxt = (s = '') =>
    s.toString().trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(normalizeTxt(searchQuery)), 180);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const empById = useMemo(
    () => Object.fromEntries(employees.map(e => [e.id, e])),
    [employees]
  );

  const msOptions = useMemo(() => {
    const base = employees
      .map(e => ({ value: e.id, label: e.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
    return [{ value: ALL_VALUE, label: 'Todos' }, ...base];
  }, [employees]);

  useEffect(() => {
    const q = debouncedQuery;
    const hasText = !!q;
    const hasExact = selectedEmployeeIds.length > 0;

    if (!hasText && !hasExact) {
      setFilteredCheckins(checkins);
      return;
    }

    let result = checkins.filter((c) => {
      const emp = empById[c.employeeId];
      const name = normalizeTxt(emp?.name || '');
      const email = normalizeTxt(emp?.email || '');
      const matchText = hasText ? (name.includes(q) || email.includes(q)) : false;
      const matchExact = hasExact ? selectedEmployeeIds.includes(c.employeeId) : false;
      return (hasText && matchText) || (hasExact && matchExact);
    });

    if (hasText) {
      result = [...result].sort((a, b) => {
        const na = (empById[a.employeeId]?.name || '').toLocaleLowerCase();
        const nb = (empById[b.employeeId]?.name || '').toLocaleLowerCase();
        return na.localeCompare(nb, 'es', { sensitivity: 'base' });
      });
    }

    setFilteredCheckins(result);
  }, [debouncedQuery, selectedEmployeeIds, checkins, empById]);

  const globalMetrics = calculateGlobalMetrics(checkins, employees);

  const mergedData = useMemo(() => {
    const dates = Array.from(new Set(checkins.map((c) => c.date))).sort();
    return dates.map((date) => {
      const row = { date };
      employees.forEach((emp) => {
        const records = checkins.filter(
          (c) => c.employeeId === emp.id && c.date === date
        );
        if (records.length > 0) {
          const punctual = records.filter((c) => {
            const limit = new Date("2000-01-01T09:15:00");
            return new Date(`2000-01-01 ${c.checkinTime}`) <= limit;
          }).length;
          const total = records.length;
          row[emp.name] = Math.round((punctual / total) * 100);
        } else {
          row[emp.name] = 0;
        }
      });
      return row;
    });
  }, [checkins, employees]);

  // Funciones de empleados
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

  // Funciones de recompensas
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

  const handleExport = () => {
    const excelData = filteredCheckins.map(c => ({
      employeeId: c.employeeId,
      date: c.date,
      checkinTime: c.checkinTime || "-",
      checkoutTime: c.checkoutTime || "-",
      duration: c.duration || "-",
      employeeName: empById[c.employeeId]?.name || "Desconocido",
      status: c.checkinTime && c.checkoutTime 
        ? "Completo" 
        : c.checkinTime 
          ? "Pendiente Salida" 
          : "Ausente",
    }));
    exportToExcel(excelData, "asistencias.xlsx");
  };

  // Componente MultiSelect reutilizable
  const MultiSelectCompact = ({ options, selected, onChange, label = 'Empleados' }) => {
    const [open, setOpen] = useState(false);
    const [localFilter, setLocalFilter] = useState('');
    const wrapRef = useRef(null);

    useEffect(() => {
      const onDocClick = (e) => {
        if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const allIds = useMemo(
      () => options.filter(o => o.value !== ALL_VALUE).map(o => o.value),
      [options]
    );
    const isAllSelected = selected.length > 0 && selected.length === allIds.length;

    const filteredOptions = useMemo(
      () => options.filter(o => o.value === ALL_VALUE || normalizeTxt(o.label).includes(normalizeTxt(localFilter))),
      [options, localFilter]
    );

    const applySelectAll = (checked) => {
      if (checked) onChange(allIds);
      else onChange([]);
    };

    const toggleSingle = (value) => {
      if (value === ALL_VALUE) {
        applySelectAll(!isAllSelected);
        return;
      }
      if (selected.includes(value)) onChange(selected.filter(v => v !== value));
      else onChange([...selected, value]);
    };

    const summary = (() => {
      if (isAllSelected) return 'Todos';
      if (selected.length === 0) return 'Seleccionar…';
      const first = options.find(o => o.value === selected[0])?.label ?? 'Seleccionado';
      if (selected.length === 1) return first;
      return `${first} +${selected.length - 1} más`;
    })();

    return (
      <div ref={wrapRef} style={{ minWidth: 320, position: 'relative' }}>
        <div style={{ marginBottom: 6, fontSize: 13, opacity: 0.8 }}>
          {label}
        </div>
        <div className="glass-input ms-trigger" onClick={() => setOpen(!open)}>
          <span className="ms-summary">{summary}</span>
        </div>
        {open && (
          <div className="glass-card ms-panel" onClick={(e) => e.stopPropagation()}>
            <input
              type="search"
              placeholder="Filtrar lista…"
              className="glass-input"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div className="ms-list">
              <label key={ALL_VALUE} className="ms-option">
                <input
                  type="checkbox"
                  className="ms-checkbox"
                  checked={isAllSelected}
                  onChange={(e) => applySelectAll(e.target.checked)}
                />
                <span>Todos</span>
              </label>
              {filteredOptions
                .filter(o => o.value !== ALL_VALUE)
                .map(opt => (
                  <label key={opt.value} className="ms-option">
                    <input
                      type="checkbox"
                      className="ms-checkbox"
                      checked={selected.includes(opt.value)}
                      onChange={() => toggleSingle(opt.value)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))
              }
              {filteredOptions.filter(o => o.value !== ALL_VALUE).length === 0 && (
                <div style={{ opacity: 0.6, fontSize: 13, padding: '6px 2px' }}>Sin resultados…</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" className="button secondary" onClick={() => onChange([])}>Limpiar</button>
              <button type="button" className="button primary" onClick={() => setOpen(false)}>Aplicar</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===================== RENDERIZADO POR VISTA =====================

  // Vista Dashboard - Resumen y gráficos
  const renderDashboard = () => (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
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

      <h2 className="section-title">Rendimiento por Empleado</h2>
      <Card title="Puntualidad Individual (Últimos 30 días)" className="chart-card">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={mergedData}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setHoveredLine(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredLine(null)}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.15)" />
            <XAxis dataKey="date" stroke="#fff" tick={{ fill: "#fff", fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fill: "#fff", fontSize: 12 }} domain={[0, 100]} />
            <Tooltip
              trigger="hover"
              isAnimationActive={true}
              allowEscapeViewBox={{ x: true, y: true }}
              cursor={{
                stroke: "rgba(255,255,255,0.25)",
                strokeWidth: 1.5,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                background: "rgba(15, 20, 36, 0.92)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "12px",
                padding: "12px 14px",
                color: "#fff",
                fontSize: "13px",
                boxShadow: "0 0 20px rgba(0,0,0,0.35)",
              }}
              formatter={(value) => `${value}%`}
            />
            {employees.map((emp, index) => {
              const colorPalette = [
                "#4ea8ff", "#7c5cff", "#4caf50", "#ffb300",
                "#e53935", "#00bcd4", "#ff4081", "#9c27b0"
              ];
              const color = colorPalette[index % colorPalette.length];
              
              return (
                <Line
                  key={emp.id}
                  type="monotone"
                  dataKey={emp.name}
                  name={emp.name}
                  stroke={color}
                  strokeWidth={hoveredLine === index ? 4 : 2.5}
                  opacity={hoveredLine === null || hoveredLine === index ? 1 : 0.15}
                  activeDot={{
                    r: 8,
                    strokeWidth: 3,
                    fill: color,
                    stroke: "#fff",
                    style: {
                      filter: `drop-shadow(0 0 10px ${color})`,
                    },
                  }}
                  dot={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="section-title">Estado Semanal de Empleados</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginTop: "1rem" }}>
        {employees.map((employee) => {
          const weeklyStatus = checkins
            .filter((c) => c.employeeId === employee.id)
            .map((c) => {
              const colors = {
                early: "#1e88e5", on_time: "#4caf50", delay: "#ffb300",
                late: "#e53935", absent: "#9aa3b2",
              };
              let status = "absent";
              if (c.checkinTime) {
                const checkinTime = new Date(`2000-01-01 ${c.checkinTime}`);
                const limit = new Date("2000-01-01T09:15:00");
                const delayLimit = new Date("2000-01-01T09:25:00");
                if (checkinTime <= new Date("2000-01-01T09:00:00")) status = "early";
                else if (checkinTime <= limit) status = "on_time";
                else if (checkinTime <= delayLimit) status = "delay";
                else status = "late";
              }
              return {
                day: new Date(c.date).toLocaleDateString("es-MX", { weekday: "short" }),
                status, color: colors[status],
                checkin: c.checkinTime || "—", checkout: c.checkoutTime || "—",
              };
            });
          return <WeeklyStatusCard key={employee.id} employee={employee} weeklyStatus={weeklyStatus} />;
        })}
      </div>
    </>
  );

  // Vista Asistencia - Tabla de checkins
  const renderAsistencia = () => (
    <>
      <div className="page-header">
        <h1>Gestión de Asistencias</h1>
        <div className="header-actions">
          <button onClick={handleExport} className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="filter-controls glass-card" style={{ gap: '1rem', alignItems: 'flex-end' }}>
        <label style={{ flex: 2, minWidth: 260 }}>
          Buscar empleado:
          <input
            type="search"
            placeholder="Escribe nombre o email…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="glass-input"
          />
        </label>
        <button onClick={() => setSearchQuery('')} className="button secondary">
          Limpiar
        </button>
        <MultiSelectCompact
          options={msOptions}
          selected={selectedEmployeeIds}
          onChange={setSelectedEmployeeIds}
          label="Empleados"
        />
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
                <td>{empById[c.employeeId]?.name || 'Desconocido'}</td>
                <td>{c.date}</td>
                <td>{c.checkinTime || '-'}</td>
                <td>{c.checkoutTime || '-'}</td>
                <td>{formatDuration(c.checkinTime, c.checkoutTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  // Vista Empleados - Gestión de empleados
  const renderEmpleados = () => (
    <>
      <div className="page-header">
        <h1>Gestión de Empleados</h1>
        <div className="header-actions">
          <button onClick={openAddModal} className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="16" x2="16" y1="11" y2="17"/><line x1="19" x2="13" y1="14" y2="14"/></svg>
            Añadir Empleado
          </button>
        </div>
      </div>

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
                  <button
                    onClick={() => handleToggleActive(employee.id)}
                    className={`button ${employee.active ? 'danger' : 'success'} icon-button`}
                    title={employee.active ? 'Desactivar' : 'Activar'}
                  >
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
    </>
  );

  // Vista Bonos/Recompensas - Gestión de recompensas
  const renderBonos = () => (
    <>
      <div className="page-header">
        <h1>Gestión de Recompensas</h1>
        <div className="header-actions">
          <button onClick={openAddRewardModal} className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gift"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="4" x="2" y="8"/><line x1="12" x2="12" y1="22" y2="8"/><path d="M12 8H8a2 2 0 0 1-2-2v-4h4l3 3 3-3h4v4a2 2 0 0 1-2 2h-4"/></svg>
            Añadir Recompensa
          </button>
        </div>
      </div>

      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Puntos Requeridos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rewards.map(reward => (
              <tr key={reward.id}>
                <td>{reward.name}</td>
                <td>{reward.description}</td>
                <td>{reward.pointsRequired}</td>
                <td><Badge type={reward.active ? 'success' : 'danger'} text={reward.active ? 'Activa' : 'Inactiva'} /></td>
                <td className="table-actions">
                  <button onClick={() => openEditRewardModal(reward)} className="button secondary icon-button" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button
                    onClick={() => handleToggleRewardActive(reward.id)}
                    className={`button ${reward.active ? 'danger' : 'success'} icon-button`}
                    title={reward.active ? 'Desactivar' : 'Activar'}
                  >
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
    </>
  );

  // Vista Metas - Sistema de objetivos
  const renderMetas = () => (
    <>
      <div className="page-header">
        <h1>Gestión de Metas </h1>
        <p>(En mantenimiento)</p>
        <div className="header-actions">
          <button className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-target"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Crear Meta
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        <Card title="Meta Mensual: Puntualidad">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: '#4caf50', borderRadius: '8px' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>75%</span>
          </div>
          <p style={{ opacity: 0.8, fontSize: '14px' }}>Objetivo: 90% de puntualidad mensual</p>
          <Badge type="warning" text="En progreso" />
        </Card>

        <Card title="Meta Trimestral: Asistencia">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: '92%', height: '100%', background: '#4ea8ff', borderRadius: '8px' }}></div>
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>92%</span>
          </div>
          <p style={{ opacity: 0.8, fontSize: '14px' }}>Objetivo: 95% de asistencia trimestral</p>
          <Badge type="success" text="Casi completada" />
        </Card>
      </div>
    </>
  );

  // Vista Reportes - Análisis y estadísticas
  const renderReportes = () => (
    <>
      <div className="page-header">
        <h1>Reportes y Análisis</h1>
        <div className="header-actions">
          <button onClick={handleExport} className="button primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Generar Reporte
          </button>
        </div>
      </div>

      <div className="grid grid-4">
        <Card title="Promedio Puntualidad">
          <p className="metric-number">{globalMetrics.punctualityRate}%</p>
          <Badge type={globalMetrics.punctualityRate >= 85 ? 'success' : 'warning'} text="Este mes" />
        </Card>
        <Card title="Horas Trabajadas">
          <p className="metric-number">{checkins.length * 8}</p>
          <Badge type="info" text="Total registradas" />
        </Card>
        <Card title="Mejor Empleado">
          <p className="metric-number">⭐</p>
          <Badge type="success" text="Juan Pérez" />
        </Card>
        <Card title="Tendencia">
          <p className="metric-number">📈</p>
          <Badge type="success" text="Mejorando" />
        </Card>
      </div>

      <div className="grid grid-2">
        <Card title="Resumen Semanal" className="chart-card">
          <div style={{ padding: '1rem' }}>
            <p style={{ marginBottom: '1rem', opacity: 0.8 }}>Asistencia por día de la semana:</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end', height: '100px' }}>
              {['L', 'M', 'X', 'J', 'V'].map((day, index) => (
                <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${60 + index * 8}px`, 
                    background: '#4ea8ff', 
                    borderRadius: '4px',
                    opacity: 0.8 + index * 0.05
                  }}></div>
                  <span style={{ fontSize: '12px', opacity: 0.7 }}>{day}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Top Performers" className="chart-card">
          <div style={{ padding: '1rem' }}>
            {employees.slice(0, 3).map((emp, index) => (
              <div key={emp.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '0.75rem 0',
                borderBottom: index < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}>
                    {index + 1}
                  </div>
                  <span>{emp.name}</span>
                </div>
                <Badge type="success" text={`${95 - index * 2}%`} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

// Vista Configuración - Ajustes del sistema
const renderConfig = () => (
  <>
    <div className="page-header">
      <h1>Configuración del Sistema</h1>
      <p>(En mantenimiento)</p>
    </div>

    {/* Horarios + Notificaciones */}
    <div className="grid grid-2">
      <Card title="Horarios de Trabajo" className="glass-card">
        <div className="form-group">
          <label>Hora de entrada estándar:</label>
          <input type="time" defaultValue="09:00" className="glass-input" />
        </div>
        <div className="form-group">
          <label>Tolerancia de puntualidad:</label>
          <input
            type="number"
            defaultValue="15"
            className="glass-input"
            placeholder="Minutos"
          />
        </div>
        <div className="form-group">
          <label>Hora de salida estándar:</label>
          <input type="time" defaultValue="18:00" className="glass-input" />
        </div>
        <button className="button primary">Guardar Cambios</button>
      </Card>

      <Card title="Notificaciones" className="glass-card">
        <div className="form-group vertical-checks">
          <label>
            <input type="checkbox" defaultChecked />
            <span>Notificar llegadas tardías</span>
          </label>
          <label>
            <input type="checkbox" defaultChecked />
            <span>Recordatorio de check-out</span>
          </label>
          <label>
            <input type="checkbox" />
            <span>Reportes automáticos semanales</span>
          </label>
          <label>
            <input type="checkbox" defaultChecked />
            <span>Alertas de ausencias</span>
          </label>
        </div>
        <button className="button primary">Actualizar Preferencias</button>
      </Card>
    </div>

 <div className="grid grid-2">
  <Card title="Sistema de Puntos" className="glass-card">
    <div className="grid grid-3">
      <div className="form-group">
        <label>Puntos por día puntual:</label>
        <input type="number" defaultValue="10" className="glass-input" />
      </div>
      <div className="form-group">
        <label>Puntos por semana perfecta:</label>
        <input type="number" defaultValue="50" className="glass-input" />
      </div>
      <div className="form-group">
        <label>Penalización por tardanza:</label>
        <input type="number" defaultValue="-5" className="glass-input" />
      </div>
    </div>
    <button className="button primary">Guardar Sistema de Puntos</button>
  </Card>

  <Card title="Respaldo y Datos" className="glass-card">
    <div className="button-group">
      <button className="button secondary">Crear Respaldo</button>
      <button className="button secondary">Restaurar Datos</button>
      <button className="button danger">Limpiar Datos</button>
    </div>
  </Card>
</div>

  </>
);

  // ===================== RENDER PRINCIPAL =====================
  const renderContent = () => {
    switch (view) {
      case 'dashboard': return renderDashboard();
      case 'asistencia': return renderAsistencia();
      case 'empleados': return renderEmpleados();
      case 'bonos': return renderBonos();
      case 'metas': return renderMetas();
      case 'reportes': return renderReportes();
      case 'config': return renderConfig();
      default: return renderDashboard();
    }
  };

  return (
    <div className="content">
      {renderContent()}

      {/* Modales compartidos */}
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