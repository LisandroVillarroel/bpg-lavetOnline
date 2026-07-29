import { Router } from 'express';
import * as atencionCtrl from './atencion.controller';

const router = Router();

router.get('/empresa/:empresaId', atencionCtrl.obtenerAtencionesPorEmpresa);
router.get('/mascota/:mascotaId', atencionCtrl.obtenerAtencionesPorMascota);
router.get('/propietario/:propietarioId', atencionCtrl.obtenerAtencionesPorPropietario);
router.get('/:id', atencionCtrl.obtenerAtencionPorId);
router.post('/', atencionCtrl.crearAtencion);
router.put('/:id', atencionCtrl.modificarAtencion);
router.delete('/:id', atencionCtrl.eliminarAtencion);

export default router;
