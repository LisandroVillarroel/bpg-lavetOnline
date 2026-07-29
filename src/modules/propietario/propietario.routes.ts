import { Router } from 'express';

import {
  agregarPropietario,
  eliminarPropietario,
  modificarPropietario,
  obtenerPropietarioPorId,
  obtenerPropietarioPorUsuario,
  obtenerPropietarios,
} from './propietario.controller';

const router = Router();

router.get('/empresa/:empresaId', obtenerPropietarios);
router.get('/:id', obtenerPropietarioPorId);
router.get('/por-usuario/:usuario', obtenerPropietarioPorUsuario);
router.post('/', agregarPropietario);
router.put('/:id', modificarPropietario);
router.delete('/:id', eliminarPropietario);

export default router;
