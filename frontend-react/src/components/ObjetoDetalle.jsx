import { useEffect, useState } from 'react';
import Avatar from './Avatar.jsx';
import Modal from './Modal.jsx';
import ObjetoIcono from './ObjetoIcono.jsx';
import { listReclamaciones, reclamarObjeto, resolverReclamacion } from '../lib/api.js';
import { fechaCorta, labelCategoria, labelSeccion } from '../lib/objetos.js';

const ESTADO_RECLAMACION = { pendiente: 'Pendiente', aceptada: 'Aceptada', rechazada: 'Rechazada' };

/** Detalle de un objeto: reclamar (otros empleados) o gestionar reclamaciones y entrega (publicador). */
export default function ObjetoDetalle({ objeto, onClose, onCambio, onEditar, onEliminar, onEntregar, onVerEntrega }) {
  const [reclamaciones, setReclamaciones] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const abierto = objeto.estado === 'abierto';

  useEffect(() => {
    if (!objeto.esMio) return;
    listReclamaciones(objeto.id).then(setReclamaciones).catch(() => setError('No se pudieron cargar las reclamaciones'));
  }, [objeto.id, objeto.esMio, objeto.estado, objeto.reclamacionesPendientes]);

  async function ejecutar(accion) {
    setBusy(true);
    setError('');
    try {
      await accion();
      await onCambio();
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción');
    } finally {
      setBusy(false);
    }
  }

  const reclamar = () => ejecutar(async () => {
    await reclamarObjeto(objeto.id, mensaje);
    setMensaje('');
  });

  const resolver = (r, estado) => ejecutar(() => resolverReclamacion(objeto.id, r.id, estado));

  const candidata = reclamaciones.find((r) => r.estado === 'aceptada')
    ?? reclamaciones.find((r) => r.estado === 'pendiente');

  return (
    <Modal onClose={onClose} className="obj-modal obj-detalle" aria-label={objeto.titulo} data-testid="objeto-detalle">
      <div className="obj-detalle-cabecera">
          <ObjetoIcono categoria={objeto.categoria} size={56} />
          <div>
            <h3>{objeto.titulo}</h3>
            <div className="obj-chips">
              <span className={`obj-chip tipo-${objeto.tipo}`}>{objeto.tipo === 'perdido' ? 'Perdido' : 'Encontrado'}</span>
              <span className={`obj-chip estado-${objeto.estado}`}>{abierto ? 'Abierto' : 'Entregado'}</span>
              <span className="obj-chip">{labelCategoria(objeto.categoria)}</span>
            </div>
          </div>
        </div>

        <div className="modal-body">
          {objeto.descripcion && <p className="obj-desc">{objeto.descripcion}</p>}
          <dl className="obj-datos">
            <dt>Sección</dt>
            <dd>{labelSeccion(objeto.seccion)}</dd>
            <dt>Dónde</dt>
            <dd>{objeto.ubicacion || '—'}</dd>
            <dt>Desde cuándo</dt>
            <dd>{fechaCorta(objeto.fechaSuceso)}</dd>
            <dt>Publicado por</dt>
            <dd className="obj-persona"><Avatar empleado={objeto.publicador} size={26} /> {objeto.publicador.nombre}</dd>
            {!abierto && objeto.contraparte && (
              <>
                <dt>Entregado {objeto.tipo === 'encontrado' ? 'a' : 'por'}</dt>
                <dd className="obj-persona">
                  <Avatar empleado={objeto.contraparte} size={26} /> {objeto.contraparte.nombre} · {fechaCorta(objeto.fechaEntrega)}
                </dd>
              </>
            )}
          </dl>

          {!objeto.esMio && abierto && (
            objeto.miReclamacion ? (
              <p className="obj-aviso" data-testid="mi-reclamacion">
                Tu reclamación está: <strong>{ESTADO_RECLAMACION[objeto.miReclamacion]}</strong>
              </p>
            ) : (
              <div className="obj-campo">
                <label htmlFor="o-reclamar">{objeto.tipo === 'encontrado' ? 'Es mío: cuéntale por qué' : 'Lo he visto: cuéntale dónde'}</label>
                <textarea id="o-reclamar" rows={2} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
              </div>
            )
          )}

          {objeto.esMio && (
            <section className="obj-reclamaciones" aria-label="Reclamaciones">
              <h4>Reclamaciones ({reclamaciones.length})</h4>
              {reclamaciones.length === 0 && <p className="obj-vacio">Todavía nadie ha reclamado este objeto.</p>}
              {reclamaciones.map((r) => (
                <div key={r.id} className="obj-reclamacion" data-testid="reclamacion">
                  <Avatar empleado={r.reclamante} size={34} />
                  <div className="obj-reclamacion-texto">
                    <strong>{r.reclamante.nombre}</strong>
                    {r.mensaje && <span>{r.mensaje}</span>}
                  </div>
                  <span className={`obj-chip rec-${r.estado}`}>{ESTADO_RECLAMACION[r.estado]}</span>
                  {abierto && r.estado === 'pendiente' && (
                    <span className="obj-reclamacion-acc">
                      <button className="btn" disabled={busy} onClick={() => resolver(r, 'rechazada')}>Rechazar</button>
                      <button className="btn btn-primary" disabled={busy} onClick={() => resolver(r, 'aceptada')}>Aceptar</button>
                    </span>
                  )}
                </div>
              ))}
            </section>
          )}

          {error && <span className="perfil-error" role="alert">{error}</span>}
        </div>

        <div className="modal-foot obj-foot">
          {objeto.esMio && abierto && (
            confirmando ? (
              <>
                <span className="obj-confirmar">¿Eliminar «{objeto.titulo}»?</span>
                <button className="btn" onClick={() => setConfirmando(false)}>No</button>
                <button className="btn btn-danger" disabled={busy} onClick={() => ejecutar(() => onEliminar(objeto))}>Sí, eliminar</button>
              </>
            ) : (
              <>
                <button className="btn btn-danger-suave" onClick={() => setConfirmando(true)}>Eliminar</button>
                <button className="btn" onClick={() => onEditar(objeto)}>Editar</button>
              </>
            )
          )}
          {objeto.esMio && !abierto && <button className="btn" onClick={() => ejecutar(() => onEliminar(objeto))}>Eliminar</button>}
          <span className="obj-foot-espacio" />
          <button className="btn" onClick={onClose}>Cerrar</button>
          {!objeto.esMio && abierto && !objeto.miReclamacion && (
            <button className="btn btn-primary" disabled={busy} onClick={reclamar}>
              {objeto.tipo === 'encontrado' ? 'Reclamar objeto' : 'Lo he encontrado'}
            </button>
          )}
          {objeto.esMio && abierto && (
            <button className="btn btn-primary" onClick={() => onEntregar(objeto, candidata?.reclamante.id)}>Dar por entregado</button>
          )}
          {!abierto && objeto.contraparte && (
            <button className="btn btn-primary" onClick={() => onVerEntrega(objeto)}>Ver entrega</button>
          )}
        </div>
    </Modal>
  );
}
