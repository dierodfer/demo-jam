import { useEffect, useMemo, useRef, useState } from 'react';
import {
  listCertificaciones, createCertificacion, updateCertificacion, deleteCertificacion,
} from '../lib/api.js';
import Modal from './Modal.jsx';

const COLUMNAS = [
  { id: 'conocimiento', label: 'Conocimiento / Certificación', sortable: true, izq: true },
  { id: 'empresaEmisora', label: 'Empresa emisora', sortable: true },
  { id: 'fecha', label: 'Fecha', sortable: true },
];

function iconoOrden(activo, dir) {
  if (!activo) return '⇅';
  return dir === 'asc' ? '▲' : '▼';
}

const VACIA = { conocimiento: '', empresaEmisora: '', fecha: '' };

export default function Conocimientos() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [buscar, setBuscar] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ campo: 'conocimiento', dir: 'asc' });

  const [editando, setEditando] = useState(null); // null | {id?, conocimiento, ...}
  const [borrando, setBorrando] = useState(null); // null | item

  async function recargar() {
    setCargando(true);
    setError('');
    try {
      setItems(await listCertificaciones());
    } catch {
      setError('No se pudieron cargar las certificaciones');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { recargar(); }, []);

  const filtradas = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    let arr = items;
    if (q) {
      arr = arr.filter((c) =>
        [c.conocimiento, c.empresaEmisora, c.fecha]
          .some((v) => (v ?? '').toLowerCase().includes(q)));
    }
    const { campo, dir } = sort;
    arr = [...arr].sort((a, b) => {
      const r = String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'es', { numeric: true });
      return dir === 'asc' ? r : -r;
    });
    return arr;
  }, [items, buscar, sort]);

  const total = filtradas.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageActual = Math.min(page, totalPages);
  const inicio = total === 0 ? 0 : (pageActual - 1) * pageSize;
  const visibles = filtradas.slice(inicio, inicio + pageSize);

  function cambiarSort(campo) {
    setSort((s) => (s.campo === campo
      ? { campo, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { campo, dir: 'asc' }));
  }

  async function guardar(datos) {
    if (editando.id) {
      await updateCertificacion(editando.id, datos);
    } else {
      await createCertificacion(datos);
    }
    setEditando(null);
    await recargar();
  }

  async function confirmarBorrado() {
    await deleteCertificacion(borrando.id);
    setBorrando(null);
    await recargar();
  }

  return (
    <div>
      <div className="cert-top">
        <div className="cert-mostrar">
          Mostrar{' '}
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>{' '}
          registros
        </div>
        <label className="cert-buscar">
          Buscar:{' '}
          <input
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); setPage(1); }}
          />
        </label>
      </div>

      <table className="cert-tabla">
        <thead>
          <tr>
            {COLUMNAS.map((col) => {
              const activo = sort.campo === col.id;
              return (
                <th
                  key={col.id}
                  className={`${col.sortable ? 'sortable ' : ''}${col.izq ? 'cert-col-conocimiento' : ''}`}
                  onClick={col.sortable ? () => cambiarSort(col.id) : undefined}
                >
                  {col.label}
                  {col.sortable && (
                    <span className={`cert-sort${activo ? ' activo' : ''}`}>
                      {iconoOrden(activo, sort.dir)}
                    </span>
                  )}
                </th>
              );
            })}
            <th>Opciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando && (
            <tr><td className="cert-vacio" colSpan={4}>Cargando…</td></tr>
          )}
          {!cargando && error && (
            <tr><td className="cert-vacio" colSpan={4}>{error}</td></tr>
          )}
          {!cargando && !error && visibles.length === 0 && (
            <tr><td className="cert-vacio" colSpan={4}>No hay registros disponibles</td></tr>
          )}
          {!cargando && !error && visibles.map((c) => (
            <tr key={c.id}>
              <td className="cert-col-conocimiento">{c.conocimiento}</td>
              <td>{c.empresaEmisora}</td>
              <td>{c.fecha}</td>
              <td>
                <div className="cert-acciones">
                  <button className="cert-icono" title="Editar" onClick={() => setEditando(c)}>✏️</button>
                  <button className="cert-icono borrar" title="Eliminar" onClick={() => setBorrando(c)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cert-footer">
        <div className="cert-info">
          {total === 0
            ? 'Mostrando 0 de 0 registros'
            : `Mostrando ${inicio + 1} a ${Math.min(inicio + pageSize, total)} de un total de ${total} registros`}
        </div>
        <div className="cert-paginacion">
          <button
            className="cert-pag"
            disabled={pageActual <= 1}
            onClick={() => setPage(pageActual - 1)}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`cert-pag${n === pageActual ? ' activo' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            className="cert-pag"
            disabled={pageActual >= totalPages}
            onClick={() => setPage(pageActual + 1)}
          >
            ›
          </button>
        </div>
      </div>

      <button className="cert-anadir" onClick={() => setEditando({ ...VACIA })}>Añadir</button>

      {editando && (
        <FormularioModal
          inicial={editando}
          onCancel={() => setEditando(null)}
          onSave={guardar}
        />
      )}

      {borrando && (
        <Modal onClose={() => setBorrando(null)}>
          <div className="modal-head">Eliminar certificación</div>
          <div className="modal-texto">
            ¿Seguro que quieres eliminar «{borrando.conocimiento}»?
          </div>
          <div className="modal-foot">
            <button className="btn" onClick={() => setBorrando(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={confirmarBorrado}>Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FormularioModal({ inicial, onCancel, onSave }) {
  const [form, setForm] = useState({
    conocimiento: inicial.conocimiento ?? '',
    empresaEmisora: inicial.empresaEmisora ?? '',
    fecha: inicial.fecha ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const primerCampo = useRef(null);

  useEffect(() => { primerCampo.current?.focus(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.conocimiento.trim()) {
      setError('El conocimiento / certificación es obligatorio');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(form);
    } catch {
      setError('No se pudo guardar');
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onCancel}>
      <form onSubmit={submit}>
        <div className="modal-head">{inicial.id ? 'Editar certificación' : 'Nueva certificación'}</div>
        <div className="modal-body">
          <div className="modal-campo">
            <label htmlFor="m-conocimiento">Conocimiento / Certificación</label>
            <input
              id="m-conocimiento"
              value={form.conocimiento}
              onChange={(e) => set('conocimiento', e.target.value)}
              ref={primerCampo}
            />
          </div>
          <div className="modal-campo">
            <label htmlFor="m-empresa">Empresa emisora</label>
            <input
              id="m-empresa"
              value={form.empresaEmisora}
              onChange={(e) => set('empresaEmisora', e.target.value)}
            />
          </div>
          <div className="modal-campo">
            <label htmlFor="m-fecha">Fecha</label>
            <input
              id="m-fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
            />
          </div>
          {error && <span className="perfil-error">{error}</span>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
