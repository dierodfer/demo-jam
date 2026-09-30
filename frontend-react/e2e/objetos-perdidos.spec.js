import { test, expect, request as apiRequest } from '@playwright/test';

// Requiere el backend arrancado y la API en VITE_API_BASE (por defecto :8080).
const API = process.env.VITE_API_BASE || 'http://localhost:8080';
const PREFIJO = 'E2E ';
const USUARIOS = { admin: 'x', sherpai: '1234' };

const titulo = (nombre) => `${PREFIJO}${nombre} ${Date.now()}`;

async function apiComo(usuario) {
  const ctx = await apiRequest.newContext({ baseURL: API });
  const res = await ctx.post('/api/login', { data: { username: usuario, password: USUARIOS[usuario] } });
  expect(res.ok()).toBeTruthy();
  return ctx;
}

async function crearObjeto(usuario, datos) {
  const ctx = await apiComo(usuario);
  const res = await ctx.post('/api/objetos-perdidos', {
    data: { categoria: 'llaves', tipo: 'encontrado', seccion: 'recepcion', ubicacion: 'Mostrador', ...datos },
  });
  expect(res.status()).toBe(201);
  const objeto = await res.json();
  await ctx.dispose();
  return objeto;
}

async function reclamarPorApi(usuario, objetoId) {
  const ctx = await apiComo(usuario);
  expect((await ctx.post(`/api/objetos-perdidos/${objetoId}/reclamaciones`, { data: { mensaje: 'Es mío' } })).status()).toBe(201);
  await ctx.dispose();
}

async function entrar(page, usuario) {
  await page.goto('/');
  await page.getByPlaceholder('Usuario').fill(usuario);
  await page.getByPlaceholder('Contraseña').fill(USUARIOS[usuario]);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Portal empleado')).toBeVisible();
}

async function abrirObjetos(page) {
  await page.getByRole('button', { name: /^Objetos perdidos/ }).click();
  await expect(page.getByRole('heading', { name: 'Objetos perdidos' })).toBeVisible();
}

const tarjeta = (page, texto) => page.getByTestId('objeto-card').filter({ hasText: texto });

test.afterEach(async () => {
  for (const usuario of Object.keys(USUARIOS)) {
    const ctx = await apiComo(usuario);
    const propios = await (await ctx.get('/api/objetos-perdidos?mios=true')).json();
    for (const o of propios.filter((x) => x.titulo.startsWith(PREFIJO))) {
      await ctx.delete(`/api/objetos-perdidos/${o.id}`);
    }
    await ctx.dispose();
  }
});

test('publicar un objeto, filtrarlo y verlo tras recargar', async ({ page }) => {
  const nombre = titulo('Llaves');
  await entrar(page, 'admin');
  await abrirObjetos(page);

  await page.getByTestId('publicar-objeto').click();
  const form = page.getByRole('dialog', { name: 'Publicar objeto' });
  await form.getByRole('radio', { name: 'He encontrado algo' }).click();
  await form.getByLabel('Título').fill(nombre);
  await form.getByLabel('Categoría').selectOption('llaves');
  await form.getByLabel('Sección de la oficina').selectOption('cocina');
  await form.getByLabel('Dónde exactamente').fill('Junto a la cafetera');
  await form.getByLabel('Desde cuándo').fill('2026-09-01');
  await form.getByRole('button', { name: 'Guardar' }).click();

  await expect(tarjeta(page, nombre)).toBeVisible();
  await expect(tarjeta(page, nombre)).toContainText('Cocina · Junto a la cafetera');
  await expect(tarjeta(page, nombre)).toContainText('desde 01/09/2026');

  await page.getByLabel('Categoría').selectOption('movil');
  await expect(tarjeta(page, nombre)).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar' }).click();
  await page.getByLabel('Buscar').fill(nombre);
  await expect(tarjeta(page, nombre)).toBeVisible();

  await page.reload();
  await abrirObjetos(page);
  await page.getByRole('tab', { name: 'Mis publicaciones' }).click();
  await expect(tarjeta(page, nombre)).toBeVisible();
});

test('publicar con el título vacío muestra un error y no crea el objeto', async ({ page }) => {
  await entrar(page, 'admin');
  await abrirObjetos(page);
  await page.getByTestId('publicar-objeto').click();
  const form = page.getByRole('dialog', { name: 'Publicar objeto' });
  await form.getByRole('button', { name: 'Guardar' }).click();
  await expect(form.getByRole('alert')).toHaveText('El título es obligatorio');
});

test('reclamar, aceptar y entregar con la animación de devolución', async ({ page, browser, baseURL }) => {
  const nombre = titulo('Auriculares');
  await crearObjeto('admin', { titulo: nombre, categoria: 'auriculares' });

  // Otro empleado ve la novedad y reclama el objeto
  const paginaSherpai = await (await browser.newContext({ baseURL })).newPage();
  await entrar(paginaSherpai, 'sherpai');
  await expect(paginaSherpai.getByTestId('objetos-badge')).toBeVisible();
  await abrirObjetos(paginaSherpai);
  await tarjeta(paginaSherpai, nombre).click();
  const detalleSherpai = paginaSherpai.getByTestId('objeto-detalle');
  await detalleSherpai.getByLabel('Es mío: cuéntale por qué').fill('Son mis auriculares');
  await detalleSherpai.getByRole('button', { name: 'Reclamar objeto' }).click();
  await expect(paginaSherpai.getByTestId('mi-reclamacion')).toContainText('Pendiente');

  // El publicador ve la reclamación, la acepta y entrega el objeto
  await entrar(page, 'admin');
  await expect(page.getByTestId('objetos-badge')).toBeVisible();
  await abrirObjetos(page);
  await page.getByRole('tab', { name: 'Mis publicaciones' }).click();
  await expect(tarjeta(page, nombre)).toContainText('1 reclamación(es)');
  await tarjeta(page, nombre).click();
  const detalle = page.getByTestId('objeto-detalle');
  await expect(detalle.getByTestId('reclamacion')).toContainText('Son mis auriculares');
  await detalle.getByRole('button', { name: 'Aceptar' }).click();
  await expect(detalle.getByTestId('reclamacion')).toContainText('Aceptada');
  await detalle.getByRole('button', { name: 'Dar por entregado' }).click();

  const entrega = page.getByTestId('entrega');
  await expect(entrega.getByLabel('¿A quién se lo entregas?')).not.toHaveValue('');
  const objeto = page.getByTestId('entrega-objeto');
  const antes = (await objeto.boundingBox()).x;
  await entrega.getByRole('button', { name: 'Confirmar entrega' }).click();
  await expect(page.getByTestId('entrega-estado')).toContainText('Objeto entregado a Sherpai');
  const despues = (await objeto.boundingBox()).x;
  expect(despues - antes).toBeGreaterThan(100);
  await entrega.getByRole('button', { name: 'Cerrar' }).click();

  await expect(tarjeta(page, nombre)).toContainText('Entregado');

  // La entrega persiste y se puede volver a ver
  await page.reload();
  await abrirObjetos(page);
  await page.getByRole('tab', { name: 'Mis publicaciones' }).click();
  await tarjeta(page, nombre).click();
  await page.getByRole('button', { name: 'Ver entrega' }).click();
  await expect(page.getByTestId('entrega')).toContainText('Entrega realizada');
  await page.getByRole('button', { name: 'Repetir animación' }).click();
  await expect(page.getByTestId('entrega-estado')).toContainText('Objeto entregado a Sherpai');

  // El destinatario ve la reclamación aceptada
  await paginaSherpai.reload();
  await abrirObjetos(paginaSherpai);
  await paginaSherpai.getByRole('tab', { name: 'Mis reclamaciones' }).click();
  await expect(tarjeta(paginaSherpai, nombre)).toContainText('Entregado');
  await paginaSherpai.context().close();
});

test('no se puede reclamar el propio objeto ni reclamar dos veces', async ({ page }) => {
  const nombre = titulo('Cartera');
  const { id } = await crearObjeto('sherpai', { titulo: nombre, categoria: 'cartera' });
  await reclamarPorApi('admin', id);

  await entrar(page, 'admin');
  await abrirObjetos(page);
  await tarjeta(page, nombre).click();
  const detalle = page.getByTestId('objeto-detalle');
  await expect(page.getByTestId('mi-reclamacion')).toContainText('Pendiente');
  await expect(detalle.getByRole('button', { name: 'Reclamar objeto' })).toHaveCount(0);
  await expect(detalle.getByRole('button', { name: 'Dar por entregado' })).toHaveCount(0);
});

test.describe('con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('la entrega funciona sin desplazamiento animado', async ({ page }) => {
    const nombre = titulo('Móvil');
    const objeto = await crearObjeto('admin', { titulo: nombre, categoria: 'movil' });
    await reclamarPorApi('sherpai', objeto.id);

    await entrar(page, 'admin');
    await abrirObjetos(page);
    await page.getByRole('tab', { name: 'Mis publicaciones' }).click();
    await tarjeta(page, nombre).click();
    await page.getByRole('button', { name: 'Dar por entregado' }).click();
    const entrega = page.getByTestId('entrega');
    await entrega.getByLabel('¿A quién se lo entregas?').selectOption({ label: 'Sherpai · Tecnología' });
    await entrega.getByRole('button', { name: 'Confirmar entrega' }).click();
    await expect(page.getByTestId('entrega-estado')).toContainText('Objeto entregado a Sherpai');
  });
});

test('un objeto perdido viaja del destinatario al publicador', async ({ page }) => {
  const nombre = titulo('Chaqueta');
  await crearObjeto('admin', { titulo: nombre, categoria: 'ropa', tipo: 'perdido' });

  await entrar(page, 'admin');
  await abrirObjetos(page);
  await page.getByRole('tab', { name: 'Mis publicaciones' }).click();
  await tarjeta(page, nombre).click();
  await page.getByRole('button', { name: 'Dar por entregado' }).click();
  const entrega = page.getByTestId('entrega');
  await expect(entrega.getByLabel('¿Quién lo ha encontrado?')).toBeVisible();
  await entrega.getByLabel('¿Quién lo ha encontrado?').selectOption({ label: 'Sherpai · Tecnología' });
  await entrega.getByRole('button', { name: 'Confirmar entrega' }).click();
  await expect(page.getByTestId('entrega-estado')).toContainText('Objeto entregado a Ana García');
});
