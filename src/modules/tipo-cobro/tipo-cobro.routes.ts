import { Router } from 'express';

import * as tipoCobroCtrl from './tipo-cobro.controller';

const router = Router();

router.get('/', tipoCobroCtrl.getAll);
router.get('/:id', tipoCobroCtrl.getById);
router.post('/', tipoCobroCtrl.create);
router.put('/:id', tipoCobroCtrl.update);
router.delete('/:id', tipoCobroCtrl.remove);

export default router;
