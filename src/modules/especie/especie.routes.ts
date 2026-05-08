import { Router } from 'express';
import * as especieCtrl from './especie.controller';

const router = Router();

router.get('/', especieCtrl.getAll);
router.get('/:id', especieCtrl.getById);
router.post('/', especieCtrl.create);
router.put('/:id', especieCtrl.update);
router.delete('/:id', especieCtrl.remove);

export default router;
