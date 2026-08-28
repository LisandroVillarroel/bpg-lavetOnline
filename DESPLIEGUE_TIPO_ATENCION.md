# Despliegue Tipo de Atencion

Este documento resume los pasos para habilitar el mantenedor y uso de Tipo de Atencion en entorno operativo.

## 1) Actualizar menu base Veterinaria (coleccion menus)

Ejecutar:

- npm run menu:veterinaria:atencion

Script utilizado:

- scripts/update-menu-veterinaria-mantenedores-atencion.mongosh.js

## 2) Actualizar menu por empresa

Para una empresa puntual:

- Editar scripts/update-empresa-menu-veterinaria-mantenedores-atencion.mongosh.js
- Reemplazar REEMPLAZAR_EMPRESA_ID
- Ejecutar: npm run menu:empresa:veterinaria:atencion

Para todas las empresas tipo Veterinaria:

- npm run menu:empresas:veterinaria:atencion:all

Script utilizado:

- scripts/update-empresas-veterinaria-mantenedores-atencion-all.mongosh.js

## 3) Cargar tipos de atencion por defecto

Ejecutar:

- npm run seed:tipos-atencion:veterinaria

Script utilizado:

- scripts/import-tipos-atencion-default-veterinaria.mongosh.js

## 4) Verificar API

Endpoints:

- GET /api/tipo-atencion?empresa_Id=<empresaId>
- POST /api/tipo-atencion
- PUT /api/tipo-atencion/:id
- DELETE /api/tipo-atencion/:id

## 5) Verificar Frontend

Ruta del mantenedor:

- /mantenedores/tipo-atencion

Formulario de atencion:

- /veterinaria/atenciones

Nota operativa:

- El menu lateral se construye desde MenuItem del usuario/empresa en sesion.
- Despues de actualizar menu en BD, el usuario debe cerrar sesion y volver a ingresar.

## 6) Coleccion Postman recomendada

Archivo:

- postman/despliegue-tipo-atencion.postman_collection.json

Incluye requests para:

- Obtener menu Veterinaria
- Actualizar menu Veterinaria
- Actualizar menu de empresa
- Listar tipos de atencion
- Crear tipo de atencion de prueba
