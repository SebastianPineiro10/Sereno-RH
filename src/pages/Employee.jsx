// src/pages/Employee.jsx
import { useState, useEffect, useContext, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DataContext } from "../App";
import Card from "../components/Card";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import {
  calculatePunctuality,
  calculateAttendanceStreak,
  calculateDailyPunctuality,
  calculateWeeklyAttendance,
  calculateWeeklyStatus,
} from "../lib/metrics";
import { setStorageData, STORAGE_KEYS } from "../lib/storage";
import WeeklyStatusCard from "../components/WeeklyStatusCard";

const Employee = ({ view = "dashboard", onLogout, currentUserId }) => {
  const { employees, setEmployees, checkins, setCheckins, goals, rewards } = useContext(DataContext);

  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckin, setIsCheckin] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: "", email: "" });
  const [hoveredLine, setHoveredLine] = useState(null);

  useEffect(() => {
    const user = employees.find((emp) => emp.id === currentUserId);
    setCurrentUser(user);

    if (user && user.active === false) {
      alert("Tu cuenta ha sido desactivada por un administrador.");
      onLogout();
      return;
    }

    if (user) {
      setProfileFormData({ name: user.name, email: user.email });
    }

    const today = new Date().toISOString().split("T")[0];
    const checkin = checkins.find(
      (c) => c.employeeId === currentUserId && c.date === today
    );
    setTodayCheckin(checkin);
    setIsCheckin(checkin && checkin.checkinTime && !checkin.checkoutTime);
  }, [employees, checkins, currentUserId, onLogout]);

const handleCheckin = () => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (!todayCheckin) {
    // ✅ Nuevo check-in
    const newCheckin = {
      employeeId: currentUserId,
      date: today,
      checkinTime: time,
      checkoutTime: null,
      duration: null,
      timestamp: now.getTime(),
      punctual: now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() <= 15),
    };
    const newCheckins = [...checkins, newCheckin];
    setCheckins(newCheckins);
    setStorageData(STORAGE_KEYS.checkins, newCheckins);
  } else if (!todayCheckin.checkoutTime) {
    // ✅ Checkout si ya tenía check-in
    const updatedCheckins = checkins.map((c) => {
      if (c.employeeId === currentUserId && c.date === today) {
        const checkinDate = new Date(c.timestamp);
        const checkoutDate = now;
        const diffMs = checkoutDate - checkinDate;
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        const duration = `${hours}h ${minutes}m`;
        return { ...c, checkoutTime: time, duration };
      }
      return c;
    });
    setCheckins(updatedCheckins);
    setStorageData(STORAGE_KEYS.checkins, updatedCheckins);
  }
};

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === currentUserId) {
        return {
          ...emp,
          name: profileFormData.name,
          email: profileFormData.email,
        };
      }
      return emp;
    });
    setEmployees(updatedEmployees);
    setStorageData(STORAGE_KEYS.employees, updatedEmployees);
    setIsEditingProfile(false);
  };

  // Datos calculados
  const personalCheckins = useMemo(() => 
    checkins.filter((c) => c.employeeId === currentUserId), 
    [checkins, currentUserId]
  );

  const punctuality7Days = useMemo(() => calculatePunctuality(personalCheckins, 7), [personalCheckins]);
  const punctuality30Days = useMemo(() => calculatePunctuality(personalCheckins, 30), [personalCheckins]);
  const attendanceStreak = useMemo(() => calculateAttendanceStreak(personalCheckins), [personalCheckins]);
  const totalPoints = useMemo(() => 
    personalCheckins.reduce((sum, c) => sum + (c.checkinTime ? 10 : 0), 0), 
    [personalCheckins]
  );

  const monthlyGoal = useMemo(() => 
    goals.find((g) =>
      g.employeeId === currentUserId &&
      new Date(g.month).getMonth() === new Date().getMonth()
    ), 
    [goals, currentUserId]
  );

  const personalDailyPunctualityData = useMemo(() => 
    calculateDailyPunctuality(personalCheckins, 30, employees),
    [personalCheckins, employees]
  );

  const weeklyAttendance = useMemo(() => calculateWeeklyAttendance(checkins, currentUserId), [checkins, currentUserId]);
  const weeklyStatus = useMemo(() => calculateWeeklyStatus(checkins, currentUserId), [checkins, currentUserId]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const detail = data.details.find(d => d.name === currentUser.name);

      return (
        <div className="employee-chart-tooltip">
          <p className="tooltip-date">{data.date}</p>
          <p className="tooltip-item">{currentUser.name}</p>
          <p className="tooltip-item">Entrada: {detail?.checkin || "—"}</p>
          <p className="tooltip-item">Salida: {detail?.checkout || "—"}</p>
          <p className="tooltip-item strong">
            Puntualidad: {data["Puntualidad %"]}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (!currentUser) {
    return (
      <div className="content">
        <div className="loading-spinner">
          <p>Cargando datos de empleado...</p>
        </div>
      </div>
    );
  }

  // ===================== VISTAS POR SECCIÓN =====================

  // Vista Dashboard - Resumen general
  const renderDashboard = () => (
    <>
      <div className="page-header">
        <h1>Bienvenido, {currentUser.name}</h1>
        <div className="header-actions">
          <div className="check-in-status">
            <Badge
              type={todayCheckin?.checkinTime ? "success" : "danger"}
              text={
                todayCheckin?.checkinTime
                  ? "Check-in Realizado"
                  : "Pendiente de Check-in"
              }
            />
            <button
              onClick={handleCheckin}
              className={`button ${isCheckin ? "danger" : "primary"}`}
              disabled={todayCheckin?.checkoutTime}
            >
              {isCheckin ? "Check-out" : "Check-in"}
            </button>
          </div>
          <button onClick={onLogout} className="button secondary">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="grid grid-3">
        <Card title="Puntualidad Semanal">
          <p className="metric-number">{punctuality7Days}%</p>
          <Badge type={punctuality7Days >= 80 ? "success" : "warning"} text="Últimos 7 días" />
        </Card>
        <Card title="Racha de Asistencia">
          <p className="metric-number">{attendanceStreak}</p>
          <Badge type="info" text="días consecutivos" />
        </Card>
        <Card title="Mis Puntos">
          <p className="metric-number">{totalPoints}</p>
          <Badge type="success" text="puntos acumulados" />
        </Card>
      </div>

      <h2 className="section-title">Mi Rendimiento Mensual</h2>
      <Card title="Puntualidad (Últimos 30 días)" className="chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={personalDailyPunctualityData}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setHoveredLine(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredLine(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
            <XAxis dataKey="date" stroke="#fff" tick={{ fill: "#fff", fontSize: 12 }} />
            <YAxis stroke="#fff" tick={{ fill: "#fff", fontSize: 12 }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Puntualidad %"
              stroke="#4ea8ff"
              strokeWidth={hoveredLine !== null ? 4 : 3}
              opacity={hoveredLine === null ? 1 : 0.85}
              activeDot={{
                r: 8,
                strokeWidth: 3,
                fill: "#4ea8ff",
                stroke: "#fff",
                style: { filter: "drop-shadow(0 0 10px #4ea8ff)" },
              }}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="section-title">Mi Estado Semanal</h2>
      <WeeklyStatusCard employee={currentUser} weeklyStatus={weeklyStatus} />
    </>
  );

  // Vista Mi Asistencia - Histórico detallado
  const renderAsistencia = () => (
    <>
      <div className="page-header">
        <h1>Mi Asistencia</h1>
        <div className="header-actions">
          <button
            onClick={handleCheckin}
            className={`button ${isCheckin ? "danger" : "primary"}`}
            disabled={todayCheckin?.checkoutTime}
          >
            {isCheckin ? "Check-out" : "Check-in"}
          </button>
        </div>
      </div>

      <div className="grid grid-3">
        <Card title="Registro de Hoy">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Entrada:</span>
              <strong>{todayCheckin?.checkinTime || "—"}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Salida:</span>
              <strong>{todayCheckin?.checkoutTime || "—"}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Duración:</span>
              <strong>{todayCheckin?.duration || "—"}</strong>
            </div>
          </div>
          <Badge 
            type={todayCheckin?.punctual ? "success" : todayCheckin?.checkinTime ? "warning" : "danger"}
            text={todayCheckin?.punctual ? "Puntual" : todayCheckin?.checkinTime ? "Tardío" : "Ausente"}
          />
        </Card>

        <Card title="Estadísticas Mensuales">
          <p>Puntualidad: <span className="metric-value">{punctuality30Days}%</span></p>
          <p>Días trabajados: <span className="metric-value">{personalCheckins.length}</span></p>
          <p>Promedio horas: <span className="metric-value">8h 15m</span></p>
        </Card>

        <Card title="Estado del Mes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Días puntuales:</span>
              <Badge type="success" text={`${Math.round(personalCheckins.length * punctuality30Days / 100)}`} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Días tardíos:</span>
              <Badge type="warning" text={`${personalCheckins.length - Math.round(personalCheckins.length * punctuality30Days / 100)}`} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Racha actual:</span>
              <Badge type="info" text={`${attendanceStreak} días`} />
            </div>
          </div>
        </Card>
      </div>

      <h2 className="section-title">Histórico de Asistencia</h2>
      <div className="glass-card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Duración</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {personalCheckins.slice(-30).reverse().map((checkin, index) => (
              <tr key={index}>
                <td>{checkin.date}</td>
                <td>{checkin.checkinTime || "—"}</td>
                <td>{checkin.checkoutTime || "—"}</td>
                <td>{checkin.duration || "—"}</td>
                <td>
                  <Badge 
                    type={checkin.punctual ? "success" : checkin.checkinTime ? "warning" : "danger"}
                    text={checkin.punctual ? "Puntual" : checkin.checkinTime ? "Tardío" : "Ausente"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  // Vista Mi Perfil - Información personal
  const renderPerfil = () => (
    <>
      <div className="page-header">
        <h1>Mi Perfil</h1>
      </div>

      <div className="grid grid-2">
        <Card title="Información Personal">
          {isEditingProfile ? (
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={profileFormData.name}
                  onChange={(e) =>
                    setProfileFormData({
                      ...profileFormData,
                      name: e.target.value,
                    })
                  }
                  className="glass-input"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={profileFormData.email}
                  onChange={(e) =>
                    setProfileFormData({
                      ...profileFormData,
                      email: e.target.value,
                    })
                  }
                  className="glass-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="button primary">
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="button secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', opacity: 0.7, fontSize: '0.9em' }}>Nombre:</label>
                  <strong>{currentUser.name}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', opacity: 0.7, fontSize: '0.9em' }}>Email:</label>
                  <strong>{currentUser.email}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', opacity: 0.7, fontSize: '0.9em' }}>ID de Empleado:</label>
                  <strong>{currentUser.id}</strong>
                </div>
                <div>
                  <label style={{ display: 'block', opacity: 0.7, fontSize: '0.9em' }}>Estado:</label>
                  <Badge type={currentUser.active ? "success" : "danger"} text={currentUser.active ? "Activo" : "Inactivo"} />
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="button primary"
                style={{ marginTop: '1rem' }}
              >
                Editar Perfil
              </button>
            </>
          )}
        </Card>

        <Card title="Estadísticas Personales">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total de asistencias:</span>
              <strong>{personalCheckins.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Puntualidad general:</span>
              <strong>{punctuality30Days}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mejor racha:</span>
              <strong>{attendanceStreak} días</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Puntos totales:</span>
              <strong>{totalPoints}</strong>
            </div>
          </div>
        </Card>
      </div>
    </>
  );

  // Vista Mis Metas - Objetivos personales
  const renderMetas = () => (
    <>
      <div className="page-header">
        <h1>Mis Metas</h1>
      </div>

      <div className="grid grid-2">
        <Card title="Meta del Mes Actual">
          {monthlyGoal ? (
            <>
              <h4>{monthlyGoal.description}</h4>
              <ProgressBar progress={monthlyGoal.progress} label={`${monthlyGoal.progress}% completado`} />
              <div style={{ marginTop: '1rem' }}>
                <Badge 
                  type={monthlyGoal.progress >= 100 ? "success" : monthlyGoal.progress >= 75 ? "info" : "warning"} 
                  text={monthlyGoal.progress >= 100 ? "Completada" : "En progreso"} 
                />
              </div>
            </>
          ) : (
            <p>No hay metas definidas para este mes.</p>
          )}
        </Card>

        <Card title="Objetivos Automáticos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Puntualidad Semanal</span>
                <span>{punctuality7Days}%</span>
              </div>
              <ProgressBar progress={punctuality7Days} label="Meta: 90%" />
              <Badge type={punctuality7Days >= 90 ? "success" : "warning"} text={punctuality7Days >= 90 ? "Logrado" : "En progreso"} />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Asistencia Mensual</span>
                <span>{Math.round((personalCheckins.length / 22) * 100)}%</span>
              </div>
              <ProgressBar progress={Math.round((personalCheckins.length / 22) * 100)} label="Meta: 95%" />
              <Badge 
                type={Math.round((personalCheckins.length / 22) * 100) >= 95 ? "success" : "warning"} 
                text={Math.round((personalCheckins.length / 22) * 100) >= 95 ? "Logrado" : "En progreso"} 
              />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Historial de Metas">
        <p style={{ opacity: 0.7, textAlign: 'center', padding: '2rem' }}>
          Próximamente: Historial completo de metas alcanzadas y progreso mensual
        </p>
      </Card>
    </>
  );

  // Vista Recompensas - Sistema de puntos
  const renderRecompensas = () => (
    <>
      <div className="page-header">
        <h1>Sistema de Recompensas</h1>
      </div>

      <Card title="Mis Puntos Actuales">
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <p className="metric-number" style={{ fontSize: '3rem', margin: '1rem 0' }}>{totalPoints}</p>
          <p style={{ opacity: 0.8 }}>Puntos disponibles para canjear</p>
        </div>
      </Card>

      <h2 className="section-title">Recompensas Disponibles</h2>
      <div className="grid grid-2">
        {rewards.map((reward) => (
          <Card key={reward.id} title={reward.name}>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>{reward.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span>Costo:</span>
              <strong>{reward.pointsRequired} puntos</strong>
            </div>
            <ProgressBar
              progress={Math.min(100, (totalPoints / reward.pointsRequired) * 100)}
              label={`${totalPoints}/${reward.pointsRequired}`}
            />
            <div style={{ marginTop: '1rem' }}>
              {totalPoints >= reward.pointsRequired ? (
                <button className="button primary">Canjear Recompensa</button>
              ) : (
                <button className="button secondary" disabled>
                  Faltan {reward.pointsRequired - totalPoints} puntos
                </button>
              )}
            </div>
            <Badge
              type={totalPoints >= reward.pointsRequired ? "success" : "info"}
              text={totalPoints >= reward.pointsRequired ? "Disponible" : "Bloqueada"}
            />
          </Card>
        ))}
      </div>
    </>
  );

  // Vista Mis Reportes - Análisis personal
  const renderReportes = () => (
    <>
      <div className="page-header">
        <h1>Mis Reportes</h1>
      </div>

      <div className="grid grid-4">
        <Card title="Puntualidad Semanal">
          <p className="metric-number">{punctuality7Days}%</p>
        </Card>
        <Card title="Puntualidad Mensual">
          <p className="metric-number">{punctuality30Days}%</p>
        </Card>
        <Card title="Días Trabajados">
          <p className="metric-number">{personalCheckins.length}</p>
        </Card>
        <Card title="Horas Totales">
          <p className="metric-number">{personalCheckins.length * 8}h</p>
        </Card>
      </div>

      <div className="grid grid-2">
        <Card title="Tendencia de Puntualidad" className="chart-card">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={personalDailyPunctualityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.2)" />
              <XAxis dataKey="date" stroke="#fff" tick={{ fill: "#fff", fontSize: 10 }} />
              <YAxis stroke="#fff" tick={{ fill: "#fff", fontSize: 10 }} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Puntualidad %"
                stroke="#4ea8ff"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribución Semanal" className="chart-card">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Puntual', value: Math.round(personalCheckins.length * punctuality30Days / 100), fill: '#4caf50' },
                  { name: 'Tardío', value: personalCheckins.length - Math.round(personalCheckins.length * punctuality30Days / 100), fill: '#ff9800' },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                {[
                  { name: 'Puntual', value: Math.round(personalCheckins.length * punctuality30Days / 100), fill: '#4caf50' },
                  { name: 'Tardío', value: personalCheckins.length - Math.round(personalCheckins.length * punctuality30Days / 100), fill: '#ff9800' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );

  // Vista Calendario - Planificación
  const renderCalendario = () => (
    <>
      <div className="page-header">
        <h1>Mi Calendario</h1>
      </div>

      <div className="grid grid-2">
        <Card title="Resumen del Mes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Días trabajados:</span>
              <strong>{personalCheckins.filter(c => c.checkinTime).length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Días puntuales:</span>
              <strong style={{ color: '#4caf50' }}>{personalCheckins.filter(c => c.punctual).length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Días tardíos:</span>
              <strong style={{ color: '#ff9800' }}>{personalCheckins.filter(c => c.checkinTime && !c.punctual).length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ausencias:</span>
              <strong style={{ color: '#f44336' }}>{personalCheckins.filter(c => !c.checkinTime).length}</strong>
            </div>
          </div>
        </Card>

        <Card title="Próximos Objetivos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Meta semanal</span>
                <Badge type="warning" text="5 días restantes" />
              </div>
              <p style={{ fontSize: '0.9em', opacity: 0.8 }}>Mantener 90% de puntualidad</p>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Meta mensual</span>
                <Badge type="info" text="15 días restantes" />
              </div>
              <p style={{ fontSize: '0.9em', opacity: 0.8 }}>95% de asistencia general</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Calendario Visual">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '0.5rem',
          padding: '1rem'
        }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} style={{ 
              textAlign: 'center', 
              fontWeight: 'bold',
              padding: '0.5rem',
              opacity: 0.7
            }}>
              {day}
            </div>
          ))}
          
          {/* Generar días del mes actual */}
          {Array.from({ length: 30 }, (_, i) => {
            const dayNum = i + 1;
            const dayCheckin = personalCheckins.find(c => 
              new Date(c.date).getDate() === dayNum
            );
            
            let bgColor = 'rgba(255,255,255,0.1)'; // Default
            if (dayCheckin?.checkinTime) {
              bgColor = dayCheckin.punctual ? '#4caf50' : '#ff9800';
            } else if (dayNum <= new Date().getDate()) {
              bgColor = '#f44336'; // Ausente
            }
            
            return (
              <div
                key={dayNum}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: bgColor,
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  color: dayCheckin?.checkinTime || dayNum <= new Date().getDate() ? '#fff' : 'rgba(255,255,255,0.7)'
                }}
                title={
                  dayCheckin?.checkinTime 
                    ? `${dayCheckin.checkinTime} - ${dayCheckin.punctual ? 'Puntual' : 'Tardío'}`
                    : dayNum <= new Date().getDate() 
                      ? 'Ausente' 
                      : 'Pendiente'
                }
              >
                {dayNum}
              </div>
            );
          })}
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem', 
          marginTop: '1rem',
          fontSize: '0.9em'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#4caf50', borderRadius: '2px' }}></div>
            Puntual
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#ff9800', borderRadius: '2px' }}></div>
            Tardío
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#f44336', borderRadius: '2px' }}></div>
            Ausente
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
            Futuro
          </div>
        </div>
      </Card>
    </>
  );

  // ===================== RENDER PRINCIPAL =====================
  const renderContent = () => {
    switch (view) {
      case 'dashboard': return renderDashboard();
      case 'asistencia': return renderAsistencia();
      case 'perfil': return renderPerfil();
      case 'metas': return renderMetas();
      case 'recompensas': return renderRecompensas();
      case 'reportes': return renderReportes();
      case 'calendario': return renderCalendario();
      default: return renderDashboard();
    }
  };

  return (
    <div className="content">
      {renderContent()}
    </div>
  );
};

export default Employee;