import { Router } from 'express';
import * as inventarioCtrl from './inventario.controller';

const router = Router();

router.get('/', inventarioCtrl.listar);
router.post('/', inventarioCtrl.crear);
router.post('/movimientos', inventarioCtrl.mover);
router.get('/movimientos', inventarioCtrl.movimientos);

export default router;
