// src/lib/metrics.js
// Funciones de utilidad para calcular métricas de empleados.

export const calculatePunctuality = (checkins, days) => {
  if (!checkins || checkins.length === 0) return 0;
  const now = new Date();
  const pastDate = new Date(now.setDate(now.getDate() - days));
  const filteredCheckins = checkins.filter(c => new Date(c.date) >= pastDate && c.checkinTime);
  if (filteredCheckins.length === 0) return 0;
  const punctualCount = filteredCheckins.filter(c => new Date(`2000-01-01T${c.checkinTime}`) <= new Date(`2000-01-01T09:15:00`)).length;
  return ((punctualCount / filteredCheckins.length) * 100).toFixed(0);
};

export const calculateAttendanceStreak = (checkins) => {
  if (!checkins || checkins.length === 0) return 0;
  let streak = 0;
  const sortedCheckins = checkins.sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const checkin of sortedCheckins) {
    if (checkin.checkinTime && checkin.checkoutTime) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

export const calculateGlobalMetrics = (checkins, employees) => {
  const totalEmployees = employees.length;
  const today = new Date().toISOString().split('T')[0];
  const todayCheckins = checkins.filter(c => c.date === today);

  const presentCount = todayCheckins.length;
  const lateCount = todayCheckins.filter(c => new Date(`2000-01-01T${c.checkinTime}`) > new Date(`2000-01-01T09:15:00`)).length;
  const punctualCount = presentCount - lateCount;
  const absenteeCount = totalEmployees - presentCount;

  return {
    totalEmployees,
    presentCount,
    lateCount,
    punctualCount,
    absenteeCount,
    punctualityRate: presentCount > 0 ? ((punctualCount / presentCount) * 100).toFixed(0) : 0,
  };
};

export const calculateDailyPunctuality = (checkins, days) => {
  const today = new Date();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const dailyCheckins = checkins.filter(c => c.date === dateString);
    if (dailyCheckins.length > 0) {
      const punctualCount = dailyCheckins.filter(c => new Date(`2000-01-01T${c.checkinTime}`) <= new Date(`2000-01-01T09:15:00`)).length;
      const punctualRate = (punctualCount / dailyCheckins.length) * 100;
      data.push({ date: dateString, 'Puntualidad %': parseFloat(punctualRate.toFixed(2)) });
    } else {
      data.push({ date: dateString, 'Puntualidad %': 0 });
    }
  }
  return data;
};