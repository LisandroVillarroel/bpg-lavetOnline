import { Router } from 'express';
import * as hospitalizacionCtrl from './hospitalizacion.controller';

const router = Router();

router.get('/', hospitalizacionCtrl.listar);
router.get('/:id/evoluciones', hospitalizacionCtrl.listarEvoluciones);
router.post('/:id/evoluciones', hospitalizacionCtrl.crearEvolucion);
router.get('/:id', hospitalizacionCtrl.obtener);
router.post('/', hospitalizacionCtrl.crear);
router.put('/:id', hospitalizacionCtrl.actualizar);
router.delete('/:id', hospitalizacionCtrl.eliminar);

export default router;
