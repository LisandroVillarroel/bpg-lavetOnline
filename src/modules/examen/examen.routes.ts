import { Router } from 'express';

import * as examenCtrl from './examen.controller';

const router = Router();

router.get('/', examenCtrl.getAll);
router.get('/:id', examenCtrl.getById);
router.post('/', examenCtrl.create);
router.put('/:id', examenCtrl.update);
router.delete('/:id', examenCtrl.remove);

export default router;
