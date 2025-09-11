// src/lib/metrics.js
// Funciones robustas para métricas, gráficas y estados semanales

// === Puntualidad promedio en X días ===
export const calculatePunctuality = (checkins, days) => {
  if (!Array.isArray(checkins) || checkins.length === 0) return 0;

  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - days);

  const filteredCheckins = checkins.filter(
    c => new Date(c.date) >= pastDate && c.checkinTime
  );
  if (filteredCheckins.length === 0) return 0;

  const punctualCount = filteredCheckins.filter(
    c =>
      new Date(`2000-01-01 ${c.checkinTime}`) <=
      new Date(`2000-01-01T09:15:00`)
  ).length;

  return Number(((punctualCount / filteredCheckins.length) * 100).toFixed(0));
};

// === Racha de asistencia ===
export const calculateAttendanceStreak = (checkins) => {
  if (!Array.isArray(checkins) || checkins.length === 0) return 0;

  let streak = 0;
  const sorted = [...checkins].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  for (const c of sorted) {
    if (c.checkinTime) streak++;
    else break;
  }
  return streak;
};

// === Métricas globales para Admin ===
export const calculateGlobalMetrics = (checkins, employees) => {
  const totalEmployees = employees?.length || 0;
  const today = new Date().toISOString().split("T")[0];
  const todayCheckins = checkins.filter((c) => c.date === today);

  const presentCount = todayCheckins.length;
  const lateCount = todayCheckins.filter(
    (c) =>
      c.checkinTime &&
      new Date(`2000-01-01 ${c.checkinTime}`) >
        new Date(`2000-01-01T09:15:00`)
  ).length;

  const punctualCount = presentCount - lateCount;
  const absenteeCount = totalEmployees - presentCount;

  return {
    totalEmployees,
    presentCount,
    lateCount,
    punctualCount,
    absenteeCount,
    punctualityRate:
      presentCount > 0
        ? Number(((punctualCount / presentCount) * 100).toFixed(0))
        : 0,
  };
};

// === Puntualidad diaria para gráficas ===
export const calculateDailyPunctuality = (checkins, days = 30, employees = []) => {
  if (!Array.isArray(checkins)) return [];

  const today = new Date();
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateString = date.toISOString().split("T")[0];
    const displayDate = date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
    });

    const dailyCheckins = checkins.filter((c) => c.date === dateString);

    const punctualCount = dailyCheckins.filter(
      (c) =>
        c.checkinTime &&
        new Date(`2000-01-01 ${c.checkinTime}`) <=
          new Date(`2000-01-01T09:15:00`)
    ).length;

    const punctualRate =
      dailyCheckins.length > 0
        ? (punctualCount / dailyCheckins.length) * 100
        : 0;

    // Tooltip detallado
    const details = dailyCheckins.map((c) => {
      const emp = employees.find((e) => e.id === c.employeeId);
      return {
        name: emp?.name || "Empleado",
        checkin: c.checkinTime,
        checkout: c.checkoutTime,
        punctual: c.punctual,
      };
    });

    data.push({
      date: displayDate,
      "Puntualidad %": Number(punctualRate.toFixed(2)),
      details,
    });
  }

  return data;
};

// === Asistencia semanal (%) ===
export const calculateWeeklyAttendance = (checkins, employeeId) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // lunes

  const weeklyCheckins = checkins.filter(
    (c) => c.employeeId === employeeId && new Date(c.date) >= startOfWeek
  );

  return Number(((weeklyCheckins.length / 5) * 100).toFixed(0));
};

// === Estado semanal detallado (colores + tooltip) ===
export const calculateWeeklyStatus = (checkins, employeeId) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // lunes

  const colors = {
    early: "#1e88e5", // Azul → llegó antes
    on_time: "#4caf50", // Verde → puntual
    delay: "#ffb300", // Amarillo → retraso leve (<=10 min)
    late: "#e53935", // Rojo → tarde
    absent: "#9aa3b2", // Gris → no asistió
  };

  const weekData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    const dateStr = date.toISOString().split("T")[0];
    const checkin = checkins.find(
      (c) => c.employeeId === employeeId && c.date === dateStr
    );

    let status = "absent";
    if (checkin && checkin.checkinTime) {
      const checkinTime = new Date(`2000-01-01 ${checkin.checkinTime}`);
      const limit = new Date("2000-01-01T09:15:00");
      const delayLimit = new Date("2000-01-01T09:25:00");

      if (checkinTime <= new Date("2000-01-01T09:00:00")) status = "early";
      else if (checkinTime <= limit) status = "on_time";
      else if (checkinTime <= delayLimit) status = "delay";
      else status = "late";
    }

    weekData.push({
      day: date.toLocaleDateString("es-MX", { weekday: "short" }),
      status,
      color: colors[status],
      checkin: checkin?.checkinTime || "—",
      checkout: checkin?.checkoutTime || "—",
    });
  }

  return weekData;
};
