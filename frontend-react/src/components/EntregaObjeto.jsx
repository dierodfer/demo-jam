// Vista de devolución: dos avatares y el icono del objeto viajando de uno a otro.
// La animación usa `motion` (Framer Motion): secuencias imperativas con useAnimate,
// muelles para el rebote y useReducedMotion para respetar la preferencia del sistema.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, stagger, useAnimate, useReducedMotion } from 'motion/react';
import Avatar from './Avatar.jsx';
import Modal from './Modal.jsx';
import ObjetoIcono from './ObjetoIcono.jsx';
import { entregarObjeto, listEmpleados } from '../lib/api.js';
import { fechaCorta, labelCategoria } from '../lib/objetos.js';

const OBJ = 72; // tamaño del icono
const PAD = 16; // margen lateral del escenario
const GAP = 12; // separación entre avatar e icono
const COLORES = ['#ffd43b', '#ff8787', '#63e6be', '#74c0fc', '#b197fc', '#ffa94d'];
const FANTASMAS = 5;

const avatarSize = (ancho) => (ancho < 440 ? 72 : 96);
const distancia = (ancho) => Math.max(0, ancho - 2 * (PAD + avatarSize(ancho) + GAP) - OBJ);

function Chispas() {
  return (
    <span className="ent-chispas" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => {
        const ang = (i / 10) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="ent-chispa"
            style={{ background: COLORES[i % COLORES.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(ang) * 74, y: Math.sin(ang) * 74, scale: [0, 1.2, 0], opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.05 * (i % 3) }}
          />
        );
      })}
    </span>
  );
}

/**
 * modo "nueva": el publicador elige destinatario y confirma la entrega.
 * modo "historial": entrega ya registrada; se puede repetir la animación.
 */
export default function EntregaObjeto({ objeto, modo, preseleccion = '', onClose, onEntregado }) {
  const [scope, animate] = useAnimate();
  const reduce = useReducedMotion();
  const escenario = useRef(null);
  const [ancho, setAncho] = useState(560);
  const [empleados, setEmpleados] = useState([]);
  const [destinatarioId, setDestinatarioId] = useState(preseleccion ? String(preseleccion) : '');
  const [fase, setFase] = useState(modo === 'historial' ? 'entregado' : 'idle'); // idle | enviando | entregado
  const [entregado, setEntregado] = useState(modo === 'historial' ? objeto : null);
  const [error, setError] = useState('');
  const [chispas, setChispas] = useState(0);

  const publicador = objeto.publicador;
  const destinatario = entregado?.contraparte
    ?? empleados.find((e) => String(e.id) === destinatarioId)
    ?? null;
  // Un objeto encontrado viaja del publicador al destinatario; uno perdido, al revés.
  const origen = objeto.tipo === 'encontrado' ? publicador : destinatario;
  const receptor = objeto.tipo === 'encontrado' ? destinatario : publicador;
  const av = avatarSize(ancho);

  useEffect(() => {
    if (modo !== 'nueva') return;
    listEmpleados()
      .then((lista) => setEmpleados(lista.filter((e) => e.id !== publicador.id)))
      .catch(() => setError('No se pudo cargar el directorio de empleados'));
  }, [modo, publicador.id]);

  useEffect(() => {
    const el = escenario.current;
    if (!el) return undefined;
    const obs = new ResizeObserver(() => setAncho(el.clientWidth));
    obs.observe(el);
    setAncho(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  // Reposo: el objeto flota junto al avatar de origen.
  useEffect(() => {
    if (fase !== 'idle' || reduce) return undefined;
    const flotar = animate('.ent-objeto', { y: [0, -9, 0] }, { duration: 2.2, repeat: Infinity, ease: 'easeInOut' });
    return () => flotar.stop();
  }, [fase, reduce, animate]);

  // Posición de reposo: junto al origen, o junto al receptor cuando ya está entregado.
  useLayoutEffect(() => {
    if (fase === 'enviando') return;
    animate('.ent-objeto', { x: fase === 'entregado' ? distancia(ancho) : 0, y: 0, rotate: 0, scale: 1, opacity: 1 }, { duration: 0 });
    animate('.ent-fantasma', { x: 0, y: 0, rotate: 0, opacity: 0 }, { duration: 0 });
  }, [fase, ancho, animate]);

  async function volar() {
    const dist = distancia(ancho);
    if (reduce) {
      await animate('.ent-objeto', { x: dist, opacity: [0.2, 1] }, { duration: 0.35 });
      return;
    }
    animate('.ent-origen', { scale: [1, 0.92, 1] }, { duration: 0.4 });
    const arco = { x: [null, dist / 2, dist], y: [null, -90, 0], rotate: [null, 200, 360] };
    const opciones = { duration: 1.3, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] };
    await Promise.all([
      animate('.ent-fantasma', { ...arco, opacity: [0, 0.45, 0] }, { ...opciones, delay: stagger(0.07) }),
      animate('.ent-objeto', { ...arco, scale: [1, 1.3, 1] }, opciones),
    ]);
  }

  async function rebote() {
    if (reduce) return;
    setChispas((n) => n + 1);
    await animate('.ent-receptor', { scale: [1, 1.18, 0.96, 1], rotate: [0, -6, 6, 0] }, { duration: 0.6 });
  }

  async function confirmar() {
    setError('');
    setFase('enviando');
    try {
      const [actualizado] = await Promise.all([entregarObjeto(objeto.id, Number(destinatarioId)), volar()]);
      setEntregado(actualizado);
      setFase('entregado');
      onEntregado?.(actualizado);
      rebote();
    } catch (err) {
      setError(err.message || 'No se pudo registrar la entrega');
      await animate('.ent-objeto', { x: 0, y: 0, rotate: 0, scale: 1 }, { duration: 0.4 });
      setFase('idle');
    }
  }

  async function repetir() {
    setFase('enviando');
    await animate('.ent-objeto', { x: 0, y: 0, rotate: 0, scale: 1 }, { duration: 0 });
    await volar();
    setFase('entregado');
    rebote();
  }

  const nombreDestino = destinatario?.nombre;
  const estado = fase === 'entregado'
    ? `Objeto entregado${nombreDestino ? ` a ${objeto.tipo === 'encontrado' ? nombreDestino : publicador.nombre}` : ''}`
    : fase === 'enviando' ? 'Entregando…' : '';

  const persona = (emp, rol, clase) => (
    <div className={`ent-persona ${clase}`}>
      <div className="ent-persona-avatar">
        <AnimatePresence mode="wait">
          {emp ? (
            <motion.div
              key={emp.id}
              initial={reduce ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              <Avatar empleado={emp} size={av} className="ent-avatar" />
            </motion.div>
          ) : (
            <div className="ent-avatar-vacio" style={{ width: av, height: av }} aria-hidden="true">?</div>
          )}
        </AnimatePresence>
        {clase === 'ent-receptor' && chispas > 0 && <Chispas key={chispas} />}
      </div>
      <div className="ent-persona-nombre">{emp?.nombre ?? 'Sin elegir'}</div>
      <div className="ent-persona-rol">{rol}</div>
    </div>
  );

  const cerrar = fase === 'enviando' ? () => {} : onClose;

  return (
    <Modal onClose={cerrar} className="ent-modal" aria-label="Entrega del objeto" data-testid="entrega">
      <div className="modal-head">
          {modo === 'historial' ? 'Entrega realizada' : 'Dar por entregado'}: {objeto.titulo}
        </div>

        <div className="modal-body">
          <div
            className="ent-escenario"
            ref={(el) => { escenario.current = el; scope.current = el; }}
            style={{ '--ent-av': `${av}px`, '--ent-obj': `${OBJ}px`, '--ent-pad': `${PAD}px`, '--ent-gap': `${GAP}px` }}
          >
            {persona(origen, 'Entrega', 'ent-origen')}
            <div className="ent-pista" aria-hidden="true">
              <span className="ent-linea" />
              {Array.from({ length: FANTASMAS }, (_, i) => (
                <span key={i} className="ent-fantasma" style={{ background: COLORES[i % COLORES.length] }} />
              ))}
              <div className="ent-objeto" data-testid="entrega-objeto">
                <ObjetoIcono categoria={objeto.categoria} size={OBJ} />
              </div>
            </div>
            {persona(receptor, 'Recibe', 'ent-receptor')}
          </div>

          <p className="ent-resumen">
            {labelCategoria(objeto.categoria)} · {objeto.tipo === 'encontrado' ? 'encontrado' : 'perdido'} desde el {fechaCorta(objeto.fechaSuceso)}
            {entregado?.fechaEntrega && ` · entregado el ${fechaCorta(entregado.fechaEntrega)}`}
          </p>

          {modo === 'nueva' && (
            <div className="obj-campo">
              <label htmlFor="e-destinatario">
                {objeto.tipo === 'encontrado' ? '¿A quién se lo entregas?' : '¿Quién lo ha encontrado?'}
              </label>
              <select
                id="e-destinatario"
                value={destinatarioId}
                disabled={fase !== 'idle'}
                onChange={(e) => setDestinatarioId(e.target.value)}
              >
                <option value="">Selecciona un empleado</option>
                {empleados.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}{e.departamento ? ` · ${e.departamento}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="ent-estado" role="status" aria-live="polite" data-testid="entrega-estado">
            <AnimatePresence>
              {fase === 'entregado' && (
                <motion.span
                  className="ent-ok"
                  initial={reduce ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
            {estado}
          </div>
          {error && <span className="perfil-error" role="alert">{error}</span>}
        </div>

        <div className="modal-foot">
          {modo === 'historial' && (
            <button type="button" className="btn" onClick={repetir} disabled={fase === 'enviando'}>
              Repetir animación
            </button>
          )}
          <button type="button" className="btn" onClick={onClose} disabled={fase === 'enviando'}>
            {fase === 'entregado' ? 'Cerrar' : 'Cancelar'}
          </button>
          {modo === 'nueva' && fase !== 'entregado' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!destinatarioId || fase === 'enviando'}
              onClick={confirmar}
            >
              Confirmar entrega
            </button>
          )}
        </div>
    </Modal>
  );
}
