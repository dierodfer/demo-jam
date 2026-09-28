# Instrucciones para agentes

Aplica estas reglas al implementar y verificar cambios. Para conocer el
producto y cómo ponerlo en marcha, consulta [`README.md`](README.md).

## Contexto

Implementa las funcionalidades con paridad en los backends Java y Go y los
frontends React y Vue. No hay código compartido entre los backends; sus fuentes
de verdad comunes son:

- `shared/openapi.yaml`: contrato que ambos backends deben implementar con las
  mismas rutas y formas JSON.
- `shared/migrations/*.sql`: esquema que ambos backends aplican al arrancar.
  La tabla `schema_migration` registra las migraciones aplicadas. No crees
  esquema desde el código: Hibernate usa `ddl-auto=none` y Go no tiene DDL
  propio.

El login es simulado: el usuario por defecto es `admin` (`SEED_USERNAME`) y
cualquier contraseña es válida. Java usa la cookie `JSESSIONID` y Go usa
`session_id`; incluye `credentials: 'include'` en las peticiones del frontend.

## Paridad

Completa cada funcionalidad en los cinco sitios: contrato, backend Java,
backend Go, frontend React y frontend Vue. Si la solicitud limita el alcance,
indica explícitamente qué partes quedan pendientes.

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
4. **Go:** usa tags JSON idénticos a los DTOs Java. Registra handlers con
   `mux.HandleFunc("GET /api/...", ...)` y aplica el mismo alcance por sesión.
   Mantén en `seed()` los mismos datos demo que en Java. Usa placeholders
   PostgreSQL (`$1`, `$2`, ...) y `RETURNING id` para recuperar ids generados;
   PostgreSQL no admite `LastInsertId()`.
5. **React y Vue:** para cada sección nueva, añade la misma id y etiqueta a
   `SECCIONES` en `frontend-react/src/App.jsx` y
   `frontend-vue/src/App.vue`. Implementa el componente, las funciones de API
   y los estilos en ambos frameworks.

## Archivos sincronizados

React y Vue no comparten componentes, pero sí estilos y lógica pura. Mantén
estos archivos idénticos:

- `frontend-react/src/styles.css` y `frontend-vue/src/styles.css`
- `frontend-react/src/lib/vacaciones.js` y
  `frontend-vue/src/lib/vacaciones.js`

Mantén también sincronizados `frontend-react/src/lib/api.js` y
`frontend-vue/src/lib/api.js`. La única diferencia permitida es la URL por
defecto: puerto 8080 en React y 8081 en Vue. Aplica los cambios correspondientes
en ambos frontends en el mismo commit.

## Reglas

- Escribe en español la UI, los comentarios, los commits y la documentación.
- Usa claves JSON `camelCase` (por ejemplo, `empresaEmisora`), columnas SQL
  `snake_case` (por ejemplo, `empresa_emisora`) y fechas `YYYY-MM-DD`.
- Devuelve errores con `{"error": "mensaje"}`. Usa `401` si falta la sesión y
  `404` si el recurso no existe o no pertenece al empleado de la sesión.
- No añadas Spring Security ni nuevas librerías salvo que exista una necesidad
  real.
- No implementes subida ni adjuntos de archivos.
- Muestra `NoDisponible` en las secciones aún no implementadas.
- Lee la configuración de las variables de entorno existentes. Los backends
  usan `SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `MIGRATIONS_PATH`, `CORS_ALLOWED_ORIGIN` y `SEED_USERNAME`; los frontends usan
  `VITE_API_BASE`. En Docker, `VITE_API_BASE` es un `build-arg` incluido en el
  build estático.

## Verificación

Ejecuta las comprobaciones pertinentes al cambio:

```bash
make install
make db-up
make verify-java
make verify-go
make verify
```

`make db-up` inicia PostgreSQL para el desarrollo local. Arranca el backend que
vayas a probar con `make run-java` o `make run-go` antes de ejecutar sus tests
de contrato. `make verify` ejecuta ambos y compara la paridad de las respuestas.

Amplía `scripts/contract-test.mjs` al añadir endpoints. El test comprueba los
códigos y formas JSON y limpia los datos que crea.

Ejecuta `npm run build` en cada frontend afectado. Para una funcionalidad de
punta a punta, comprueba manualmente el login, la nueva sección, sus operaciones
CRUD y la persistencia tras recargar.

## Mapa

```
shared/openapi.yaml           Contrato de API (fuente de verdad nº 1)
shared/migrations/            Esquema Postgres (fuente de verdad nº 2)
backend-java/src/main/java/com/empresa/portal/
  ├── config/                 MigrationRunner (Order 1), DataSeeder (Order 2), CORS
  ├── model/  repo/           Entidades JPA y repositorios
  └── web/    web/dto/        Controladores REST y records DTO
backend-go/main.go            Todo el backend Go en un fichero
frontend-react/src/           App.jsx (SECCIONES), components/, lib/, styles.css
frontend-vue/src/             App.vue (SECCIONES), components/, lib/, styles.css
scripts/contract-test.mjs     Tests de contrato (make verify)
docker-compose.yml            Servicio postgres compartido por los dos stacks
docker-compose.*.yml          Stacks java+react y go+vue (incluyen el base)
Makefile                      make help lista todos los atajos
```
