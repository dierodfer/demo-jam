# Instrucciones para agentes

Aplica estas reglas al implementar y verificar cambios. Para conocer el
producto y cómo ponerlo en marcha, consulta [`README.md`](README.md).

## Contexto

Implementa las funcionalidades en el contrato, el backend Java y el frontend
React. La especificación y el esquema son:

- `shared/openapi.yaml`: contrato de API implementado por Java.
- `shared/migrations/*.sql`: esquema aplicado al arrancar. La tabla
  `schema_migration` registra las migraciones ejecutadas. No crees esquema
  desde el código; Hibernate usa `ddl-auto=none`.

El login es simulado: el usuario por defecto es `admin` (`SEED_USERNAME`) y
cualquier contraseña es válida. La sesión usa la cookie `JSESSIONID`; incluye
`credentials: 'include'` en las peticiones del frontend.

## Paridad

Completa cada funcionalidad en los tres sitios: contrato, backend Java y
frontend React. Si la solicitud limita el alcance, indica explícitamente qué
partes quedan pendientes.

## Implementación

Sigue este orden:

1. **Contrato:** actualiza rutas y esquemas en `shared/openapi.yaml`.
2. **Base de datos:** si hacen falta tablas o columnas, añade
   `shared/migrations/NNN_descripcion.sql` con el siguiente número disponible
   y sintaxis PostgreSQL. Usa `GENERATED ALWAYS AS IDENTITY` para los ids.
   Nunca edites una migración ya aplicada. No incluyas `;` dentro de literales
   SQL: los runners separan las sentencias por ese carácter.
3. **Java:** declara `@Table` y `@Column` explícitamente, con nombres
   `snake_case` iguales a los de la migración. Añade repositorios, DTOs
   `record` con JSON `camelCase` y controladores que obtengan `empleadoId` de
   la sesión. No expongas `username` ni `empleado_id`. Usa
   `CertificacionController` como referencia y siembra datos demo en
   `DataSeeder` cuando corresponda.
4. **React:** para cada sección nueva, añade una entrada a `SECCIONES` en
   `frontend-react/src/App.jsx` e implementa el componente, las llamadas a la
   API y los estilos.

## Reglas

- Escribe en español la UI, los comentarios, los commits y la documentación.
- Usa siempre GitHub MCP para consultar y gestionar el repositorio, sus ramas,
  issues y pull requests. Recurre a `gh` o al navegador solo si MCP no ofrece
  la operación necesaria.
- Usa claves JSON `camelCase` (por ejemplo, `empresaEmisora`), columnas SQL
  `snake_case` (por ejemplo, `empresa_emisora`) y fechas `YYYY-MM-DD`.
- Devuelve errores con `{"error": "mensaje"}`. Usa `401` si falta la sesión y
  `404` si el recurso no existe o no pertenece al empleado de la sesión.
- No añadas Spring Security ni nuevas librerías salvo que exista una necesidad
  real.
- No implementes subida ni adjuntos de archivos.
- Muestra `NoDisponible` en las secciones aún no implementadas.
- Lee la configuración de las variables de entorno existentes. El backend usa
  `SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `MIGRATIONS_PATH`, `CORS_ALLOWED_ORIGIN` y `SEED_USERNAME`; el frontend usa
  `VITE_API_BASE`. En Docker, `VITE_API_BASE` es un `build-arg` incluido en el
  build estático.

## Ejecución

El `Makefile` es el script central del proyecto: instala, compila, arranca,
prueba y limpia. Usa siempre sus objetivos (`make help` los lista) en lugar de
invocar `mvn`, `npm`, `node` o `docker compose` directamente. Si falta un
atajo, añádelo al `Makefile` y documéntalo en `make help`.

## Verificación

Ejecuta las comprobaciones pertinentes al cambio:

```bash
make install
make test-java
make db-up
make install-react-ci
make build-react
make verify
```

`make db-up` inicia PostgreSQL para el desarrollo local. Arranca el backend con
`make run-java` antes de ejecutar los tests de contrato.

Amplía `scripts/contract-test.mjs` al añadir endpoints. El test comprueba los
códigos y formas JSON y limpia los datos que crea.

Para una funcionalidad de punta a punta, comprueba manualmente el login, la
nueva sección, sus operaciones CRUD y la persistencia tras recargar.

## Mapa

```
shared/openapi.yaml           Contrato de API (fuente de verdad nº 1)
shared/migrations/            Esquema Postgres (fuente de verdad nº 2)
backend-java/src/main/java/com/empresa/portal/
  ├── config/                 MigrationRunner (Order 1), DataSeeder (Order 2), CORS
  ├── model/  repo/           Entidades JPA y repositorios
  └── web/    web/dto/        Controladores REST y records DTO
frontend-react/src/           App.jsx (SECCIONES), components/, lib/, styles.css
scripts/contract-test.mjs     Tests de contrato (make verify)
docker-compose.yml            Servicio PostgreSQL
docker-compose.java-react.yml Backend Java + frontend React
Makefile                      Script central de ejecución (make help)
```
