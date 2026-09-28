# Portal de Empleado (100% local)

Portal de empleado sencillo con **login simulado** y **perfil editable**,
construido para funcionar por completo en local. La gracia del proyecto es que
hay **dos backends** (Java y Go) y **dos frontends** (React y Vue) que hablan el
**mismo contrato de API** y comparten la **misma base de datos PostgreSQL**
(un único contenedor), de modo que cualquier frontend puede funcionar contra
cualquier backend.

> **Estado actual**
>
> | Componente | Estado |
> |---|---|
> | `shared/openapi.yaml` (contrato) | ✅ Listo |
> | `backend-java` (Spring Boot 4.1.0 / Java 25) | ✅ Listo |
> | `backend-go` (Go + pgx) | ✅ Listo |
> | `frontend-react` (React 19.2 + Vite 8) | ✅ Listo |
> | `frontend-vue` (Vue 3 + Vite 8) | ✅ Listo |
> | `postgres` (PostgreSQL 16, contenedor compartido) | ✅ Listo |
> | `docker-compose.*` | ✅ Listos |
> | `Makefile` | ✅ Listo |

## Estructura

```
.
├── backend-java/                   Spring Boot 4.1.0 (Java 25) + Dockerfile   → 8080
├── backend-go/                     Go + Dockerfile                            → 8081
├── frontend-react/                 React 19.2 + Vite 8 (Docker: nginx)       → 5173
├── frontend-vue/                   Vue 3 + Vite 8 (Docker: nginx)            → 5174
├── shared/openapi.yaml             Contrato de API común a ambos backends
├── shared/migrations/              Migraciones SQL del esquema (común a ambos)
├── scripts/contract-test.mjs       Tests de contrato (make verify)
├── docker-compose.yml              Servicio postgres COMPARTIDO (5432)
├── docker-compose.java-react.yml   Stack backend-java + frontend-react
├── docker-compose.go-vue.yml       Stack backend-go + frontend-vue
├── Makefile                        Atajos de instalación, dev, verify y docker
└── AGENTS.md / CLAUDE.md           Guía para agentes de IA (receta de features)
```

## Arquitectura

Cada servicio publica **siempre** su puerto en el host: React `:5173`, Vue
`:5174`, Java `:8080`, Go `:8081` y Postgres `:5432`. En Docker los frontends
son **builds estáticos servidos por nginx** (en esos mismos puertos); el
navegador llama a la API directamente al puerto publicado del backend — nginx
solo sirve ficheros, no hace de proxy.

Los dos stacks se pueden levantar por separado o a la vez. Ambos incluyen el
mismo servicio Postgres y comparten el contrato OpenAPI y las migraciones.
React apunta por defecto al backend Java; Vue, al backend Go.

```mermaid
flowchart LR
    navegador(["Navegador"])
    react["React · :5173"]
    java["Backend Java · :8080"]
    vue["Vue · :5174"]
    go["Backend Go · :8081"]
    contrato["shared/openapi.yaml"]
    migraciones["shared/migrations"]
    db[("PostgreSQL · :5432")]

    navegador --> react --> java --> db
    navegador --> vue --> go --> db
    contrato -.->|"mismo contrato"| java
    contrato -.->|"mismo contrato"| go
    migraciones -.->|"esquema común"| java
    migraciones -.->|"esquema común"| go
```

## Contrato de API

Un único [`shared/openapi.yaml`](shared/openapi.yaml) define el contrato que
**ambos backends implementan de forma idéntica** (mismas rutas y formas JSON):

| Método | Ruta          | Descripción                              |
|--------|---------------|------------------------------------------|
| POST   | `/api/login`  | Login simulado. Abre sesión (cookie).    |
| GET    | `/api/me`     | Perfil del empleado (401 si no hay sesión). |
| PUT    | `/api/me`     | Actualiza el perfil.                     |
| POST   | `/api/logout` | Cierra la sesión.                        |
| GET    | `/api/certificaciones`      | Lista los conocimientos / certificaciones. |
| POST   | `/api/certificaciones`      | Crea una certificación.        |
| PUT    | `/api/certificaciones/{id}` | Actualiza una certificación.   |
| DELETE | `/api/certificaciones/{id}` | Elimina una certificación.     |

Java y Go implementan cada uno el mismo contrato en su lenguaje; **no se
comparte código entre ellos, solo el contrato**.

### Login simulado

- El único empleado sembrado (`id=1`) tiene el username **`admin`**.
- Se entra si el `username` coincide; **cualquier contraseña es válida**.
- La sesión se mantiene con una cookie: `JSESSIONID` en Java, `session_id` en Go.
- El frontend debe hacer las peticiones con `credentials: 'include'`.

### Perfil del empleado (7 campos)

`nombre`, `email`, `telefono`, `puesto`, `departamento`, `direccion`, `foto`.

## Base de datos

Un único servicio **PostgreSQL 16** en su propio contenedor (definido en
[`docker-compose.yml`](docker-compose.yml)), **compartido** por ambos backends:
los dos se conectan a la misma BBDD `portal` (usuario/clave `portal` por
defecto, configurables con `DB_*`). Los datos persisten en el volumen Docker
`portal-db-data`, no en el sistema de ficheros del repo.

El esquema lo definen las migraciones de
[`shared/migrations/`](shared/migrations): ficheros `NNN_descripcion.sql` (en
sintaxis Postgres) que **ambos backends aplican al arrancar** (la tabla
`schema_migration` registra cuáles corrieron ya, así el primero que arranca
las aplica y el otro las reconoce). Hibernate está en `ddl-auto=none` — ni
Java ni Go crean esquema por su cuenta. Para cambiar el esquema: añade una
migración nueva, nunca edites una aplicada. La siembra de datos demo
(empleado + certificaciones) sigue en el código de cada backend y es idéntica
en los dos.

## Puesta en marcha

Requisitos según lo que quieras arrancar: **Java 25 + Maven**, **Go 1.24+**,
**Node 22+**, y **Docker** (al menos para el Postgres). Hay un `Makefile` con
atajos — `make help` los lista.

### En local (backends/frontends nativos + Postgres en Docker)

```bash
make db-up        # levanta SOLO el Postgres compartido (5432)

make run-java     # backend Java   en http://localhost:8080
make run-go       # backend Go     en http://localhost:8081
make run-react    # frontend React en http://localhost:5173 (dev server, contra el Java)
make run-vue      # frontend Vue   en http://localhost:5174 (dev server, contra el Go)
# o todo a la vez (db-up incluido):
make dev
```

### Con Docker

Cada stack incluye el `docker-compose.yml` base, así que el Postgres es el
mismo levantes el stack que levantes (uno, otro, o los dos a la vez):

```bash
make up-java-react     # postgres + backend Java (8080) + frontend React estático (5173)
make up-go-vue         # postgres + backend Go   (8081) + frontend Vue estático   (5174)

make down-java-react   # parar
make down-go-vue
```

En Docker los frontends se sirven como **build estático con nginx** en los
mismos puertos 5173/5174 (en local `make run-react`/`run-vue` siguen usando el
dev server de Vite con hot-reload). `VITE_API_BASE` se pasa como *build-arg* y
queda horneada en el build.

### Probar la API

```bash
# Login (guarda la cookie de sesión)
curl -c cookies.txt -X POST http://localhost:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"lo-que-sea"}'

# Perfil
curl -b cookies.txt http://localhost:8080/api/me

# Actualizar perfil
curl -b cookies.txt -X PUT http://localhost:8080/api/me \
  -H 'Content-Type: application/json' \
  -d '{"puesto":"Tech Lead","telefono":"+34 611 000 999"}'

# Logout
curl -b cookies.txt -X POST http://localhost:8080/api/logout
```

Cambia el puerto a `8081` para probar exactamente lo mismo contra el backend Go.

### Tests de contrato

Con el/los backend(s) arrancados, `scripts/contract-test.mjs` ejecuta la misma
batería de comprobaciones del contrato contra cada uno (login, perfil,
CRUD de certificaciones, códigos de error) y deja la BBDD como estaba:

```bash
make verify-java   # contra el backend Java (8080)
make verify-go     # contra el backend Go (8081)
make verify        # contra ambos + comparación de paridad de respuestas
```

El modo con dos backends comprueba además que ambos respondan con el mismo
status y la misma forma de JSON en cada caso — la red de seguridad contra la
divergencia entre implementaciones.

## Backends

### `backend-java/` — Spring Boot 4.1.0 (Java 25)

Dependencias: `web`, `data-jpa`, driver `postgresql` (sin Spring Security).
CORS abierto a `http://localhost:5173`. Sesión vía `HttpSession`. Configurable
por variables de entorno (`SERVER_PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD`, `MIGRATIONS_PATH`, `CORS_ALLOWED_ORIGIN`,
`SEED_USERNAME`).

### `backend-go/` — Go + pgx

Router con `net/http` (patrones método+ruta de Go 1.22+) y driver
`jackc/pgx` vía `database/sql` (Go puro, sin CGO — se dockeriza en una imagen
`distroless` minúscula). Sesión propia por cookie respaldada por un almacén en
memoria. Mismas variables de entorno que el backend Java.

## Frontends

Ambos replican el diseño del portal original de Nunegal y comparten los mismos
estilos (`styles.css`) y la misma lógica (`src/lib/`); solo cambian los
componentes (JSX vs SFC). Pantallas:

- **Login** — logo, «Acceso al Portal del Empleado», usuario/contraseña.
- **Datos del empleado** (pantalla inicial) — perfil con los 7 campos, editable.
- **Vacaciones** — calendario anual con festivos, días disfrutados/marcados,
  resumen por barras y leyenda (datos estáticos de demo).
- **Conocimientos / Certificaciones** — CRUD completo contra la BBDD: tabla con
  búsqueda, orden por columnas, paginación y tamaño de página, más alta/edición
  (modal) y borrado con confirmación. Sin adjuntar archivos.
- **Resto de secciones** — mensaje animado de «Sección no disponible» para la demo.

Detalles en [`frontend-react/README.md`](frontend-react/README.md) y
[`frontend-vue/README.md`](frontend-vue/README.md).

## Instrucciones para agentes

Las reglas de implementación, paridad entre stacks y verificación para agentes
están en [`AGENTS.md`](AGENTS.md). La guía también se aplica a Claude Code
mediante [`CLAUDE.md`](CLAUDE.md).

## Fuera de alcance

- **GitHub**: se gestiona aparte.
- **Playwright / tests e2e**: descartados.
- **Kubernetes**: no aplica; son contenedores de Docker Compose.
