#!/usr/bin/env node
// Test de contrato del Portal de Empleado.
//
// Ejecuta la batería de comprobaciones (shared/openapi.yaml) contra el backend.
// Deja la base de datos como estaba: restaura el perfil y borra las
// certificaciones que crea.
//
// Uso:
//   node scripts/contract-test.mjs http://localhost:8080
//
// Requiere Node 18+ (fetch nativo). Sin dependencias.

const USERNAME = process.env.SEED_USERNAME || 'admin';
const CLAVE_ARBITRARIA = String(Date.now());

const PERFIL_KEYS = ['id', 'nombre', 'email', 'telefono', 'puesto', 'departamento', 'direccion', 'foto'];
const CERT_KEYS = ['id', 'conocimiento', 'empresaEmisora', 'fecha'];

/** Cliente HTTP con jar de cookies (para la cookie de sesión). */
class Client {
  constructor(base) {
    this.base = base;
    this.cookies = new Map();
  }

  async request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.cookies.size > 0) {
      headers.Cookie = [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    }
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const [pair] = sc.split(';');
      const eq = pair.indexOf('=');
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (value === '' || /Max-Age=-\d/i.test(sc)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    let json = null;
    if (res.status !== 204) {
      json = await res.json().catch(() => null);
    }
    return { status: res.status, json };
  }

  clearCookies() { this.cookies.clear(); }
}

/** Ejecuta la batería contra un backend. Devuelve {ok, checks} con snapshots de forma. */
async function suite(base) {
  const c = new Client(base);
  const checks = [];
  let creadaId = null;
  let telefonoOriginal = null;

  const check = (nombre, cond, detalle, shape) => {
    checks.push({ nombre, ok: !!cond, detalle: cond ? '' : detalle, shape });
    const icon = cond ? '  ✓' : '  ✗';
    const sufijo = cond ? '' : ` — ${detalle}`;
    console.log(`${icon} ${nombre}${sufijo}`);
  };
  const keysOf = (obj) => (obj && typeof obj === 'object' ? Object.keys(obj).sort((a, b) => a.localeCompare(b)) : null);
  const shape = (r) => JSON.stringify({ status: r.status, keys: keysOf(Array.isArray(r.json) ? r.json[0] : r.json) });
  const hasKeys = (obj, keys) => obj && keys.every((k) => k in obj);

  try {
    // --- Sin sesión ---
    let r = await c.request('GET', '/api/me');
    check('GET /api/me sin sesión → 401 {error}', r.status === 401 && typeof r.json?.error === 'string',
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await c.request('GET', '/api/certificaciones');
    check('GET /api/certificaciones sin sesión → 401', r.status === 401, `status=${r.status}`, shape(r));

    r = await c.request('POST', '/api/login', { username: 'usuario-inexistente', password: 'x' });
    check('POST /api/login username incorrecto → 401', r.status === 401, `status=${r.status}`, shape(r));

    r = await c.request('POST', '/api/login', { username: 'sherpai', password: 'incorrecta' });
    check('POST /api/login sherpai con contraseña incorrecta → 401', r.status === 401, `status=${r.status}`, shape(r));

    r = await c.request('POST', '/api/login', { username: 'sherpai', password: '1234' });
    check('POST /api/login sherpai con contraseña correcta → 200 + perfil + cookie',
      r.status === 200 && hasKeys(r.json, PERFIL_KEYS) && c.cookies.size > 0,
      `status=${r.status} keys=${keysOf(r.json)} cookies=${c.cookies.size}`, shape(r));
    await c.request('POST', '/api/logout');
    c.clearCookies();

    for (const username of ['maria', 'carlos', 'lucia']) {
      r = await c.request('POST', '/api/login', { username, password: '1234' });
      check(`POST /api/login ${username} → 200 + perfil + cookie`,
        r.status === 200 && hasKeys(r.json, PERFIL_KEYS) && c.cookies.size > 0,
        `status=${r.status} keys=${keysOf(r.json)} cookies=${c.cookies.size}`, shape(r));
      await c.request('POST', '/api/logout');
      c.clearCookies();
    }

    // --- Login ---
    r = await c.request('POST', '/api/login', { username: USERNAME, password: CLAVE_ARBITRARIA });
    check('POST /api/login correcto → 200 + perfil + cookie',
      r.status === 200 && hasKeys(r.json, PERFIL_KEYS) && c.cookies.size > 0,
      `status=${r.status} keys=${keysOf(r.json)} cookies=${c.cookies.size}`, shape(r));

    // --- Perfil ---
    r = await c.request('GET', '/api/me');
    check('GET /api/me con sesión → 200 + 7 campos + id',
      r.status === 200 && hasKeys(r.json, PERFIL_KEYS),
      `status=${r.status} keys=${keysOf(r.json)}`, shape(r));
    telefonoOriginal = r.json?.telefono;

    r = await c.request('PUT', '/api/me', { telefono: '+34 000 CONTRACT' });
    check('PUT /api/me → 200 y aplica el cambio',
      r.status === 200 && r.json?.telefono === '+34 000 CONTRACT',
      `status=${r.status} telefono=${r.json?.telefono}`, shape(r));

    // --- Certificaciones: CRUD ---
    r = await c.request('GET', '/api/certificaciones');
    const esArray = Array.isArray(r.json);
    check('GET /api/certificaciones → 200 + array con forma correcta',
      r.status === 200 && esArray && (r.json.length === 0 || hasKeys(r.json[0], CERT_KEYS)),
      `status=${r.status} body=${JSON.stringify(r.json)?.slice(0, 120)}`, shape(r));
    const totalAntes = esArray ? r.json.length : 0;

    r = await c.request('POST', '/api/certificaciones',
      { conocimiento: 'Contract Test Cert', empresaEmisora: 'ContractCo', fecha: '2026-01-01' });
    creadaId = r.json?.id;
    check('POST /api/certificaciones → 201 + id',
      r.status === 201 && Number.isInteger(creadaId) && hasKeys(r.json, CERT_KEYS),
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await c.request('PUT', `/api/certificaciones/${creadaId}`,
      { conocimiento: 'Contract Test Cert v2', empresaEmisora: 'ContractCo', fecha: '2026-01-02' });
    check('PUT /api/certificaciones/{id} → 200 y aplica el cambio',
      r.status === 200 && r.json?.conocimiento === 'Contract Test Cert v2',
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await c.request('PUT', '/api/certificaciones/999999',
      { conocimiento: 'x', empresaEmisora: 'x', fecha: '2026-01-01' });
    check('PUT /api/certificaciones/{id} inexistente → 404', r.status === 404, `status=${r.status}`, shape(r));

    r = await c.request('DELETE', `/api/certificaciones/${creadaId}`);
    check('DELETE /api/certificaciones/{id} → 204', r.status === 204, `status=${r.status}`, shape(r));
    if (r.status === 204) creadaId = null;

    r = await c.request('DELETE', '/api/certificaciones/999999');
    check('DELETE /api/certificaciones/{id} inexistente → 404', r.status === 404, `status=${r.status}`, shape(r));

    r = await c.request('GET', '/api/certificaciones');
    check('La lista vuelve a su tamaño original',
      r.status === 200 && Array.isArray(r.json) && r.json.length === totalAntes,
      `antes=${totalAntes} ahora=${r.json?.length}`, shape(r));

    // --- Logout ---
    r = await c.request('POST', '/api/logout');
    check('POST /api/logout → 204', r.status === 204, `status=${r.status}`, shape(r));

    r = await c.request('GET', '/api/me');
    check('GET /api/me tras logout → 401', r.status === 401, `status=${r.status}`, shape(r));
  } finally {
    // Restaurar estado pase lo que pase
    try {
      const limpiador = new Client(base);
      await limpiador.request('POST', '/api/login', { username: USERNAME, password: 'x' });
      if (telefonoOriginal != null) {
        await limpiador.request('PUT', '/api/me', { telefono: telefonoOriginal });
      }
      if (creadaId != null) {
        await limpiador.request('DELETE', `/api/certificaciones/${creadaId}`);
      }
      await limpiador.request('POST', '/api/logout');
    } catch { /* mejor esfuerzo */ }
  }

  return { ok: checks.every((x) => x.ok), checks };
}

// ---- main ----

const urls = process.argv.slice(2);
if (urls.length !== 1) {
  console.error('Uso: node scripts/contract-test.mjs <url-backend>');
  process.exit(2);
}

const [base] = urls;
let exitCode = 0;

console.log(`\n=== Contrato contra ${base} ===`);
try {
  const res = await suite(base);
  if (!res.ok) exitCode = 1;
} catch (e) {
  console.error(`  ✗ No se pudo completar la batería: ${e.message}`);
  console.error('    ¿Está el backend arrancado?');
  exitCode = 1;
}

console.log(exitCode === 0 ? '\nCONTRATO OK' : '\nCONTRATO CON FALLOS');
process.exit(exitCode);
