---
name: semantic-commits
description: Escribe mensajes de commit en formato Conventional Commits, con tipo y modulo. Usar al redactar o crear commits.
---

# Commits Semanticos

Usa `tipo(modulo): descripcion breve`. Escribe tipo y modulo en minusculas; el
modulo identifica el area afectada, como `api`, `backend-go`, `frontend-vue`,
`shared` o `docs`.

Tipos habituales: `feat` (funcionalidad), `fix` (correccion), `docs`,
`refactor`, `perf`, `style`, `test`, `build`, `ci`, `chore` y `revert`.

Ejemplos:

```text
feat(frontend-vue): anadir consulta de certificaciones
fix(backend-go): validar el empleado de la sesion
docs(api): aclarar el formato de fechas
refactor(backend-java): extraer el mapeo de certificaciones
```

Para un cambio incompatible, añade `!` antes de `:`, por ejemplo
`feat(api)!: cambiar la respuesta del perfil`.