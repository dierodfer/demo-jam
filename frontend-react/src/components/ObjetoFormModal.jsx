import { useState } from 'react';
import Modal from './Modal.jsx';
import { CATEGORIAS, SECCIONES_OFICINA, TIPOS, hoyISO } from '../lib/objetos.js';

const VACIO = {
  titulo: '', descripcion: '', categoria: 'otros', tipo: 'encontrado',
  seccion: 'recepcion', ubicacion: '', fechaSuceso: hoyISO(),
};

/** Alta y edición de un objeto. `onSave` recibe los datos y puede lanzar un error. */
export default function ObjetoFormModal({ inicial, onCancel, onSave }) {
  const [form, setForm] = useState({
    ...VACIO,
    ...(inicial ? {
      titulo: inicial.titulo ?? '',
      descripcion: inicial.descripcion ?? '',
      categoria: inicial.categoria,
      tipo: inicial.tipo,
      seccion: inicial.seccion,
      ubicacion: inicial.ubicacion ?? '',
      fechaSuceso: inicial.fechaSuceso,
    } : {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || 'No se pudo guardar');
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onCancel} className="obj-modal" aria-label={inicial ? 'Editar objeto' : 'Publicar objeto'}>
      <form onSubmit={submit}>
        <div className="modal-head">{inicial ? 'Editar objeto' : 'Publicar objeto'}</div>
        <div className="modal-body">
          <div className="obj-tipo" role="radiogroup" aria-label="Tipo">
            {TIPOS.map((t) => (
              <button
                type="button"
                key={t.id}
                role="radio"
                aria-checked={form.tipo === t.id}
                className={`obj-tipo-op ${t.id}${form.tipo === t.id ? ' activo' : ''}`}
                onClick={() => set('tipo', t.id)}
              >
                {t.id === 'perdido' ? 'He perdido algo' : 'He encontrado algo'}
              </button>
            ))}
          </div>

          <div className="obj-campo">
            <label htmlFor="o-titulo">Título</label>
            <input id="o-titulo" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} autoFocus />
          </div>
          <div className="obj-fila">
            <div className="obj-campo">
              <label htmlFor="o-categoria">Categoría</label>
              <select id="o-categoria" value={form.categoria} onChange={(e) => set('categoria', e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="obj-campo">
              <label htmlFor="o-seccion">Sección de la oficina</label>
              <select id="o-seccion" value={form.seccion} onChange={(e) => set('seccion', e.target.value)}>
                {SECCIONES_OFICINA.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="obj-fila">
            <div className="obj-campo">
              <label htmlFor="o-ubicacion">Dónde exactamente</label>
              <input id="o-ubicacion" value={form.ubicacion} onChange={(e) => set('ubicacion', e.target.value)} />
            </div>
            <div className="obj-campo">
              <label htmlFor="o-fecha">Desde cuándo</label>
              <input id="o-fecha" type="date" value={form.fechaSuceso} onChange={(e) => set('fechaSuceso', e.target.value)} />
            </div>
          </div>
          <div className="obj-campo">
            <label htmlFor="o-descripcion">Descripción</label>
            <textarea id="o-descripcion" rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
          </div>
          {error && <span className="perfil-error" role="alert">{error}</span>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
