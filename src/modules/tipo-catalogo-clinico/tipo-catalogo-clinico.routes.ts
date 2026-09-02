import { Router } from 'express';
import * as tipoCatalogoClinicoCtrl from './tipo-catalogo-clinico.controller';

const router = Router();

router.get('/', tipoCatalogoClinicoCtrl.getAll);
router.post('/', tipoCatalogoClinicoCtrl.create);
router.put('/:id', tipoCatalogoClinicoCtrl.update);
router.delete('/:id', tipoCatalogoClinicoCtrl.remove);

export default router;
