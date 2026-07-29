import { Router } from 'express';
import * as mascotaCtrl from './mascota.controller';

const router = Router();

router.get('/empresa/:empresaId', mascotaCtrl.obtenerMascotasPorEmpresa);
router.get('/propietario/:propietarioId', mascotaCtrl.obtenerMascotasPorPropietario);
router.get('/:id', mascotaCtrl.obtenerMascotaPorId);
router.post('/', mascotaCtrl.crearMascota);
router.put('/:id', mascotaCtrl.modificarMascota);
router.delete('/:id', mascotaCtrl.eliminarMascota);

export default router;
