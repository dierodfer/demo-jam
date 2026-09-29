import { useState } from 'react';
import {
  MESES, DIAS_SEMANA, DEMO, buildMonth, dateKey, dayFlags, todayKey,
} from '../lib/vacaciones.js';

function Mes({ year, monthIndex, hoy }) {
  const { offset, days } = buildMonth(year, monthIndex);
  return (
    <div className="cal-mes">
      <div className="cal-mes-nombre">{MESES[monthIndex]}</div>
      <div className="cal-tabla">
        {DIAS_SEMANA.map((d) => (
          <div className="cal-cab" key={d}>{d}</div>
        ))}
        {days.map((day) => {
          const key = dateKey(year, monthIndex, day);
          const f = dayFlags(key, year);
          const clases = ['cal-dia'];
          if (f.holiday) clases.push('festivo');
          if (f.used) clases.push('usado');
          if (f.selected) clases.push('marcado');
          if (key === hoy) clases.push('hoy');
          const style = day === 1 && offset > 0 ? { gridColumnStart: offset + 1 } : undefined;
          return (
            <div className={clases.join(' ')} style={style} key={key}>{day}</div>
          );
        })}
      </div>
    </div>
  );
}

export default function Vacaciones() {
  const [year, setYear] = useState(DEMO.year);
  const [toast, setToast] = useState(false);
  const hoy = todayKey();
  const r = DEMO.resumen;

  function solicitar() {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  return (
    <div>
      <div className="vac-yearbar">
        <button className="vac-arrow" onClick={() => setYear(year - 1)} aria-label="Año anterior">‹</button>
        <div className="vac-years">
          <button className="vac-year-side" onClick={() => setYear(year - 1)}>{year - 1}</button>
          <span className="vac-year">{year}</span>
          <button className="vac-year-side" onClick={() => setYear(year + 1)}>{year + 1}</button>
        </div>
        <button className="vac-arrow" onClick={() => setYear(year + 1)} aria-label="Año siguiente">›</button>
      </div>

      <div className="vac-grid">
        {MESES.map((nombre, m) => (
          <Mes key={nombre} year={year} monthIndex={m} hoy={hoy} />
        ))}
      </div>

      <div className="vac-resumen">
        <div className="vac-fila">
          <div className="vac-seg amarillo">Acumulados año anterior no disfrutados: {r.acumulados}</div>
          <div className="vac-seg azul">Naturales: {r.naturales} días</div>
        </div>
        <div className="vac-fila">
          <div className="vac-seg rojo">Utilizados: {r.utilizados} días</div>
          <div className="vac-seg verde">Disponibles: {r.disponibles} días</div>
        </div>
      </div>

      <div className="vac-leyenda">
        <span><i className="vac-punto amarillo" /> Acumulados</span>
        <span><i className="vac-punto azul" /> Totales</span>
        <span><i className="vac-punto rojo" /> Utilizados</span>
        <span><i className="vac-punto verde" /> Disponibles</span>
      </div>

      <div className="vac-solicitar">
        <button onClick={solicitar}>Solicitar</button>
        {toast && <div className="vac-toast">La solicitud de vacaciones no está disponible en esta demo.</div>}
      </div>
    </div>
  );
}
