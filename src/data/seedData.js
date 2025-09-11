// src/data/seedData.js
// Datos definitivos para demo profesional

export const seedEmployeesData = [
  { id: "emp-001", name: "Ana García (Admin)", email: "admin@serenorh.com", active: true, role: "admin" },
  { id: "emp-002", name: "Luis Pérez (Empleado)", email: "perez@serenorh.com", active: true, role: "employee" },
  { id: "emp-003", name: "Marta López (Empleado)", email: "marta.lopez@serenorh.com", active: true, role: "employee" }
];

export const seedCheckinsData = [
  // Hoy
  { employeeId: "emp-001", date: "2025-09-10", checkinTime: "08:55 AM", checkoutTime: "05:05 PM", duration: "8h 10m", punctual: true },
  { employeeId: "emp-002", date: "2025-09-10", checkinTime: "09:05 AM", checkoutTime: "06:00 PM", duration: "8h 55m", punctual: false },
  { employeeId: "emp-003", date: "2025-09-10", checkinTime: "08:50 AM", checkoutTime: "05:15 PM", duration: "8h 25m", punctual: true },

  // Ayer
  { employeeId: "emp-001", date: "2025-09-09", checkinTime: "08:40 AM", checkoutTime: "05:00 PM", duration: "8h 20m", punctual: true },
  { employeeId: "emp-002", date: "2025-09-09", checkinTime: "09:10 AM", checkoutTime: "05:45 PM", duration: "8h 35m", punctual: false },
  { employeeId: "emp-003", date: "2025-09-09", checkinTime: "09:00 AM", checkoutTime: "05:30 PM", duration: "8h 30m", punctual: true },

  // Anteayer
  { employeeId: "emp-001", date: "2025-09-08", checkinTime: "08:55 AM", checkoutTime: "05:10 PM", duration: "8h 15m", punctual: true },
  { employeeId: "emp-002", date: "2025-09-08", checkinTime: "09:20 AM", checkoutTime: "06:00 PM", duration: "8h 40m", punctual: false },
  { employeeId: "emp-003", date: "2025-09-08", checkinTime: "08:45 AM", checkoutTime: "05:00 PM", duration: "8h 15m", punctual: true }
];

export const seedRewardsData = [
  { id: "rew-001", name: "Café gratis", pointsRequired: 100 },
  { id: "rew-002", name: "Día libre", pointsRequired: 500 },
  { id: "rew-003", name: "Gift card de $50", pointsRequired: 1000 }
];

export const seedGoalsData = [
  { id: "goal-001", employeeId: "emp-001", month: "2025-09-01", description: "Completar curso de React avanzado", progress: 75 },
  { id: "goal-002", employeeId: "emp-002", month: "2025-09-01", description: "Liderar proyecto X", progress: 50 }
];
