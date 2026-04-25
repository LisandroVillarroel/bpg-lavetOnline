import { Router } from 'express';
import {
  crearRegionComuna,
  crearRegionesComunasMasivas,
  modificarRegionComuna,
  eliminarRegionComuna,
  obtenerRegionComunaPorId,
  obtenerRegionComunas,
} from './region-comuna.controller';

const router = Router();

router.post('/', crearRegionComuna);
router.post('/masiva', crearRegionesComunasMasivas);
router.put('/modificar/:id', modificarRegionComuna);
router.delete('/eliminar/:id', eliminarRegionComuna);
router.get('/consulta/:id', obtenerRegionComunaPorId);
router.get('/consultaTotal', obtenerRegionComunas);

export default router;
