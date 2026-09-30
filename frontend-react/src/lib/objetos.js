// Catálogos de Objetos perdidos. Los códigos coinciden con los enum de shared/openapi.yaml.

export const CATEGORIAS = [
  { id: 'llaves', label: 'Llaves' },
  { id: 'movil', label: 'Móvil' },
  { id: 'cartera', label: 'Cartera' },
  { id: 'ropa', label: 'Ropa' },
  { id: 'auriculares', label: 'Auriculares' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'otros', label: 'Otros' },
];

export const SECCIONES_OFICINA = [
  { id: 'recepcion', label: 'Recepción' },
  { id: 'planta1', label: 'Planta 1' },
  { id: 'planta2', label: 'Planta 2' },
  { id: 'sala-reuniones', label: 'Sala de reuniones' },
  { id: 'cocina', label: 'Cocina' },
  { id: 'parking', label: 'Parking' },
  { id: 'otras', label: 'Otras zonas' },
];

export const TIPOS = [
  { id: 'perdido', label: 'Perdido' },
  { id: 'encontrado', label: 'Encontrado' },
];

const etiqueta = (lista) => (id) => lista.find((x) => x.id === id)?.label ?? id;

export const labelCategoria = etiqueta(CATEGORIAS);
export const labelSeccion = etiqueta(SECCIONES_OFICINA);
export const labelTipo = etiqueta(TIPOS);

/** Formatea YYYY-MM-DD como DD/MM/YYYY. */
export function fechaCorta(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
