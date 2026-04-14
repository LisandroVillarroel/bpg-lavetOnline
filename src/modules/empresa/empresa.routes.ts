import { Router } from 'express';
import {
  agregarEmpresa,
  modificarEmpresa,
  eliminarEmpresa,
  obtenerEmpresaPorId,
  obtenerEmpresas,
  modificarMenuEmpresa,
} from './empresa.controller';

const router = Router();

// CRUD principal
router.post('/', agregarEmpresa);
router.put('/modificar/:id', modificarEmpresa);
router.put('/eliminar/:id', eliminarEmpresa); // Eliminación lógica (PUT)
router.get('/consulta/:id', obtenerEmpresaPorId);
router.get('/consultaTotal', obtenerEmpresas);

// Modificar solo el menú
router.put('/modificar-menu/:id', modificarMenuEmpresa);

export default router;
