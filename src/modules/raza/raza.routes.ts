import { Router } from 'express';
import * as razaCtrl from './raza.controller';

const router = Router();

router.get('/', razaCtrl.obtenerRazas);
router.post('/', razaCtrl.crearRaza);
router.put('/:id', razaCtrl.modificarRaza);
router.delete('/:id', razaCtrl.eliminarRaza);

export default router;
