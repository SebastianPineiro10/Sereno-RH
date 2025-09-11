// src/components/WeeklyStatusCard.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Card from "./Card";
import "./WeeklyStatusCard.css"; // 🔹 Importamos estilos

const WeeklyStatusCard = ({ employee, weeklyStatus }) => {
  const data = weeklyStatus.map((day) => ({
    name: day.day,
    value: 1,
    color: day.color,
    checkin: day.checkin,
    checkout: day.checkout,
    status: day.status,
  }));

  const estados = {
    early: "Llegó antes de tiempo",
    on_time: "Puntual",
    delay: "Pequeño retraso",
    late: "Llegó tarde",
    absent: "Faltó",
  };

  return (
    <Card title={`Asistencia semanal - ${employee.name}`}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={(entry) => entry.name.toUpperCase()}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>

          {/* Tooltip con estilos externos */}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const { name, status, checkin, checkout, color } =
                  payload[0].payload;
                return (
                  <div
                    className="weekly-tooltip"
                    style={{ border: `1.5px solid ${color}` }}
                  >
                    <strong>{name.toUpperCase()}</strong>
                    <p>{estados[status]}</p>
                    <p>Entrada: {checkin || "—"}</p>
                    <p>Salida: {checkout || "—"}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda de colores */}
      <div className="weekly-status-legend">
        <span className="legend early">Azul: Temprano</span>
        <span className="legend on-time">Verde: Puntual</span>
        <span className="legend delay">Amarillo: Retraso</span>
        <span className="legend late">Rojo: Tarde</span>
      </div>
    </Card>
  );
};

export default WeeklyStatusCard;
