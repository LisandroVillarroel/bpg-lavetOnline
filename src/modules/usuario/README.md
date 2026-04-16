Este módulo contiene el CRUD de usuario (agregar, modificar, consultar, eliminar lógico) para el backend.

- Controlador: usuario.controller.ts
- Rutas: usuario.routes.ts

La ruta base es /api/usuario

Rutas principales:

- GET /api/usuario/empresa/:empresaId
- GET /api/usuario/por-usuario/:usuario
- POST /api/usuario
- PUT /api/usuario/:id
- PUT /api/usuario/:id/menu
- PUT /api/usuario/:id/tema-color
- DELETE /api/usuario/:id
