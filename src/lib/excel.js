import * as XLSX from "xlsx";

export const exportToExcel = (data, filename = "asistencias.xlsx") => {
  if (!data || data.length === 0) {
    console.warn("No hay datos para exportar.");
    return;
  }

  // Mapeo bilingüe de encabezados
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

  // Reorganizar datos con encabezados traducidos
  const formattedData = data.map(row => {
    const newRow = {};
    headers.forEach(h => {
      newRow[headerMap[h] || h] = row[h];
    });
    return newRow;
  });

  // Crear hoja desde JSON con encabezados personalizados
  const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: translatedHeaders });

  // === Estilos dinámicos para Excel ===

  // 1. Filtros automáticos en la primera fila
  worksheet["!autofilter"] = {
    ref: `A1:${String.fromCharCode(65 + translatedHeaders.length - 1)}${data.length + 1}`
  };

  // 2. Ancho automático de columnas
  worksheet["!cols"] = translatedHeaders.map(() => ({ wch: 24 }));

  // 3. Dar formato de tabla inteligente
  // Generamos el rango de la tabla
  const tableRef = `A1:${String.fromCharCode(65 + translatedHeaders.length - 1)}${data.length + 1}`;

  // Metadata de tabla para Excel
  worksheet["!table"] = {
    name: "TablaAsistencias",
    ref: tableRef,
    headerRow: true,
    totalsRow: false,
    style: {
      theme: "TableStyleMedium2", // colores alternados pro
      showRowStripes: true,
      showColumnStripes: false,
    }
  };

  // Crear libro y agregar hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias");

  // Exportar archivo Excel con compresión
  XLSX.writeFile(workbook, filename, { compression: true });
};
