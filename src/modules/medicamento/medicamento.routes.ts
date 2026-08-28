import { Router } from 'express';

import * as medicamentoCtrl from './medicamento.controller';

const router = Router();

router.get('/', medicamentoCtrl.getAll);
router.get('/:id', medicamentoCtrl.getById);
router.post('/', medicamentoCtrl.create);
router.put('/:id', medicamentoCtrl.update);
router.delete('/:id', medicamentoCtrl.remove);

export default router;
