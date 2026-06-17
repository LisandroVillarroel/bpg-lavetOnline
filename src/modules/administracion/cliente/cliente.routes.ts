import { Router } from 'express';

import {
  agregarCliente,
  eliminarCliente,
  modificarCliente,
  obtenerClientePorId,
  obtenerClientePorUsuario,
  obtenerClientes,
} from './cliente.controller';

const router = Router();

router.get('/empresa/:empresaId', obtenerClientes);
router.get('/:id', obtenerClientePorId);
router.get('/por-usuario/:usuario', obtenerClientePorUsuario);
router.post('/', agregarCliente);
router.put('/:id', modificarCliente);
router.delete('/:id', eliminarCliente);

export default router;
