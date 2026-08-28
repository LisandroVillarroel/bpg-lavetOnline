import { Router } from 'express';

import * as tipoAtencionCtrl from './tipo-atencion.controller';

const router = Router();

router.get('/', tipoAtencionCtrl.getAll);
router.get('/:id', tipoAtencionCtrl.getById);
router.post('/', tipoAtencionCtrl.create);
router.put('/:id', tipoAtencionCtrl.update);
router.delete('/:id', tipoAtencionCtrl.remove);

export default router;
