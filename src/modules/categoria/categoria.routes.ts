import { Router } from 'express';

import * as categoriaCtrl from './categoria.controller';

const router = Router();

router.get('/', categoriaCtrl.getAll);
router.get('/:id', categoriaCtrl.getById);
router.post('/', categoriaCtrl.create);
router.put('/:id', categoriaCtrl.update);
router.delete('/:id', categoriaCtrl.remove);

export default router;
