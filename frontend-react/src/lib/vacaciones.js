export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

// Celdas de un mes empezando en lunes; null = hueco antes del día 1.
export function buildMonth(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export function dateKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Datos de demo para 2026 (replican la captura del portal original).
export const DEMO = {
  year: 2026,
  // Festivos (en rojo).
  holidays: [
    '2026-01-01', '2026-01-06', '2026-01-20', '2026-02-28',
    '2026-04-02', '2026-04-03', '2026-05-01', '2026-08-03',
    '2026-08-15', '2026-10-12', '2026-11-02', '2026-12-07',
    '2026-12-08', '2026-12-25',
  ],
  // Periodo ya disfrutado (fondo amarillo).
  usedFrom: '2026-01-05',
  usedTo: '2026-03-31',
  // Días solicitados/marcados (subrayado verde).
  selected: [
    '2026-01-05', '2026-01-06', '2026-01-07', '2026-04-20', '2026-06-19',
    '2026-08-07', '2026-08-14', '2026-08-21', '2026-08-28', '2026-08-31',
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
  ],
  resumen: {
    acumulados: '0 (de 1 día)',
    naturales: 23,
    utilizados: 13,
    disponibles: 11,
  },
};

export function dayFlags(key, year) {
  const inYear = year === DEMO.year;
  return {
    holiday: inYear && DEMO.holidays.includes(key),
    used: inYear && key >= DEMO.usedFrom && key <= DEMO.usedTo,
    selected: inYear && DEMO.selected.includes(key),
  };
}

export function todayKey() {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
}
