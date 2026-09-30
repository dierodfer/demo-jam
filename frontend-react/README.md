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
