import { Router } from 'express';
import * as fichaCtrl from './ficha.controller';

const router = Router();

router.get('/empresa/:empresaId', fichaCtrl.obtenerFichasPorEmpresa);
router.get('/propietario/:propietarioId', fichaCtrl.obtenerFichasPorPropietario);
router.get('/:id', fichaCtrl.obtenerFichaPorId);
router.post('/', fichaCtrl.crearFicha);
router.put('/:id', fichaCtrl.modificarFicha);
router.delete('/:id', fichaCtrl.eliminarFicha);

export default router;
