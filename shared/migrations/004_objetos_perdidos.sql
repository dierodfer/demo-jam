-- 004 — Objetos perdidos: objetos publicados por los empleados y sus reclamaciones.
--
-- tipo: perdido | encontrado. estado: abierto | entregado.
-- Las fechas se guardan como texto YYYY-MM-DD, igual que el resto del esquema.

CREATE TABLE IF NOT EXISTS objeto_perdido (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    publicador_id     INTEGER NOT NULL REFERENCES empleado (id),
    titulo            TEXT NOT NULL,
    descripcion       TEXT,
    categoria         TEXT NOT NULL,
    tipo              TEXT NOT NULL,
    estado            TEXT NOT NULL DEFAULT 'abierto',
    seccion           TEXT NOT NULL,
    ubicacion         TEXT,
    fecha_suceso      TEXT NOT NULL,
    fecha_publicacion TEXT NOT NULL,
    fecha_entrega     TEXT,
    contraparte_id    INTEGER REFERENCES empleado (id)
);

CREATE TABLE IF NOT EXISTS objeto_reclamacion (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    objeto_id     INTEGER NOT NULL REFERENCES objeto_perdido (id) ON DELETE CASCADE,
    reclamante_id INTEGER NOT NULL REFERENCES empleado (id),
    mensaje       TEXT,
    estado        TEXT NOT NULL DEFAULT 'pendiente',
    fecha         TEXT NOT NULL,
    UNIQUE (objeto_id, reclamante_id)
);

CREATE INDEX IF NOT EXISTS idx_objeto_perdido_publicador ON objeto_perdido (publicador_id);
CREATE INDEX IF NOT EXISTS idx_objeto_reclamacion_objeto ON objeto_reclamacion (objeto_id);
