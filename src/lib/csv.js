// src/lib/csv.js
// Exporta datos a CSV bilingüe (español + inglés) con soporte UTF-8

export const exportToCsv = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No hay datos para exportar.");
    return;
  }

  // Mapear nombres amigables con equivalentes en inglés
  const headerMap = {
    employeeId: "idEmpleado (employeeId)",
    date: "fecha (date)",
    checkinTime: "horaEntrada (checkinTime)",
    checkoutTime: "horaSalida (checkoutTime)",
    duration: "duracion (duration)",
    employeeName: "nombreEmpleado (employeeName)",
    status: "estado (status)",
  };

  const headers = Object.keys(data[0]);
  const translatedHeaders = headers.map(h => headerMap[h] || h);

  const csvContent = [
    translatedHeaders.join(","), 
    ...data.map(row =>
      headers.map(header => {
        const cell = row[header] ?? "";
        return `"${String(cell)
          .normalize("NFC")
          .replace(/"/g, '""')}"`;
      }).join(",")
    )
  ].join("\n");

  // ⚡ Forzamos UTF-8 con BOM
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.warn("Tu navegador no soporta la descarga automática de archivos.");
  }
};
