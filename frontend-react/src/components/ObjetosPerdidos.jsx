import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Avatar from './Avatar.jsx';
import ObjetoIcono from './ObjetoIcono.jsx';
import ObjetoFormModal from './ObjetoFormModal.jsx';
import ObjetoDetalle from './ObjetoDetalle.jsx';
import EntregaObjeto from './EntregaObjeto.jsx';
import { createObjeto, deleteObjeto, listObjetos, updateObjeto } from '../lib/api.js';
import {
  CATEGORIAS, SECCIONES_OFICINA, TIPOS, fechaCorta, labelCategoria, labelSeccion,
} from '../lib/objetos.js';

const TABS = [
  { id: 'todos', label: 'Todos' },
  { id: 'mios', label: 'Mis publicaciones' },
  { id: 'reclamados', label: 'Mis reclamaciones' },
];

const FILTROS_VACIOS = { q: '', tipo: '', estado: '', categoria: '', seccion: '' };

export default function ObjetosPerdidos({ onCambio }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('todos');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [detalleId, setDetalleId] = useState(null);
  const [editando, setEditando] = useState(null); // null | {} (alta) | objeto (edición)
  const [entrega, setEntrega] = useState(null); // null | { objeto, modo, preseleccion }

  const recargar = useCallback(async () => {
    try {
      setItems(await listObjetos({ ...filtros, mios: tab === 'mios', reclamados: tab === 'reclamados' }));
      setError('');
    } catch {
      setError('No se pudieron cargar los objetos');
    } finally {
      setCargando(false);
    }
  }, [filtros, tab]);

  useEffect(() => {
    const espera = setTimeout(recargar, filtros.q ? 250 : 0);
    return () => clearTimeout(espera);
  }, [recargar, filtros.q]);

  const cambio = useCallback(async () => {
    await recargar();
    onCambio?.();
  }, [recargar, onCambio]);

  const setFiltro = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));
  const hayFiltros = Object.values(filtros).some(Boolean);
  const detalle = items.find((o) => o.id === detalleId) ?? null;

  async function guardar(datos) {
    if (editando?.id) await updateObjeto(editando.id, datos);
    else await createObjeto(datos);
    setEditando(null);
    await cambio();
  }

  async function eliminar(objeto) {
    await deleteObjeto(objeto.id);
    setDetalleId(null);
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="obj">
        <div className="obj-cabecera">
          <div>
            <h2>Objetos perdidos</h2>
            <p>Publica lo que hayas encontrado en la oficina o busca lo que hayas perdido.</p>
          </div>
          <button className="btn btn-primary" data-testid="publicar-objeto" onClick={() => setEditando({})}>
            Publicar objeto
          </button>
        </div>

        <div className="obj-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`obj-tab${tab === t.id ? ' activo' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {tab === t.id && <motion.span layoutId="obj-tab-subrayado" className="obj-tab-linea" />}
            </button>
          ))}
        </div>

        <div className="obj-filtros">
          <input
            type="search"
            placeholder="Buscar por título, descripción o lugar"
            aria-label="Buscar"
            value={filtros.q}
            onChange={(e) => setFiltro('q', e.target.value)}
          />
          <select aria-label="Tipo" value={filtros.tipo} onChange={(e) => setFiltro('tipo', e.target.value)}>
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <select aria-label="Estado" value={filtros.estado} onChange={(e) => setFiltro('estado', e.target.value)}>
            <option value="">Cualquier estado</option>
            <option value="abierto">Abierto</option>
            <option value="entregado">Entregado</option>
          </select>
          <select aria-label="Categoría" value={filtros.categoria} onChange={(e) => setFiltro('categoria', e.target.value)}>
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select aria-label="Sección" value={filtros.seccion} onChange={(e) => setFiltro('seccion', e.target.value)}>
            <option value="">Toda la oficina</option>
            {SECCIONES_OFICINA.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {hayFiltros && <button className="btn" onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar</button>}
        </div>

        {cargando && <p className="obj-vacio">Cargando…</p>}
        {!cargando && error && <p className="perfil-error" role="alert">{error}</p>}
        {!cargando && !error && items.length === 0 && (
          <p className="obj-vacio" data-testid="objetos-vacio">No hay objetos que coincidan con la búsqueda.</p>
        )}

        <ul className="obj-grid">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((o, i) => (
              <motion.li
                key={o.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.03 } }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                <button className={`obj-card estado-${o.estado}`} data-testid="objeto-card" onClick={() => setDetalleId(o.id)}>
                  <ObjetoIcono categoria={o.categoria} size={52} />
                  <div className="obj-card-texto">
                    <div className="obj-card-titulo">{o.titulo}</div>
                    <div className="obj-chips">
                      <span className={`obj-chip tipo-${o.tipo}`}>{o.tipo === 'perdido' ? 'Perdido' : 'Encontrado'}</span>
                      {o.estado === 'entregado' && <span className="obj-chip estado-entregado">Entregado</span>}
                      {o.esMio && o.reclamacionesPendientes > 0 && (
                        <span className="obj-chip rec-pendiente">{o.reclamacionesPendientes} reclamación(es)</span>
                      )}
                      {o.miReclamacion && <span className={`obj-chip rec-${o.miReclamacion}`}>Reclamado</span>}
                    </div>
                    <div className="obj-card-lugar">
                      {labelSeccion(o.seccion)}{o.ubicacion ? ` · ${o.ubicacion}` : ''}
                    </div>
                    <div className="obj-card-pie">
                      <Avatar empleado={o.publicador} size={22} />
                      <span>{o.esMio ? 'Tú' : o.publicador.nombre}</span>
                      <span className="obj-card-fecha">
                        {labelCategoria(o.categoria)} · desde {fechaCorta(o.fechaSuceso)}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {editando && (
          <ObjetoFormModal
            inicial={editando.id ? editando : null}
            onCancel={() => setEditando(null)}
            onSave={guardar}
          />
        )}

        {detalle && !editando && !entrega && (
          <ObjetoDetalle
            objeto={detalle}
            onClose={() => setDetalleId(null)}
            onCambio={cambio}
            onEditar={(o) => setEditando(o)}
            onEliminar={eliminar}
            onEntregar={(o, preseleccion) => { setDetalleId(null); setEntrega({ objeto: o, modo: 'nueva', preseleccion }); }}
            onVerEntrega={(o) => { setDetalleId(null); setEntrega({ objeto: o, modo: 'historial' }); }}
          />
        )}

        {entrega && (
          <EntregaObjeto
            objeto={entrega.objeto}
            modo={entrega.modo}
            preseleccion={entrega.preseleccion}
            onClose={() => setEntrega(null)}
            onEntregado={cambio}
          />
        )}
      </div>
    </MotionConfig>
  );
}
