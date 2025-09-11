// src/components/WeeklyStatusCard.jsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Card from "./Card";
import "./WeeklyStatusCard.css";

const WeeklyStatusCard = ({ employee, weeklyStatus }) => {
  // ✅ Fallback si no hay datos
  if (!weeklyStatus || weeklyStatus.length === 0) {
    return (
      <Card title={`Asistencia semanal - ${employee.name}`}>
        <p style={{ textAlign: "center", color: "var(--muted)", fontWeight: 500 }}>
          Sin datos de asistencia aún.
        </p>
      </Card>
    );
  }

  // ✅ Preparamos datos para Recharts
  const data = weeklyStatus.map((day) => ({
    name: day.day,
    value: 1,
    color: day.color,
    checkin: day.checkin,
    checkout: day.checkout,
    status: day.status,
  }));

  // ✅ Textos humanizados
  const estados = {
    early: "Llegó antes de tiempo",
    on_time: "Puntual",
    delay: "Pequeño retraso",
    late: "Llegó tarde",
    absent: "Faltó",
  };

  // ✅ Calculamos porcentajes dinámicos
  const porcentaje = (status) => {
    const total = weeklyStatus.length;
    const count = weeklyStatus.filter((d) => d.status === status).length;
    return Math.round((count / total) * 100);
  };

  return (
    <Card title={`Asistencia semanal - ${employee.name}`}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={85}
            innerRadius={35} // ✅ estilo donut para más elegancia
            dataKey="value"
            label={({ name }) => name.toUpperCase()}
            isAnimationActive={true} // ✅ animación al renderizar
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{ cursor: "pointer" }}
              />
            ))}
          </Pie>

          {/* ✅ Tooltip mejorado */}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const { name, status, checkin, checkout, color } =
                  payload[0].payload;
                return (
                  <div
                    className="weekly-tooltip"
                    style={{
                      border: `1.5px solid ${color}`,
                      boxShadow: `0 0 10px ${color}`,
                    }}
                  >
                    <strong>{name.toUpperCase()}</strong>
                    <p>{estados[status]}</p>
                    <p>Entrada: {checkin || "—"}</p>
                    <p>Salida: {checkout || "—"}</p>
                    <p style={{ marginTop: 6, color: color }}>
                      {porcentaje(status)}% de la semana
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* ✅ Leyenda compacta y clara */}
      <div className="weekly-status-legend">
        <span className="legend early">Azul: Temprano ({porcentaje("early")}%)</span>
        <span className="legend on-time">Verde: Puntual ({porcentaje("on_time")}%)</span>
        <span className="legend delay">Amarillo: Retraso ({porcentaje("delay")}%)</span>
        <span className="legend late">Rojo: Tarde ({porcentaje("late")}%)</span>
      </div>
    </Card>
  );
};

export default WeeklyStatusCard;
