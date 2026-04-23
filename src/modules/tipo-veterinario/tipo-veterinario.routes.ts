import { Router } from 'express';
import {
  crearTipoVeterinario,
  modificarTipoVeterinario,
  eliminarTipoVeterinario,
  obtenerTipoVeterinarioPorId,
  obtenerTiposVeterinario,
} from './tipo-veterinario.controller';

const router = Router();

router.post('/', crearTipoVeterinario);
router.put('/modificar/:id', modificarTipoVeterinario);
router.delete('/eliminar/:id', eliminarTipoVeterinario);
router.get('/consulta/:id', obtenerTipoVeterinarioPorId);
router.get('/consultaTotal', obtenerTiposVeterinario);

export default router;
