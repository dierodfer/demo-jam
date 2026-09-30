// Todas las peticiones llevan credentials: 'include' para la cookie de sesión.
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const login = (username, password) =>
  request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const getMe = () => request('/api/me');

export const updateMe = (perfil) =>
  request('/api/me', { method: 'PUT', body: JSON.stringify(perfil) });

export const logout = () => request('/api/logout', { method: 'POST' });

export const listCertificaciones = () => request('/api/certificaciones');

export const createCertificacion = (data) =>
  request('/api/certificaciones', { method: 'POST', body: JSON.stringify(data) });

export const updateCertificacion = (id, data) =>
  request(`/api/certificaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteCertificacion = (id) =>
  request(`/api/certificaciones/${id}`, { method: 'DELETE' });

export const listEmpleados = () => request('/api/empleados');

export function listObjetos(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== '' && v !== false && v != null) params.set(k, String(v));
  });
  const qs = params.toString();
  return request(`/api/objetos-perdidos${qs ? `?${qs}` : ''}`);
}

export const getResumenObjetos = () => request('/api/objetos-perdidos/resumen');

export const createObjeto = (data) =>
  request('/api/objetos-perdidos', { method: 'POST', body: JSON.stringify(data) });

export const updateObjeto = (id, data) =>
  request(`/api/objetos-perdidos/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteObjeto = (id) =>
  request(`/api/objetos-perdidos/${id}`, { method: 'DELETE' });

export const entregarObjeto = (id, contraparteId) =>
  request(`/api/objetos-perdidos/${id}/entrega`, { method: 'POST', body: JSON.stringify({ contraparteId }) });

export const listReclamaciones = (id) => request(`/api/objetos-perdidos/${id}/reclamaciones`);

export const reclamarObjeto = (id, mensaje) =>
  request(`/api/objetos-perdidos/${id}/reclamaciones`, { method: 'POST', body: JSON.stringify({ mensaje }) });

export const resolverReclamacion = (id, reclamacionId, estado) =>
  request(`/api/objetos-perdidos/${id}/reclamaciones/${reclamacionId}`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
