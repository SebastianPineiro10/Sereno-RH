// src/data/seedData.js
// Datos JSON para la carga inicial si localStorage está vacío.

export const seedEmployeesData = [
  { "id": "emp-001", "name": "Ana García (Admin)", "email": "admin@serenorh.com", "active": true, "role": "admin" },
  { "id": "emp-002", "name": "Luis Pérez (Empleado)", "email": "empleado@serenorh.com", "active": true, "role": "employee" },
  { "id": "emp-003", "name": "Marta López (Empleado)", "email": "marta.lopez@serenorh.com", "active": true, "role": "employee" }
];

export const seedCheckinsData = [
  { "employeeId": "emp-001", "date": "2024-10-25", "checkinTime": "08:55", "checkoutTime": "17:05", "duration": "8h 10m" },
  { "employeeId": "emp-002", "date": "2024-10-25", "checkinTime": "09:05", "checkoutTime": "18:00", "duration": "8h 55m" },
  { "employeeId": "emp-001", "date": "2024-10-24", "checkinTime": "09:16", "checkoutTime": "17:30", "duration": "8h 14m" },
  { "employeeId": "emp-003", "date": "2024-10-24", "checkinTime": "09:00", "checkoutTime": "17:00", "duration": "8h 00m" },
  { "employeeId": "emp-001", "date": "2024-10-23", "checkinTime": "09:01", "checkoutTime": "17:15", "duration": "8h 14m" },
  { "employeeId": "emp-002", "date": "2024-10-23", "checkinTime": "09:20", "checkoutTime": "17:50", "duration": "8h 30m" },
  { "employeeId": "emp-003", "date": "2024-10-23", "checkinTime": "09:05", "checkoutTime": "17:10", "duration": "8h 05m" },
  { "employeeId": "emp-001", "date": "2024-10-22", "checkinTime": "08:50", "checkoutTime": "17:00", "duration": "8h 10m" },
  { "employeeId": "emp-002", "date": "2024-10-22", "checkinTime": "09:00", "checkoutTime": "17:30", "duration": "8h 30m" },
  { "employeeId": "emp-003", "date": "2024-10-22", "checkinTime": "09:12", "checkoutTime": "17:20", "duration": "8h 08m" },
  { "employeeId": "emp-001", "date": "2024-10-21", "checkinTime": "09:00", "checkoutTime": "17:00", "duration": "8h 00m" },
  { "employeeId": "emp-002", "date": "2024-10-21", "checkinTime": "08:58", "checkoutTime": "18:00", "duration": "9h 02m" },
  { "employeeId": "emp-003", "date": "2024-10-21", "checkinTime": "09:08", "checkoutTime": "17:15", "duration": "8h 07m" },
  { "employeeId": "emp-001", "date": "2024-10-20", "checkinTime": "09:10", "checkoutTime": "17:30", "duration": "8h 20m" },
  { "employeeId": "emp-002", "date": "2024-10-20", "checkinTime": "09:15", "checkoutTime": "17:45", "duration": "8h 30m" },
  { "employeeId": "emp-003", "date": "2024-10-20", "checkinTime": "09:20", "checkoutTime": "17:40", "duration": "8h 20m" },
];

export const seedRewardsData = [
  { "id": "rew-001", "name": "Café gratis", "pointsRequired": 100 },
  { "id": "rew-002", "name": "Día libre", "pointsRequired": 500 },
  { "id": "rew-003", "name": "Gift card de $50", "pointsRequired": 1000 }
];

export const seedGoalsData = [
  { "id": "goal-001", "employeeId": "emp-001", "month": "2024-10-01", "description": "Completar curso de React avanzado", "progress": 75 },
  { "id": "goal-002", "employeeId": "emp-002", "month": "2024-10-01", "description": "Liderar proyecto X", "progress": 50 }
];