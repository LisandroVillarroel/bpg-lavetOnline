import { Router } from 'express';

import * as procedimientoCtrl from './procedimiento.controller';

const router = Router();

router.get('/', procedimientoCtrl.getAll);
router.get('/:id', procedimientoCtrl.getById);
router.post('/', procedimientoCtrl.create);
router.put('/:id', procedimientoCtrl.update);
router.delete('/:id', procedimientoCtrl.remove);

export default router;
