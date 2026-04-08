import { Router } from 'express';
import {
  obtenerUsuarios,
  obtenerUsuarioPorUsuario,
  agregarUsuario,
  modificarUsuario,
  eliminarUsuario,
  modificarMenuUsuario,
} from './usuario.controller';

const router = Router();

// Consultar todos los usuarios activos
router.get('/', obtenerUsuarios);
// Consultar usuario por nombre de usuario
router.get('/:usuario', obtenerUsuarioPorUsuario);
// Agregar usuario
router.post('/', agregarUsuario);
// Modificar usuario
router.put('/:id', modificarUsuario);
// Modificar solo el menú del usuario
router.put('/:id/menu', modificarMenuUsuario);
// Eliminar usuario (lógico)
router.delete('/:id', eliminarUsuario);

export default router;
