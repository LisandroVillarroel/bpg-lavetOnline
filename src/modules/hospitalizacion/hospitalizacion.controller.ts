import { Request, Response } from 'express';

import Atencion from '../atencion/atencion.model';
import Ficha from '../ficha/ficha.model';
import { getVeterinaryAccess, isAllowedCompany } from '../../core/utils/veterinary-access';
import Hospitalizacion from './hospitalizacion.model';
import EvolucionHospitalizacion from './evolucion-hospitalizacion.model';

const response = <T>(data: T | null = null, mensaje = 'ok', error = false, codigo = 200) => ({
  error,
  data,
  codigo,
  mensaje,
});

async function validarFicha(req: Request, fichaId: string) {
  const access = await getVeterinaryAccess(req);
  const ficha = await Ficha.findById(fichaId).select('empresa_Id propietario_Id estado').lean();
  const autorizado =
    !!access &&
    !!ficha &&
    ficha.estado !== 'Borrado' &&
    isAllowedCompany(access, String(ficha.empresa_Id)) &&
    (!access.esPropietario || String(ficha.propietario_Id) === access.userId);
  return autorizado ? { access, ficha } : null;
}

export async function listar(req: Request, res: Response) {
  const access = await getVeterinaryAccess(req);
  const empresaId = String(req.query.empresa_Id ?? access?.empresaId ?? '');
  if (!access || !empresaId || !isAllowedCompany(access, empresaId)) {
    return res.status(200).json(response(null, 'Empresa no autorizada', true, 403));
  }
  const filtro = {
    empresa_Id: empresaId,
    estado: { $ne: 'Borrado' },
    ...(access.esPropietario ? { propietario_Id: access.userId } : {}),
  };
  const fichas = access.esPropietario
    ? await Ficha.find({ empresa_Id: empresaId, propietario_Id: access.userId })
        .select('_id')
        .lean()
    : [];
  const atenciones = access.esPropietario ? fichas.map((ficha) => ficha._id) : undefined;
  const registros = await Hospitalizacion.find({
    ...filtro,
    ...(atenciones ? { ficha_Id: { $in: atenciones } } : {}),
  }).sort({ fechaIngreso: -1 });
  return res.status(200).json(response(registros, 'Hospitalizaciones obtenidas correctamente'));
}

export async function obtener(req: Request, res: Response) {
  const registro = await Hospitalizacion.findById(req.params.id);
  const access = await getVeterinaryAccess(req);
  if (!registro || !access || !isAllowedCompany(access, String(registro.empresa_Id))) {
    return res.status(200).json(response(null, 'Hospitalización no encontrada', true, 404));
  }
  const ficha = await Ficha.findById(registro.ficha_Id).select('propietario_Id').lean();
  if (access.esPropietario && String(ficha?.propietario_Id) !== access.userId) {
    return res.status(200).json(response(null, 'Hospitalización no autorizada', true, 403));
  }
  return res.status(200).json(response(registro, 'Hospitalización encontrada'));
}

export async function crear(req: Request, res: Response) {
  const fichaId = String(req.body?.ficha_Id ?? '');
  const validacion = await validarFicha(req, fichaId);
  const atencion = await Atencion.findOne({
    _id: req.body?.atencionIngreso_Id,
    ficha_Id: fichaId,
    estado: 'Activo',
  })
    .select('_id')
    .lean();
  if (!validacion || !atencion) {
    return res.status(200).json(response(null, 'Ficha o atención no autorizada', true, 403));
  }
  const existente = await Hospitalizacion.findOne({
    atencionIngreso_Id: atencion._id,
    estado: { $ne: 'Borrado' },
  });
  if (existente) {
    return res
      .status(200)
      .json(response(null, 'La atención ya tiene una hospitalización', true, 409));
  }
  const registro = await Hospitalizacion.create({
    ...req.body,
    ficha_Id: fichaId,
    empresa_Id: validacion.ficha.empresa_Id,
    atencionIngreso_Id: atencion._id,
    usuarioCrea_id: validacion.access?.userId,
  });
  return res.status(201).json(response(registro, 'Hospitalización creada correctamente'));
}

export async function actualizar(req: Request, res: Response) {
  const actual = await Hospitalizacion.findById(req.params.id);
  const access = await getVeterinaryAccess(req);
  if (!actual || !access || !isAllowedCompany(access, String(actual.empresa_Id))) {
    return res.status(200).json(response(null, 'Hospitalización no autorizada', true, 403));
  }
  const ficha = await Ficha.findById(actual.ficha_Id).select('propietario_Id').lean();
  if (access.esPropietario && String(ficha?.propietario_Id) !== access.userId) {
    return res.status(200).json(response(null, 'Hospitalización no autorizada', true, 403));
  }
  const registro = await Hospitalizacion.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      empresa_Id: actual.empresa_Id,
      ficha_Id: actual.ficha_Id,
      usuarioModifica_id: access.userId,
      fechaHora_Modifica: new Date(),
    },
    { new: true },
  );
  return res.status(200).json(response(registro, 'Hospitalización actualizada correctamente'));
}

export async function eliminar(req: Request, res: Response) {
  const actual = await Hospitalizacion.findById(req.params.id);
  const access = await getVeterinaryAccess(req);
  if (!actual || !access || !isAllowedCompany(access, String(actual.empresa_Id))) {
    return res.status(200).json(response(null, 'Hospitalización no autorizada', true, 403));
  }
  const registro = await Hospitalizacion.findByIdAndUpdate(
    req.params.id,
    { estado: 'Borrado', usuarioModifica_id: access.userId, fechaHora_Modifica: new Date() },
    { new: true },
  );
  return res.status(200).json(response(registro, 'Hospitalización eliminada correctamente'));
}

export async function listarEvoluciones(req: Request, res: Response) {
  const hospitalizacion = await Hospitalizacion.findById(req.params.id)
    .select('empresa_Id ficha_Id')
    .lean();
  const access = await getVeterinaryAccess(req);
  const ficha = hospitalizacion
    ? await Ficha.findById(hospitalizacion.ficha_Id).select('propietario_Id').lean()
    : null;
  if (
    !hospitalizacion ||
    !access ||
    !isAllowedCompany(access, String(hospitalizacion.empresa_Id)) ||
    (access.esPropietario && String(ficha?.propietario_Id) !== access.userId)
  ) {
    return res.status(200).json(response(null, 'Hospitalización no autorizada', true, 403));
  }
  const registros = await EvolucionHospitalizacion.find({ hospitalizacion_Id: req.params.id }).sort(
    { fechaHora: -1 },
  );
  return res.status(200).json(response(registros, 'Evoluciones obtenidas correctamente'));
}

export async function crearEvolucion(req: Request, res: Response) {
  const hospitalizacion = await Hospitalizacion.findById(req.params.id)
    .select('empresa_Id ficha_Id')
    .lean();
  const access = await getVeterinaryAccess(req);
  const ficha = hospitalizacion
    ? await Ficha.findById(hospitalizacion.ficha_Id).select('propietario_Id').lean()
    : null;
  if (
    !hospitalizacion ||
    !access ||
    !isAllowedCompany(access, String(hospitalizacion.empresa_Id)) ||
    (access.esPropietario && String(ficha?.propietario_Id) !== access.userId)
  ) {
    return res.status(200).json(response(null, 'Hospitalización no autorizada', true, 403));
  }
  const registro = await EvolucionHospitalizacion.create({
    ...req.body,
    hospitalizacion_Id: hospitalizacion._id,
    empresa_Id: hospitalizacion.empresa_Id,
    usuarioCrea_id: access.userId,
  });
  return res.status(201).json(response(registro, 'Evolución creada correctamente'));
}
