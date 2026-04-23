import { Router } from 'express';
import {
  crearRolVeterinario,
  modificarRolVeterinario,
  eliminarRolVeterinario,
  obtenerRolVeterinarioPorId,
  obtenerRolesVeterinario,
} from './rol-veterinario.controller';

const router = Router();

router.post('/', crearRolVeterinario);
router.put('/modificar/:id', modificarRolVeterinario);
router.delete('/eliminar/:id', eliminarRolVeterinario);
router.get('/consulta/:id', obtenerRolVeterinarioPorId);
router.get('/consultaTotal', obtenerRolesVeterinario);

export default router;
