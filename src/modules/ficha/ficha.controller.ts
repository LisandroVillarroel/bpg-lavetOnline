import { Request, Response } from 'express';
import Ficha from './ficha.model';
import { getVeterinaryAccess, isAllowedCompany } from '../../core/utils/veterinary-access';

const buildResponse = <T>(
  overrides?: Partial<{ error: boolean; data: T | null; codigo: number; mensaje: string }>,
) => ({
  error: false,
  data: null,
  codigo: 200,
  mensaje: 'ok',
  ...overrides,
});

const fichaPopulate = [
  {
    path: 'propietario_Id',
    select: 'nombres apellidoPaterno apellidoMaterno rutUsuario telefono email',
  },
  { path: 'especie_Id', select: 'nombre' },
  { path: 'raza_Id', select: 'nombre' },
];

export async function obtenerFichasPorEmpresa(req: Request, res: Response) {
  try {
    const { empresaId } = req.params;
    const access = await getVeterinaryAccess(req);
    if (!access || !isAllowedCompany(access, empresaId)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }
    const filtro: Record<string, unknown> = {
      estado: 'Activo',
      empresa_Id: empresaId,
    };

    const fichas = await Ficha.find(filtro).populate(fichaPopulate).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: fichas,
        mensaje: 'Fichas obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener fichas',
      }),
    );
  }
}

export async function obtenerFichasPorPropietario(req: Request, res: Response) {
  try {
    const { propietarioId } = req.params;
    const access = await getVeterinaryAccess(req);
    if (!access || (access.esPropietario && access.userId !== propietarioId)) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Propietario no autorizado' }));
    }
    const filtro = {
      estado: 'Activo',
      propietario_Id: propietarioId,
    };
    if (access.empresaId) {
      Object.assign(filtro, { empresa_Id: access.empresaId });
    }

    const fichas = await Ficha.find(filtro).populate(fichaPopulate).sort({ nombre: 1 });

    return res.status(200).json(
      buildResponse({
        data: fichas,
        mensaje: 'Fichas obtenidas correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al obtener fichas del propietario',
      }),
    );
  }
}

export async function obtenerFichaPorId(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const fichaBase = await Ficha.findById(req.params.id)
      .select('empresa_Id propietario_Id')
      .lean();
    if (
      !access ||
      !fichaBase ||
      (access.empresaId && !isAllowedCompany(access, String(fichaBase.empresa_Id))) ||
      (access.esPropietario && String(fichaBase.propietario_Id) !== access.userId)
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Ficha no autorizada' }));
    }
    const ficha = await Ficha.findById(req.params.id).populate(fichaPopulate);

    if (!ficha || ficha.estado === 'Borrado') {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Ficha no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: ficha,
        mensaje: 'Ficha encontrada',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al buscar ficha',
      }),
    );
  }
}

export async function crearFicha(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const empresaId = access?.empresaId;
    if (!access || !empresaId) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Empresa no autorizada' }));
    }
    const propietarioId = access.esPropietario ? access.userId : req.body?.propietario_Id;
    if (!propietarioId) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 400, mensaje: 'Propietario es requerido' }));
    }
    const ficha = new Ficha({
      ...req.body,
      empresa_Id: empresaId,
      propietario_Id: propietarioId,
      estado: 'Activo',
      fechaHora_Crea: new Date(),
    });

    await ficha.save();
    await ficha.populate(fichaPopulate);

    return res.status(200).json(
      buildResponse({
        data: ficha,
        mensaje: 'Ficha creada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al crear ficha',
      }),
    );
  }
}

export async function modificarFicha(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const fichaBase = await Ficha.findById(req.params.id)
      .select('empresa_Id propietario_Id')
      .lean();
    if (
      !access ||
      !fichaBase ||
      !isAllowedCompany(access, String(fichaBase.empresa_Id)) ||
      (access.esPropietario && String(fichaBase.propietario_Id) !== access.userId)
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Ficha no autorizada' }));
    }
    const ficha = await Ficha.findOneAndUpdate(
      {
        _id: req.params.id,
        empresa_Id: fichaBase.empresa_Id,
        ...(access.esPropietario ? { propietario_Id: access.userId } : {}),
      },
      {
        ...req.body,
        empresa_Id: fichaBase.empresa_Id,
        ...(access.esPropietario ? { propietario_Id: access.userId } : {}),
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(fichaPopulate);

    if (!ficha) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Ficha no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: ficha,
        mensaje: 'Ficha actualizada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al actualizar ficha',
      }),
    );
  }
}

export async function eliminarFicha(req: Request, res: Response) {
  try {
    const access = await getVeterinaryAccess(req);
    const usuarioModifica_id = req.user?._id || req.user?.id;
    const fichaBase = await Ficha.findById(req.params.id)
      .select('empresa_Id propietario_Id')
      .lean();
    if (
      !access ||
      !fichaBase ||
      !isAllowedCompany(access, String(fichaBase.empresa_Id)) ||
      (access.esPropietario && String(fichaBase.propietario_Id) !== access.userId)
    ) {
      return res
        .status(200)
        .json(buildResponse({ error: true, codigo: 403, mensaje: 'Ficha no autorizada' }));
    }
    const ficha = await Ficha.findOneAndUpdate(
      {
        _id: req.params.id,
        empresa_Id: fichaBase.empresa_Id,
        ...(access.esPropietario ? { propietario_Id: access.userId } : {}),
      },
      {
        estado: 'Borrado',
        usuarioModifica_id,
        fechaHora_Modifica: new Date(),
      },
      { new: true },
    ).populate(fichaPopulate);

    if (!ficha) {
      return res.status(200).json(
        buildResponse({
          error: true,
          codigo: 404,
          mensaje: 'Ficha no encontrada',
        }),
      );
    }

    return res.status(200).json(
      buildResponse({
        data: ficha,
        mensaje: 'Ficha eliminada correctamente',
      }),
    );
  } catch {
    return res.status(200).json(
      buildResponse({
        error: true,
        codigo: 500,
        mensaje: 'Error al eliminar ficha',
      }),
    );
  }
}
