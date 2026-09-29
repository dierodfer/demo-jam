import { useEffect, useState } from 'react';
import { getMe, logout } from './lib/api.js';
import Logo from './components/Logo.jsx';
import Login from './components/Login.jsx';
import DatosEmpleado from './components/DatosEmpleado.jsx';
import Vacaciones from './components/Vacaciones.jsx';
import Conocimientos from './components/Conocimientos.jsx';
import NoDisponible from './components/NoDisponible.jsx';

const SECCIONES_IMPLEMENTADAS = new Set(['datos', 'vacaciones', 'conocimientos']);

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
  { id: 'formacion', label: 'Formación Interna' },
  { id: 'conocimientos', label: 'Conocimientos / Certificaciones' },
  { id: 'salas', label: 'Reserva de salas' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [seccion, setSeccion] = useState('datos');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function cerrarSesion() {
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      setUser(null);
      setSeccion('datos');
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
          </button>
        ))}
      </nav>

      <main className="main">
        {seccion === 'datos' && <DatosEmpleado user={user} onUpdate={setUser} />}
        {seccion === 'vacaciones' && <Vacaciones />}
        {seccion === 'conocimientos' && <Conocimientos />}
        {!SECCIONES_IMPLEMENTADAS.has(seccion) && <NoDisponible nombre={activa.label} />}
      </main>
    </>
  );
}
