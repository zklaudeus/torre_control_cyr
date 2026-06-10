export const calcularFechaAnterior = (fechaActual: string): string => {
  const date = new Date(fechaActual + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};
