-- 003 — Usuario sherpai (contraseña 1234, guardada como hash PBKDF2-SHA256).
--
-- Si el empleado 2 ya existe (por ejemplo, sembrado antes por el backend), no se toca.

INSERT INTO empleado (id, username, nombre, email, telefono, puesto, departamento, direccion, foto, password_hash)
VALUES (
    2,
    'sherpai',
    'Sherpai',
    'sherpai@empresa.com',
    '+34 600 000 002',
    'Asistente de IA',
    'Tecnología',
    'Calle Mayor 1, 28013 Madrid',
    'https://i.pravatar.cc/300?u=sherpai',
    'pbkdf2$120000$cA/N4phzdGardv9/MscBnw==$WqC0d/esdMwtB691bqXl42o1oOOCh/zo68deBNRXI4c='
)
ON CONFLICT (id) DO NOTHING;
