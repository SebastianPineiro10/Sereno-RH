const now = new Date();
const yyyyMm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

export const seedEmployees = [
  { id: "e1", nombre: "Ana García", email: "ana@serenorh.com", rol: "ADMIN", activo: true },
  { id: "e2", nombre: "Luis Pérez", email: "luis@serenorh.com", rol: "EMPLOYEE", activo: true },
  { id: "e3", nombre: "María López", email: "maria@serenorh.com", rol: "EMPLOYEE", activo: false },
];

export const seedRewards = [
  { id: "r1", nombre: "Café gratis", puntos: 100 },
  { id: "r2", nombre: "Día libre", puntos: 500 },
  { id: "r3", nombre: "Gift card $50", puntos: 1000 },
];

export const seedGoals = [
  { id: "g1", empleadoId: "e2", mes: yyyyMm, descripcion: "Llegar puntual 20 días", progreso: 12 },
  { id: "g2", empleadoId: "e3", mes: yyyyMm, descripcion: "Completar 80% de metas", progreso: 55 },
];

export const seedCheckins = [
  { id:"c1", empleadoId:"e2", fecha:"2025-08-08", checkin:"09:03", checkout:"17:22", duracion:"8h 19m", puntual:false },
  { id:"c2", empleadoId:"e2", fecha:"2025-08-09", checkin:"08:57", checkout:"17:11", duracion:"8h 14m", puntual:true },
  { id:"c3", empleadoId:"e3", fecha:"2025-08-08", checkin:"09:11", checkout:"16:40", duracion:"7h 29m", puntual:false },
];
