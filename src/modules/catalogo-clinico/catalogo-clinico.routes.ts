import { Router } from 'express';

import * as catalogoClinicoCtrl from './catalogo-clinico.controller';

const router = Router();

router.get('/', catalogoClinicoCtrl.getAll);
router.get('/:id', catalogoClinicoCtrl.getById);
router.post('/', catalogoClinicoCtrl.create);
router.put('/:id', catalogoClinicoCtrl.update);
router.delete('/:id', catalogoClinicoCtrl.remove);

export default router;
