import { useState, useEffect, useContext } from "react";
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

const Employee = ({ onLogout, currentUserId }) => {
  const { employees, setEmployees, checkins, setCheckins, goals, rewards } =
    useContext(DataContext);

  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckin, setIsCheckin] = useState(false);
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    const user = employees.find((emp) => emp.id === currentUserId);
    setCurrentUser(user);

    // 🔐 Si el usuario existe pero está desactivado → cerrar sesión automática
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
    const time = now
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      .toUpperCase();

    if (!todayCheckin) {
      // Nuevo check-in
      const newCheckin = {
        employeeId: currentUserId,
        date: today,
        checkinTime: time,
        checkoutTime: null,
        duration: null,
        punctual:
          new Date(`2000-01-01 ${time}`) <=
          new Date(`2000-01-01T09:15:00`),
      };
      const newCheckins = [...checkins, newCheckin];
      setCheckins(newCheckins);
      setStorageData(STORAGE_KEYS.checkins, newCheckins);
    } else {
      // Check-out
      const updatedCheckins = checkins.map((c) => {
        if (c.employeeId === currentUserId && c.date === today) {
          const checkinDate = new Date(`${c.date} ${c.checkinTime}`);
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

  if (!currentUser) {
    return (
      <div className="content">
        <p>Cargando datos de empleado...</p>
      </div>
    );
  }

  // ✅ Métricas personales
  const personalCheckins = checkins.filter(
    (c) => c.employeeId === currentUserId
  );
  const punctuality7Days = calculatePunctuality(personalCheckins, 7);
  const punctuality30Days = calculatePunctuality(personalCheckins, 30);
  const attendanceStreak = calculateAttendanceStreak(personalCheckins);
  const totalPoints = personalCheckins.reduce(
    (sum, c) => sum + (c.checkinTime ? 10 : 0),
    0
  );
  const monthlyGoal = goals.find(
    (g) =>
      g.employeeId === currentUserId &&
      new Date(g.month).getMonth() === new Date().getMonth()
  );

  const personalDailyPunctualityData = calculateDailyPunctuality(
    personalCheckins,
    30,
    employees
  );

  const weeklyAttendance = calculateWeeklyAttendance(checkins, currentUserId);
  const weeklyStatus = calculateWeeklyStatus(checkins, currentUserId);

  return (
    <div className="content">
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

      {/* === Perfil, métricas y metas === */}
      <div className="grid grid-3">
        <Card title="Mi Perfil">
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
              <div className="form-actions" style={{ justifyContent: "flex-start" }}>
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
              <p>
                Nombre: <strong>{currentUser.name}</strong>
              </p>
              <p>
                Email: <strong>{currentUser.email}</strong>
              </p>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="button secondary mt-4"
              >
                Editar Perfil
              </button>
            </>
          )}
        </Card>

        <Card title="Métricas Personales">
          <p>
            Puntualidad (últimos 7 días):{" "}
            <span className="metric-value">{punctuality7Days}%</span>
          </p>
          <p>
            Puntualidad (últimos 30 días):{" "}
            <span className="metric-value">{punctuality30Days}%</span>
          </p>
          <p>
            Racha de Asistencia:{" "}
            <span className="metric-value">{attendanceStreak} días</span>
          </p>
        </Card>

        <Card title="Metas del Mes">
          {monthlyGoal ? (
            <>
              <p>{monthlyGoal.description}</p>
              <ProgressBar progress={monthlyGoal.progress} label="Progreso" />
            </>
          ) : (
            <p>No hay metas definidas para este mes.</p>
          )}
        </Card>
      </div>

      {/* === Recompensas === */}
      <h2 className="section-title">Recompensas</h2>
      <div className="grid grid-3">
        <Card title="Mis Puntos">
          <p className="metric-number">{totalPoints}</p>
          <p>Puntos acumulados</p>
        </Card>
        {rewards.map((reward) => (
          <Card key={reward.id} title={reward.name}>
            <p>
              Puntos requeridos: <strong>{reward.pointsRequired}</strong>
            </p>
            <ProgressBar
              progress={Math.min(
                100,
                (totalPoints / reward.pointsRequired) * 100
              )}
              label={`${totalPoints}/${reward.pointsRequired}`}
            />
            <Badge
              type={totalPoints >= reward.pointsRequired ? "success" : "info"}
              text={
                totalPoints >= reward.pointsRequired
                  ? "Desbloqueado"
                  : "Pendiente"
              }
            />
          </Card>
        ))}
      </div>

      {/* === Rendimiento mensual === */}
      <h2 className="section-title">Mi Rendimiento</h2>
      <Card title="Mi Puntualidad (Últimos 30 días)" className="chart-card">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={personalDailyPunctualityData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.2)"
            />
            <XAxis
              dataKey="date"
              stroke="#fff"
              tick={{ fill: "#fff", fontSize: 12 }}
            />
            <YAxis
              stroke="#fff"
              tick={{ fill: "#fff", fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="Puntualidad %"
              stroke="#82ca9d"
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* === Avance semanal detallado === */}
      <h2 className="section-title">Avance Semanal</h2>
      <WeeklyStatusCard employee={currentUser} weeklyStatus={weeklyStatus} />
    </div>
  );
};

export default Employee;
