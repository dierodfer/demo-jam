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
const OBJETO_KEYS = ['id', 'titulo', 'descripcion', 'categoria', 'tipo', 'estado', 'seccion', 'ubicacion',
  'fechaSuceso', 'fechaPublicacion', 'fechaEntrega', 'publicador', 'contraparte', 'esMio',
  'miReclamacion', 'reclamacionesPendientes'];
const RESUMEN_KEYS = ['id', 'nombre', 'foto', 'departamento'];
const OBJETO_INPUT = {
  titulo: 'Contract Test Objeto',
  descripcion: 'Creado por el test de contrato',
  categoria: 'llaves',
  tipo: 'encontrado',
  seccion: 'recepcion',
  ubicacion: 'Mostrador',
  fechaSuceso: '2026-01-01',
};

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
  let objetoId = null;
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

    const rutasProtegidas = ['/api/objetos-perdidos', '/api/objetos-perdidos/resumen', '/api/empleados'];
    const sinSesion = await Promise.all(rutasProtegidas.map((ruta) => c.request('GET', ruta)));
    sinSesion.forEach((resp, i) => {
      check(`GET ${rutasProtegidas[i]} sin sesión → 401 {error}`,
        resp.status === 401 && typeof resp.json?.error === 'string', `status=${resp.status}`, shape(resp));
    });
    r = await c.request('POST', '/api/objetos-perdidos', OBJETO_INPUT);
    check('POST /api/objetos-perdidos sin sesión → 401', r.status === 401, `status=${r.status}`, shape(r));

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

    // --- Objetos perdidos ---
    r = await c.request('GET', '/api/objetos-perdidos/resumen');
    check('GET /api/objetos-perdidos/resumen → 200 + contadores',
      r.status === 200 && Number.isInteger(r.json?.objetosNuevos) && Number.isInteger(r.json?.reclamacionesPendientes),
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await c.request('GET', '/api/empleados');
    const idAdmin = r.json?.find?.((e) => e.nombre === 'Ana García')?.id;
    check('GET /api/empleados → 200 + directorio mínimo sin username ni email',
      r.status === 200 && Array.isArray(r.json) && r.json.length > 1 && hasKeys(r.json[0], RESUMEN_KEYS)
        && !('username' in r.json[0]) && !('email' in r.json[0]),
      `status=${r.status} body=${JSON.stringify(r.json)?.slice(0, 120)}`, shape(r));

    r = await c.request('GET', '/api/objetos-perdidos');
    check('GET /api/objetos-perdidos → 200 + array con forma correcta y sin empleado_id ni username',
      r.status === 200 && Array.isArray(r.json) && (r.json.length === 0 || hasKeys(r.json[0], OBJETO_KEYS))
        && !JSON.stringify(r.json).includes('username'),
      `status=${r.status} body=${JSON.stringify(r.json)?.slice(0, 120)}`, shape(r));

    r = await c.request('POST', '/api/objetos-perdidos', { ...OBJETO_INPUT, titulo: ' ' });
    check('POST /api/objetos-perdidos sin título → 400 {error}',
      r.status === 400 && typeof r.json?.error === 'string', `status=${r.status}`, shape(r));

    r = await c.request('POST', '/api/objetos-perdidos', { ...OBJETO_INPUT, tipo: 'robado' });
    check('POST /api/objetos-perdidos con tipo inválido → 400', r.status === 400, `status=${r.status}`, shape(r));

    r = await c.request('POST', '/api/objetos-perdidos', OBJETO_INPUT);
    objetoId = r.json?.id;
    check('POST /api/objetos-perdidos → 201 + objeto abierto del publicador',
      r.status === 201 && Number.isInteger(objetoId) && hasKeys(r.json, OBJETO_KEYS)
        && r.json.estado === 'abierto' && r.json.esMio === true && r.json.publicador?.id === idAdmin,
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await c.request('PUT', `/api/objetos-perdidos/${objetoId}`, { ...OBJETO_INPUT, titulo: 'Contract Test Objeto v2' });
    check('PUT /api/objetos-perdidos/{id} → 200 y aplica el cambio',
      r.status === 200 && r.json?.titulo === 'Contract Test Objeto v2', `status=${r.status}`, shape(r));

    r = await c.request('GET', '/api/objetos-perdidos?tipo=encontrado&categoria=llaves&seccion=recepcion&q=v2');
    check('GET /api/objetos-perdidos con filtros incluye el objeto',
      r.status === 200 && r.json?.some?.((o) => o.id === objetoId), `status=${r.status}`, shape(r));

    r = await c.request('GET', '/api/objetos-perdidos?estado=entregado&q=v2');
    check('GET /api/objetos-perdidos con estado=entregado no lo incluye',
      r.status === 200 && !r.json?.some?.((o) => o.id === objetoId), `status=${r.status}`, shape(r));

    r = await c.request('GET', '/api/objetos-perdidos/999999');
    check('GET /api/objetos-perdidos/{id} inexistente → 404', r.status === 404, `status=${r.status}`, shape(r));

    r = await c.request('POST', `/api/objetos-perdidos/${objetoId}/reclamaciones`, { mensaje: 'es mío' });
    check('POST reclamaciones sobre el propio objeto → 400', r.status === 400, `status=${r.status}`, shape(r));

    // Otro empleado (sherpai): ve el objeto, no puede gestionarlo y lo reclama
    const otro = new Client(base);
    r = await otro.request('POST', '/api/login', { username: 'sherpai', password: '1234' });
    const idSherpai = r.json?.id;
    r = await otro.request('GET', `/api/objetos-perdidos/${objetoId}`);
    check('Otro empleado ve el objeto con esMio=false y sin reclamaciones pendientes',
      r.status === 200 && r.json?.esMio === false && r.json?.reclamacionesPendientes === 0,
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await otro.request('PUT', `/api/objetos-perdidos/${objetoId}`, OBJETO_INPUT);
    check('PUT de un objeto ajeno → 404', r.status === 404, `status=${r.status}`, shape(r));
    r = await otro.request('DELETE', `/api/objetos-perdidos/${objetoId}`);
    check('DELETE de un objeto ajeno → 404', r.status === 404, `status=${r.status}`, shape(r));
    r = await otro.request('POST', `/api/objetos-perdidos/${objetoId}/entrega`, { contraparteId: idAdmin });
    check('POST entrega de un objeto ajeno → 404', r.status === 404, `status=${r.status}`, shape(r));
    r = await otro.request('GET', `/api/objetos-perdidos/${objetoId}/reclamaciones`);
    check('GET reclamaciones de un objeto ajeno → 404', r.status === 404, `status=${r.status}`, shape(r));

    r = await otro.request('POST', `/api/objetos-perdidos/${objetoId}/reclamaciones`, { mensaje: 'Son mis llaves' });
    const reclamacionId = r.json?.id;
    check('POST reclamaciones → 201 + pendiente',
      r.status === 201 && r.json?.estado === 'pendiente' && r.json?.reclamante?.id === idSherpai,
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await otro.request('POST', `/api/objetos-perdidos/${objetoId}/reclamaciones`, {});
    check('Reclamar dos veces el mismo objeto → 409', r.status === 409, `status=${r.status}`, shape(r));

    r = await otro.request('GET', '/api/objetos-perdidos?reclamados=true');
    check('GET ?reclamados=true lista el objeto con miReclamacion=pendiente',
      r.status === 200 && r.json?.find?.((o) => o.id === objetoId)?.miReclamacion === 'pendiente',
      `status=${r.status}`, shape(r));

    r = await c.request('GET', '/api/objetos-perdidos?mios=true');
    check('GET ?mios=true del publicador informa 1 reclamación pendiente',
      r.status === 200 && r.json?.find?.((o) => o.id === objetoId)?.reclamacionesPendientes === 1,
      `status=${r.status}`, shape(r));

    r = await c.request('GET', `/api/objetos-perdidos/${objetoId}/reclamaciones`);
    check('GET reclamaciones del publicador → 200 + lista',
      r.status === 200 && r.json?.length === 1 && r.json[0].id === reclamacionId, `status=${r.status}`, shape(r));

    r = await c.request('PUT', `/api/objetos-perdidos/${objetoId}/reclamaciones/${reclamacionId}`, { estado: 'pendiente' });
    check('PUT reclamación con estado inválido → 400', r.status === 400, `status=${r.status}`, shape(r));

    r = await c.request('POST', `/api/objetos-perdidos/${objetoId}/entrega`, { contraparteId: 999999 });
    check('POST entrega a un empleado inexistente → 400', r.status === 400, `status=${r.status}`, shape(r));
    r = await c.request('POST', `/api/objetos-perdidos/${objetoId}/entrega`, { contraparteId: idAdmin });
    check('POST entrega al propio publicador → 400', r.status === 400, `status=${r.status}`, shape(r));

    r = await c.request('POST', `/api/objetos-perdidos/${objetoId}/entrega`, { contraparteId: idSherpai });
    check('POST entrega → 200 + entregado con contraparte y fecha',
      r.status === 200 && r.json?.estado === 'entregado' && r.json?.contraparte?.id === idSherpai
        && /^\d{4}-\d{2}-\d{2}$/.test(r.json?.fechaEntrega ?? ''),
      `status=${r.status} body=${JSON.stringify(r.json)}`, shape(r));

    r = await otro.request('GET', '/api/objetos-perdidos?reclamados=true');
    check('Tras entregar, la reclamación del destinatario queda aceptada',
      r.json?.find?.((o) => o.id === objetoId)?.miReclamacion === 'aceptada', `body=${JSON.stringify(r.json)?.slice(0, 120)}`, shape(r));

    r = await c.request('POST', `/api/objetos-perdidos/${objetoId}/entrega`, { contraparteId: idSherpai });
    check('POST entrega de un objeto ya entregado → 409', r.status === 409, `status=${r.status}`, shape(r));
    r = await c.request('PUT', `/api/objetos-perdidos/${objetoId}`, OBJETO_INPUT);
    check('PUT de un objeto entregado → 409', r.status === 409, `status=${r.status}`, shape(r));
    r = await c.request('PUT', `/api/objetos-perdidos/${objetoId}/reclamaciones/${reclamacionId}`, { estado: 'rechazada' });
    check('PUT reclamación en un objeto entregado → 409', r.status === 409, `status=${r.status}`, shape(r));

    r = await c.request('DELETE', `/api/objetos-perdidos/${objetoId}`);
    check('DELETE /api/objetos-perdidos/{id} → 204', r.status === 204, `status=${r.status}`, shape(r));
    if (r.status === 204) objetoId = null;

    r = await c.request('DELETE', '/api/objetos-perdidos/999999');
    check('DELETE /api/objetos-perdidos/{id} inexistente → 404', r.status === 404, `status=${r.status}`, shape(r));

    await otro.request('POST', '/api/logout');

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
      if (objetoId != null) {
        await limpiador.request('DELETE', `/api/objetos-perdidos/${objetoId}`);
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
