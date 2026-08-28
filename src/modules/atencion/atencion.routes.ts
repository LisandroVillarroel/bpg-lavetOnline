import { Router } from 'express';
import * as atencionCtrl from './atencion.controller';

const router = Router();

router.get('/empresa/:empresaId', atencionCtrl.obtenerAtencionesPorEmpresa);
router.get('/ficha/:fichaId', atencionCtrl.obtenerAtencionesPorFicha);
router.get('/vacunas/proximas', atencionCtrl.obtenerVacunasProximas);
router.get('/reporteria/resumen', atencionCtrl.obtenerResumenReporteria);
router.get('/:id', atencionCtrl.obtenerAtencionPorId);
router.post('/', atencionCtrl.crearAtencion);
router.put('/:id', atencionCtrl.modificarAtencion);
router.delete('/:id', atencionCtrl.eliminarAtencion);

export default router;
