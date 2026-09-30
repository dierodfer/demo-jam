-- 002 — Contraseña opcional por empleado.
--
-- password_hash guarda el hash de la contraseña (nunca el texto en claro).
-- Si es NULL, el empleado conserva el login simulado: cualquier contraseña vale.

ALTER TABLE empleado ADD COLUMN IF NOT EXISTS password_hash TEXT;
