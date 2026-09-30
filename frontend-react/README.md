# frontend-react

Frontend del Portal de Empleado (puerto **5173**). La descripción del proyecto,
las pantallas y la puesta en marcha están en el [README principal](../README.md).

Se lanza desde la raíz del repo con `make`: `make run-react` (desarrollo),
`make build-react` (build de producción) o `make up-java-react` (Docker).

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:8080` | URL base de la API |

Las peticiones usan `credentials: 'include'` para la cookie de sesión.

En Docker, el frontend se sirve como build estático con nginx; en local, Vite
ofrece recarga en caliente.

## Objetos perdidos

La vista de devolución (`EntregaObjeto.jsx`) anima con `motion` (Framer Motion)
el paso del objeto entre dos avatares y respeta `prefers-reduced-motion`.

## Tests E2E

`make test-e2e` ejecuta los tests de Playwright de `e2e/` en local (no en CI).
Requiere PostgreSQL y el backend arrancados. Usa Google Chrome instalado
(`E2E_CHANNEL=chromium` para el de Playwright tras `npx playwright install
chromium`). Variables opcionales: `VITE_API_BASE` (API) y `E2E_PORT` (puerto de
Vite, 5173 por defecto; el backend debe permitir ese origen en
`CORS_ALLOWED_ORIGIN`).
