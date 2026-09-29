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
