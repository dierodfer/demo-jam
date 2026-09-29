import { useState } from 'react';
import { updateMe } from '../lib/api.js';

const CAMPOS = [
  { id: 'nombre', label: 'Nombre' },
  { id: 'email', label: 'Email' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'puesto', label: 'Puesto' },
  { id: 'departamento', label: 'Departamento' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'foto', label: 'Foto (URL)' },
];

function formDesde(user) {
  return CAMPOS.reduce((acc, c) => ({ ...acc, [c.id]: user[c.id] ?? '' }), {});
}

export default function DatosEmpleado({ user, onUpdate }) {
  const [form, setForm] = useState(() => formDesde(user));
  const [estado, setEstado] = useState(null); // null | 'ok' | 'error'
  const [busy, setBusy] = useState(false);

  function setCampo(id, value) {
    setForm((f) => ({ ...f, [id]: value }));
    setEstado(null);
  }

  async function guardar(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const actualizado = await updateMe(form);
      onUpdate(actualizado);
      setEstado('ok');
    } catch {
      setEstado('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="perfil">
      <div className="perfil-foto-col">
        <img
          className="perfil-foto"
          src={form.foto || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>'}
          alt={form.nombre || 'Foto de perfil'}
        />
      </div>
      <form className="perfil-form" onSubmit={guardar}>
        {CAMPOS.map((c) => (
          <div className="perfil-campo" key={c.id}>
            <label htmlFor={`campo-${c.id}`}>{c.label}</label>
            <input
              id={`campo-${c.id}`}
              value={form[c.id]}
              onChange={(e) => setCampo(c.id, e.target.value)}
            />
          </div>
        ))}
        <div className="perfil-acciones">
          <button type="submit" disabled={busy}>Guardar</button>
          {estado === 'ok' && <span className="perfil-ok">Cambios guardados ✓</span>}
          {estado === 'error' && <span className="perfil-error">No se pudo guardar</span>}
        </div>
      </form>
    </div>
  );
}
