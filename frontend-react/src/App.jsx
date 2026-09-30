import { useCallback, useEffect, useState } from 'react';
import { getMe, getResumenObjetos, logout } from './lib/api.js';
import Logo from './components/Logo.jsx';
import Login from './components/Login.jsx';
import DatosEmpleado from './components/DatosEmpleado.jsx';
import Vacaciones from './components/Vacaciones.jsx';
import Conocimientos from './components/Conocimientos.jsx';
import ObjetosPerdidos from './components/ObjetosPerdidos.jsx';
import NoDisponible from './components/NoDisponible.jsx';

const SECCIONES_IMPLEMENTADAS = new Set(['datos', 'vacaciones', 'conocimientos', 'objetos']);

export const SECCIONES = [
  { id: 'datos', label: 'Datos del empleado' },
  { id: 'nominas', label: 'Nóminas' },
  { id: 'retenciones', label: 'Retenciones' },
  { id: 'documentos', label: 'Otros documentos' },
  { id: 'nunenews', label: 'Nunenews' },
  { id: 'vacaciones', label: 'Vacaciones' },
  { id: 'horas', label: 'Registro de horas' },
  { id: 'ticket', label: 'Ticket Restaurant' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'objetos', label: 'Objetos perdidos' },
  { id: 'formacion', label: 'Formación Interna' },
  { id: 'conocimientos', label: 'Conocimientos / Certificaciones' },
  { id: 'salas', label: 'Reserva de salas' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [seccion, setSeccion] = useState('datos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [novedades, setNovedades] = useState(0);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const refrescarNovedades = useCallback(() => {
    getResumenObjetos()
      .then((r) => setNovedades(r.objetosNuevos + r.reclamacionesPendientes))
      .catch(() => setNovedades(0));
  }, []);

  useEffect(() => {
    if (user) refrescarNovedades();
  }, [user, refrescarNovedades]);

  async function cerrarSesion() {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      setUser(null);
      setSeccion('datos');
      setNovedades(0);
    }
  }

  if (checking) return null;
  if (!user) return <Login onLogin={setUser} />;

  const activa = SECCIONES.find((s) => s.id === seccion);

  return (
    <>
      <header className="header">
        <Logo className="header-logo" />
        <span className="header-title">Portal empleado</span>
        <div className="header-menu">
          <button className="header-burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            ☰
          </button>
          {menuOpen && (
            <div className="header-dropdown">
              <button onClick={cerrarSesion}>Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>

      <nav className="nav">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            className={`nav-item${s.id === seccion ? ' active' : ''}`}
            onClick={() => setSeccion(s.id)}
          >
            {s.label}
            {s.id === 'objetos' && novedades > 0 && (
              <span className="nav-badge" data-testid="objetos-badge" aria-label={`${novedades} novedades`}>
                {novedades}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="main">
        {seccion === 'datos' && <DatosEmpleado user={user} onUpdate={setUser} />}
        {seccion === 'vacaciones' && <Vacaciones />}
        {seccion === 'conocimientos' && <Conocimientos />}
        {seccion === 'objetos' && <ObjetosPerdidos onCambio={refrescarNovedades} />}
        {!SECCIONES_IMPLEMENTADAS.has(seccion) && <NoDisponible nombre={activa.label} />}
      </main>
    </>
  );
}
