// src/lib/csv.js
// Función de utilidad para exportar datos a CSV.

export const exportToCsv = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar.');
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.warn('Tu navegador no soporta la descarga de archivos. Por favor, copia el contenido manualmente.');
  }
};