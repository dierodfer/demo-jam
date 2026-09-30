// Avatar redondo con foto y, si falla o no existe, iniciales del nombre.
import { useState } from 'react';

function iniciales(nombre = '') {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}

export default function Avatar({ empleado, size = 40, className = '' }) {
  const [fallo, setFallo] = useState(false);
  const estilo = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  return (
    <span className={`avatar ${className}`} style={estilo} title={empleado?.nombre}>
      {empleado?.foto && !fallo ? (
        <img src={empleado.foto} alt={empleado.nombre} onError={() => setFallo(true)} draggable="false" />
      ) : (
        <span aria-hidden="true">{iniciales(empleado?.nombre)}</span>
      )}
    </span>
  );
}
